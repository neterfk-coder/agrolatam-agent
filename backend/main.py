from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
from agent import AgroLatamAgent
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

try:
    from supabase import create_client
    sb = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL else None
except Exception as e:
    print(f"Supabase warning: {e}")
    sb = None

app = FastAPI(title="AgroLatam Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = AgroLatamAgent()

class ChatMessage(BaseModel):
    message: str

class FarmerProfile(BaseModel):
    user_id: str
    full_name: str
    country: str
    crop: str

# ── 11 CROPS ──────────────────────────────────────────────────────────────────
PRICES = {
    # Original 5
    "coffee":     {"price": 2.34,  "change": -3.2, "unit": "USD/lb",     "exchange": "ICE NY"},
    "cacao":      {"price": 3812,  "change":  1.8,  "unit": "USD/ton",    "exchange": "ICE London"},
    "corn":       {"price": 4.52,  "change":  0.5,  "unit": "USD/bushel", "exchange": "CME"},
    "banana":     {"price": 0.89,  "change": -1.1,  "unit": "USD/kg",     "exchange": "FAO"},
    "soy":        {"price": 11.20, "change":  2.3,  "unit": "USD/bushel", "exchange": "CME"},
    # New 6
    "palm_oil":   {"price": 1124,  "change":  0.8,  "unit": "USD/ton",    "exchange": "BMD Malaysia"},
    "rice":       {"price": 17.40, "change": -0.6,  "unit": "USD/cwt",    "exchange": "CBOT"},
    "sugarcane":  {"price": 0.21,  "change":  1.2,  "unit": "USD/kg",     "exchange": "ICE NY"},
    "avocado":    {"price": 2.15,  "change":  3.4,  "unit": "USD/kg",     "exchange": "FAO"},
    "orange":     {"price": 1.85,  "change": -0.9,  "unit": "USD/kg",     "exchange": "FAO"},
    "tomato":     {"price": 1.10,  "change":  0.4,  "unit": "USD/kg",     "exchange": "FAO"},
}

@app.get("/api/prices")
async def get_prices():
    if sb:
        try:
            rows = [{"crop": c, "price": d["price"], "change_pct": d["change"],
                     "exchange": d["exchange"], "recorded_at": datetime.utcnow().isoformat()}
                    for c, d in PRICES.items()]
            sb.table("prices").insert(rows).execute()
        except Exception:
            pass
    return PRICES

@app.get("/api/weather")
async def get_weather():
    countries = [
        {"name": "Peru",      "lat": -9.19,   "lon": -75.015},
        {"name": "Colombia",  "lat":  4.570,  "lon": -74.297},
        {"name": "Ecuador",   "lat": -1.831,  "lon": -78.183},
        {"name": "Brazil",    "lat": -14.235, "lon": -51.925},
        {"name": "Bolivia",   "lat": -16.290, "lon": -63.589},
        {"name": "Argentina", "lat": -38.416, "lon": -63.617},
        {"name": "Mexico",    "lat":  23.634, "lon": -102.552},
        {"name": "Honduras",  "lat":  15.199, "lon": -86.241},
        {"name": "Guatemala", "lat":  15.783, "lon": -90.230},
    ]
    results = []
    async with httpx.AsyncClient(timeout=10) as client:
        for c in countries:
            try:
                r = await client.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params={"latitude": c["lat"], "longitude": c["lon"],
                            "daily": "precipitation_sum,temperature_2m_max",
                            "forecast_days": 3, "timezone": "America/Lima"},
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

@app.get("/api/alerts")
async def get_alerts():
    alerts = await agent.generate_alerts()
    if sb:
        try:
            sb.table("alerts").insert([
                {"type": a["type"], "title": a["title"],
                 "description": a["description"], "countries": a["countries"],
                 "action": a["action"], "created_at": datetime.utcnow().isoformat()}
                for a in alerts
            ]).execute()
        except Exception:
            pass
    return alerts

@app.post("/api/chat")
async def chat(msg: ChatMessage):
    response = await agent.chat(msg.message)
    return {"response": response}

@app.post("/api/farmer")
async def save_farmer(profile: FarmerProfile):
    if not sb:
        return {"ok": True}
    try:
        sb.table("farmers").upsert({
            "id": profile.user_id, "full_name": profile.full_name,
            "country": profile.country, "crop": profile.crop,
        }).execute()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health():
    return {"status": "ok", "project": "AgroLatam Agent", "crops": len(PRICES)}