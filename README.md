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
