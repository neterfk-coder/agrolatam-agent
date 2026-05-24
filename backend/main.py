from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from agent import AgroLatamAgent
from datetime import datetime

load_dotenv()

# ── Supabase ──────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="AgroLatam Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = AgroLatamAgent()

# ── Models ────────────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    message: str
    user_id: str | None = None

class FarmerProfile(BaseModel):
    user_id: str
    full_name: str
    country: str
    crop: str

# ── Prices ────────────────────────────────────────────────────────────────────
PRICES = {
    "coffee": {"price": 2.34,  "change": -3.2, "unit": "USD/lb",     "exchange": "ICE NY"},
    "cacao":  {"price": 3812,  "change":  1.8,  "unit": "USD/ton",    "exchange": "ICE London"},
    "corn":   {"price": 4.52,  "change":  0.5,  "unit": "USD/bushel", "exchange": "CME"},
    "banana": {"price": 0.89,  "change": -1.1,  "unit": "USD/kg",     "exchange": "FAO"},
    "soy":    {"price": 11.20, "change":  2.3,  "unit": "USD/bushel", "exchange": "CME"},
}

@app.get("/api/prices")
async def get_prices():
    # Guardar snapshot de precios en Supabase
    try:
        rows = [
            {
                "crop": crop,
                "price": data["price"],
                "change_pct": data["change"],
                "exchange": data["exchange"],
                "recorded_at": datetime.utcnow().isoformat(),
            }
            for crop, data in PRICES.items()
        ]
        sb.table("prices").insert(rows).execute()
    except Exception:
        pass  # No bloquear si Supabase falla
    return PRICES

# ── Weather ───────────────────────────────────────────────────────────────────
@app.get("/api/weather")
async def get_weather():
    countries = [
        {"name": "Peru",     "lat": -9.19,   "lon": -75.015},
        {"name": "Colombia", "lat":  4.570,  "lon": -74.297},
        {"name": "Ecuador",  "lat": -1.831,  "lon": -78.183},
        {"name": "Brazil",   "lat": -14.235, "lon": -51.925},
        {"name": "Bolivia",  "lat": -16.290, "lon": -63.589},
        {"name": "Argentina","lat": -38.416, "lon": -63.617},
        {"name": "Mexico",   "lat":  23.634, "lon": -102.552},
    ]
    results = []
    async with httpx.AsyncClient(timeout=10) as client:
        for c in countries:
            try:
                r = await client.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params={
                        "latitude":     c["lat"],
                        "longitude":    c["lon"],
                        "daily":        "precipitation_sum,temperature_2m_max",
                        "forecast_days": 3,
                        "timezone":     "America/Lima",
                    },
                )
                data = r.json()
                results.append({
                    "country":  c["name"],
                    "rain_72h": round(sum(data["daily"]["precipitation_sum"]), 1),
                    "max_temp": round(max(data["daily"]["temperature_2m_max"]), 1),
                })
            except Exception:
                results.append({"country": c["name"], "rain_72h": 0, "max_temp": 0})
    return results

# ── Alerts ────────────────────────────────────────────────────────────────────
@app.get("/api/alerts")
async def get_alerts():
    alerts = await agent.generate_alerts()

    # Guardar alertas en Supabase
    try:
        rows = [
            {
                "type":        a["type"],
                "title":       a["title"],
                "description": a["description"],
                "countries":   a["countries"],
                "action":      a["action"],
                "created_at":  datetime.utcnow().isoformat(),
            }
            for a in alerts
        ]
        sb.table("alerts").insert(rows).execute()
    except Exception:
        pass
    return alerts

# ── Chat ──────────────────────────────────────────────────────────────────────
@app.post("/api/chat")
async def chat(msg: ChatMessage):
    response = await agent.chat(msg.message)
    return {"response": response}

# ── Farmer profile ────────────────────────────────────────────────────────────
@app.post("/api/farmer")
async def save_farmer(profile: FarmerProfile):
    try:
        sb.table("farmers").upsert({
            "id":         profile.user_id,
            "full_name":  profile.full_name,
            "country":    profile.country,
            "crop":       profile.crop,
        }).execute()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/farmer/{user_id}")
async def get_farmer(user_id: str):
    try:
        res = sb.table("farmers").select("*").eq("id", user_id).single().execute()
        return res.data
    except Exception:
        return {}

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "project": "AgroLatam Agent"}

# ── Frontend ──────────────────────────────────────────────────────────────────
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")