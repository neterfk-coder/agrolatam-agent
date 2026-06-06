from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import yfinance as yf
import feedparser
from dotenv import load_dotenv
from agent import AgroLatamAgent
from fivetran_mcp import fivetran_mcp
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

# ── YAHOO FINANCE SYMBOLS ─────────────────────────────────────────────────────
SYMBOLS = {
    "coffee":    {"symbol": "KC=F",  "unit": "USD/lb",     "exchange": "ICE NY",      "factor": 1},
    "cacao":     {"symbol": "CC=F",  "unit": "USD/ton",    "exchange": "ICE London",  "factor": 1},
    "corn":      {"symbol": "ZC=F",  "unit": "USD/bushel", "exchange": "CME",         "factor": 1},
    "soy":       {"symbol": "ZS=F",  "unit": "USD/bushel", "exchange": "CME",         "factor": 1},
    "sugarcane": {"symbol": "SB=F",  "unit": "USD/lb",     "exchange": "ICE NY",      "factor": 1},
    "palm_oil":  {"symbol": "KPO=F", "unit": "USD/ton",    "exchange": "BMD Malaysia","factor": 1},
    "rice":      {"symbol": "ZR=F",  "unit": "USD/cwt",    "exchange": "CBOT",        "factor": 1},
}

# Fallback prices for crops not available on Yahoo Finance
FALLBACK = {
    "banana":   {"price": 0.89,  "unit": "USD/kg",  "exchange": "FAO"},
    "cacao":    {"price": 3812,  "unit": "USD/ton", "exchange": "ICE London"},
    "avocado":  {"price": 2.15,  "unit": "USD/kg",  "exchange": "FAO"},
    "orange":   {"price": 1.85,  "unit": "USD/kg",  "exchange": "FAO"},
    "tomato":   {"price": 1.10,  "unit": "USD/kg",  "exchange": "FAO"},
}

def get_real_price(symbol_info):
    try:
        ticker = yf.Ticker(symbol_info["symbol"])
        hist   = ticker.history(period="2d")
        if hist.empty:
            return None, None
        latest   = float(hist["Close"].iloc[-1])
        previous = float(hist["Close"].iloc[-2]) if len(hist) > 1 else latest
        change   = round(((latest - previous) / previous) * 100, 2)
        return round(latest, 4), change
    except Exception:
        return None, None

@app.get("/api/prices")
async def get_prices():
    prices = {}

    # Get real prices from Yahoo Finance
    for crop, info in SYMBOLS.items():
        price, change = get_real_price(info)
        if price:
            prices[crop] = {
                "price":    price,
                "change":   change,
                "unit":     info["unit"],
                "exchange": info["exchange"],
            }
        else:
            # Use fallback if Yahoo Finance fails
            if crop in FALLBACK:
                fb = FALLBACK[crop]
                prices[crop] = {"price": fb["price"], "change": 0.0, "unit": fb["unit"], "exchange": fb["exchange"]}

    # Add FAO crops with fallback
    for crop, fb in FALLBACK.items():
        if crop not in prices:
            prices[crop] = {"price": fb["price"], "change": 0.0, "unit": fb["unit"], "exchange": fb["exchange"]}

    return prices

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
                    params={
                        "latitude": c["lat"], "longitude": c["lon"],
                        "daily": "precipitation_sum,temperature_2m_max",
                        "forecast_days": 3, "timezone": "America/Lima"
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

@app.get("/api/alerts")
async def get_alerts():
    # Get real prices first to generate real alerts
    prices_response = await get_prices()
    alerts = await agent.generate_alerts(prices_response)
    return alerts

@app.get("/api/news")
async def get_news():
    feeds = [
        "https://www.fao.org/news/rss-feed/en/",
        "https://apps.fas.usda.gov/psdonline/app/index.html#/app/",
    ]
    news = []
    for feed_url in feeds:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:5]:
                news.append({
                    "title":   entry.get("title", ""),
                    "summary": entry.get("summary", "")[:200],
                    "link":    entry.get("link", ""),
                    "source":  feed.feed.get("title", "FAO"),
                    "date":    entry.get("published", ""),
                })
        except Exception:
            pass

    # Add backup news if feeds fail
    if not news:
        news = [
            {"title": "Coffee prices fall on ICE NY", "summary": "Coffee futures dropped amid rising Brazilian output.", "link": "#", "source": "Reuters", "date": datetime.utcnow().isoformat()},
            {"title": "Cacao demand rises in Europe", "summary": "European chocolate makers increasing LATAM cacao purchases.", "link": "#", "source": "Bloomberg", "date": datetime.utcnow().isoformat()},
            {"title": "Avocado shortage in Mexico", "summary": "Drought cuts Michoacán avocado production by 18%.", "link": "#", "source": "FAO", "date": datetime.utcnow().isoformat()},
        ]
    return news

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
        return {"ok": False, "error": str(e)}

@app.get("/api/fivetran/status")
async def fivetran_status():
    """Get Fivetran pipeline sync status"""
    status = await fivetran_mcp.get_sync_status()
    return status

@app.get("/api/fivetran/pipelines")
async def fivetran_pipelines():
    """Get all Fivetran data pipelines"""
    status = await fivetran_mcp.get_sync_status()
    return status["pipelines"]

@app.post("/api/fivetran/sync/{connector_id}")
async def trigger_sync(connector_id: str):
    """Trigger manual sync for a pipeline"""
    success = await fivetran_mcp.trigger_sync(connector_id)
    return {"success": success, "connector_id": connector_id}

@app.get("/api/health")
async def health():
    return {"status": "ok", "project": "AgroLatam Agent", "version": "2.0"}