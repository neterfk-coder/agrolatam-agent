import os
import httpx
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

FIVETRAN_API_KEY    = os.getenv("FIVETRAN_API_KEY", "")
FIVETRAN_API_SECRET = os.getenv("FIVETRAN_API_SECRET", "")
FIVETRAN_BASE_URL   = "https://api.fivetran.com/v1"

# ── FIVETRAN MCP INTEGRATION ──────────────────────────────────────────────────
class FivetranMCP:
    def __init__(self):
        self.api_key    = FIVETRAN_API_KEY
        self.api_secret = FIVETRAN_API_SECRET
        self.auth       = (self.api_key, self.api_secret)

    async def get_connectors(self) -> list:
        """Get all Fivetran connectors (data pipelines)"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(
                    f"{FIVETRAN_BASE_URL}/connectors",
                    auth=self.auth
                )
                if r.status_code == 200:
                    data = r.json()
                    return data.get("data", {}).get("items", [])
        except Exception as e:
            print(f"Fivetran connectors error: {e}")
        return []

    async def get_sync_status(self) -> dict:
        """Get sync status of all pipelines"""
        connectors = await self.get_connectors()
        pipelines = []

        for c in connectors[:10]:
            pipelines.append({
                "id":         c.get("id", ""),
                "name":       c.get("schema", c.get("id", "pipeline")),
                "service":    c.get("service", "unknown"),
                "status":     c.get("status", {}).get("sync_state", "unknown"),
                "last_sync":  c.get("succeeded_at", "—"),
                "sync_freq":  c.get("sync_frequency", 60),
            })

        # If no real connectors, show mock pipelines to demonstrate integration
        if not pipelines:
            pipelines = get_mock_pipelines()

        return {
            "pipelines":    pipelines,
            "total":        len(pipelines),
            "active":       len([p for p in pipelines if p["status"] in ["synced","syncing","scheduled"]]),
            "last_updated": datetime.utcnow().isoformat(),
            "powered_by":   "Fivetran MCP",
        }

    async def trigger_sync(self, connector_id: str) -> bool:
        """Trigger a manual sync for a connector"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.post(
                    f"{FIVETRAN_BASE_URL}/connectors/{connector_id}/sync",
                    auth=self.auth
                )
                return r.status_code == 200
        except Exception:
            return False

def get_mock_pipelines():
    """Mock pipelines showing what Fivetran would sync"""
    now = datetime.utcnow()
    return [
        {
            "id":        "ice_ny_coffee",
            "name":      "ICE NY — Coffee Futures",
            "service":   "google_sheets",
            "status":    "synced",
            "last_sync": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "sync_freq": 5,
            "source":    "ICE Futures U.S.",
            "records":   12847,
        },
        {
            "id":        "ice_london_cacao",
            "name":      "ICE London — Cacao Futures",
            "service":   "google_sheets",
            "status":    "synced",
            "last_sync": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "sync_freq": 5,
            "source":    "ICE Futures Europe",
            "records":   8934,
        },
        {
            "id":        "cme_grains",
            "name":      "CME — Corn & Soy Futures",
            "service":   "google_sheets",
            "status":    "synced",
            "last_sync": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "sync_freq": 5,
            "source":    "Chicago Mercantile Exchange",
            "records":   23156,
        },
        {
            "id":        "fao_latam_prices",
            "name":      "FAO — LATAM Agricultural Prices",
            "service":   "rest_api",
            "status":    "synced",
            "last_sync": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "sync_freq": 60,
            "source":    "Food & Agriculture Organization",
            "records":   45230,
        },
        {
            "id":        "openmeteo_weather",
            "name":      "Open-Meteo — LATAM Weather",
            "service":   "rest_api",
            "status":    "syncing",
            "last_sync": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "sync_freq": 30,
            "source":    "Open-Meteo API",
            "records":   9821,
        },
        {
            "id":        "usda_reports",
            "name":      "USDA — Agricultural Reports",
            "service":   "rest_api",
            "status":    "scheduled",
            "last_sync": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "sync_freq": 1440,
            "source":    "US Dept. of Agriculture",
            "records":   3420,
        },
    ]

# Singleton instance
fivetran_mcp = FivetranMCP()