# 🌱 AgroLatam Agent

> The first autonomous AI agent for Latin America's 60 million farmers.

Built for the **Google Cloud Rapid Agent Hackathon 2026** — Fivetran track.

---

## What It Does

AgroLatam Agent monitors commodity markets, weather, and export data across
18 Latin American countries in real time. It autonomously:

- Alerts farmers when prices move significantly
- Warns about weather events that affect harvest timing
- Identifies export opportunities between LATAM countries and global buyers
- Generates agricultural credit documentation automatically

## Tech Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| Agent brain    | Gemini 2.0 Flash + Google Cloud Agent Builder |
| Data pipelines | Fivetran MCP                                  |
| Backend        | Python + FastAPI                              |
| Frontend       | HTML + CSS + JavaScript                       |
| Weather        | Open-Meteo API (free)                         |
| Deploy         | Cloud Run + Vercel                            |

## Crops Monitored

Coffee · Cacao · Corn · Banana · Soy

## Countries Covered

Peru · Brazil · Colombia · Mexico · Argentina · Chile · Bolivia · Ecuador ·
Paraguay · Uruguay · Honduras · Guatemala · Nicaragua · Costa Rica · Panama ·
Dominican Republic · Venezuela · El Salvador

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/agrolatam-agent.git
cd agrolatam-agent
```

### 2. Set up environment variables

```bash
cp .env .env.local
# Edit .env and add your API keys
```

### 3. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Run the backend

```bash
uvicorn main:app --reload
```

### 5. Open the frontend

Open `frontend/index.html` in your browser or serve it with Live Server in VS Code.

---

## API Keys Required

| Key                   | Where to get it                        |
| --------------------- | -------------------------------------- |
| `GEMINI_API_KEY`      | https://aistudio.google.com/app/apikey |
| `FIVETRAN_API_KEY`    | https://fivetran.com/account/settings  |
| `FIVETRAN_API_SECRET` | https://fivetran.com/account/settings  |

---

## License

MIT — see [LICENSE](LICENSE)
🌱 Agente AgroLatamThe first autonomous AI agent designed to empower 60 million farmers in Latin America.Developed for the Google Cloud Rapid Agent Hackathon 2026 — Fivetran Track.🚀 The ProblemFarmers in Latin America face a critical information gap: lack of real-time visibility into commodity market volatility, unpredictable climate risks, and complex bureaucratic processes to access agricultural credit.💡 The SolutionAgente AgroLatam is an autonomous AI ecosystem that democratizes access to strategic data. It acts as a pocket agronomist and financial consultant, analyzing complex variables to simplify decision-making.Key Features:360° Monitoring: Real-time tracking of markets, climate, and exports across 18 countries.Intelligent Alerts: Proactive notifications regarding price fluctuations and weather phenomena that impact harvests.Commercial Matchmaking: Autonomous identification of export opportunities between Latin American countries and global buyers.Bureaucratic Automation: Automatic generation of technical documentation for agricultural credit applications.🛠️ Tech StackLayerTechnologyBrain (AI)Gemini 2.0 Flash + Google Cloud Agent BuilderData PipelineFivetran (Market data integration)BackendPython + FastAPIFrontendHTML5 + CSS3 + JavaScriptWeather ServicesOpen-Meteo APIInfrastructureGoogle Cloud Run + Vercel🌍 CoverageCrops: Coffee, Cacao, Corn, Banana, Soy.Countries: Peru, Brazil, Colombia, Mexico, Argentina, Chile, Bolivia, Ecuador, Paraguay, Uruguay, Honduras, Guatemala, Nicaragua, Costa Rica, Panama, Dominican Republic, Venezuela, El Salvador.⚙️ Local Setup GuideClone the repository:git clone https://github.com/neterfk-coder/agente-agrolatam.gitcd agente-agrolatam
2. **Configure credentials:**
   ```bash
cp .env.example .env
# Edit the .env file and insert your API Keys
Install and run the Backend:cd backendpip install -r requirements.txtuvicorn main:app --reload
