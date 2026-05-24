import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are AgroLatam Agent, an autonomous AI agent that monitors agricultural 
commodity markets across 18 Latin American countries in real time.

You have access to:
- Live commodity prices: coffee, cacao, corn, banana, soy (ICE NY, ICE London, CME, FAO)
- Weather forecasts for the next 72 hours across LATAM (Open-Meteo)
- Export statistics from FAO and national trade agencies
- Agricultural credit databases

Countries you monitor: Peru, Brazil, Colombia, Mexico, Argentina, Chile, Bolivia, Ecuador,
Paraguay, Uruguay, Honduras, Guatemala, Nicaragua, Costa Rica, Panama, Dominican Republic,
Venezuela, El Salvador.

Your mission:
1. Alert farmers when prices move significantly (>2%)
2. Warn about weather events that affect harvest timing
3. Identify export opportunities between LATAM countries and global buyers
4. Generate agricultural credit documentation automatically when needed

Always be direct, specific, and actionable. Recommend concrete steps.
Never just describe the problem — always suggest what to do next.
Respond in the same language the user writes in (Spanish or English)."""


class AgroLatamAgent:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=SYSTEM_PROMPT,
        )
        self.chat_session = self.model.start_chat(history=[])

    async def chat(self, message: str) -> str:
        try:
            response = self.chat_session.send_message(message)
            return response.text
        except Exception as e:
            return f"Agent error: {str(e)}"

    async def generate_alerts(self):
        return [
            {
                "type": "critical",
                "title": "Coffee price drop detected",
                "description": "Coffee futures fell 3.2% on ICE NY — optimal sell window closes Thursday.",
                "countries": ["Peru", "Colombia", "Honduras"],
                "action": "Sell before Thursday",
                "time": "2 min ago",
            },
            {
                "type": "warning",
                "title": "Heavy rain forecast — 72h",
                "description": "Accumulated rainfall >40mm expected in Amazon basin. Harvest risk is high.",
                "countries": ["Ecuador", "Peru", "Brazil"],
                "action": "Accelerate harvest now",
                "time": "18 min ago",
            },
            {
                "type": "opportunity",
                "title": "Cacao demand surge — Europe",
                "description": "European buyers seeking LATAM supply. Prices up 1.8% on ICE London.",
                "countries": ["Peru", "Ecuador", "Brazil"],
                "action": "Contact buyers — docs ready",
                "time": "1h ago",
            },
            {
                "type": "opportunity",
                "title": "Soy export window open",
                "description": "CME soy up 2.3%. Argentina and Brazil have optimal export conditions this week.",
                "countries": ["Argentina", "Brazil", "Paraguay"],
                "action": "Review export logistics",
                "time": "2h ago",
            },
        ]