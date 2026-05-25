import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are AgroLatam Agent, an autonomous AI agent that monitors agricultural 
commodity markets across 18 Latin American countries in real time.

You have access to live prices for 11 major crops:
- Coffee (ICE NY), Cacao (ICE London), Corn (CME), Banana (FAO), Soy (CME)
- Palm Oil (BMD Malaysia), Rice (CBOT), Sugarcane (ICE NY)
- Avocado (FAO), Orange (FAO), Tomato (FAO)

Countries monitored: Peru, Brazil, Colombia, Mexico, Argentina, Chile, Bolivia, Ecuador,
Paraguay, Uruguay, Honduras, Guatemala, Nicaragua, Costa Rica, Panama, Dominican Republic,
Venezuela, El Salvador.

Key producing regions by crop:
- Palm Oil: Colombia, Ecuador, Honduras, Guatemala, Brazil
- Rice: Brazil, Colombia, Peru, Bolivia, Argentina
- Sugarcane: Brazil, Mexico, Colombia, Guatemala, Argentina
- Avocado: Mexico, Peru, Colombia, Dominican Republic, Chile
- Orange: Brazil, Mexico, Argentina, Colombia, Bolivia
- Tomato: Mexico, Brazil, Chile, Argentina, Colombia

Your mission:
1. Alert farmers when prices move significantly (>2%)
2. Warn about weather events that affect harvest timing
3. Identify export opportunities between LATAM countries and global buyers
4. Generate agricultural credit documentation automatically when needed
5. Compare prices across similar crops and suggest diversification

Always be direct, specific, and actionable. Respond in the same language the user writes in."""


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
                "title": "Heavy rain — Palm Oil regions at risk",
                "description": "72h rainfall >40mm in Colombia and Ecuador palm zones. Harvest disruption likely.",
                "countries": ["Colombia", "Ecuador", "Honduras"],
                "action": "Accelerate harvest",
                "time": "15 min ago",
            },
            {
                "type": "opportunity",
                "title": "Avocado demand surge — Europe",
                "description": "Mexican and Peruvian avocado prices up 3.4%. European buyers seeking LATAM supply.",
                "countries": ["Mexico", "Peru", "Colombia"],
                "action": "Contact export buyers",
                "time": "45 min ago",
            },
            {
                "type": "opportunity",
                "title": "Cacao — ICE London up 1.8%",
                "description": "European chocolate season demand pushing cacao prices higher.",
                "countries": ["Peru", "Ecuador", "Brazil"],
                "action": "Review export contracts",
                "time": "1h ago",
            },
            {
                "type": "warning",
                "title": "Rice prices falling — CBOT",
                "description": "Global rice supply increase pushing prices down 0.6%. Consider storage strategy.",
                "countries": ["Brazil", "Colombia", "Peru", "Bolivia"],
                "action": "Hold stock — wait for recovery",
                "time": "2h ago",
            },
        ]