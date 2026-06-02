<div align="center">

# 🌱 AgroLatam Agent

### The autonomous AI platform for Latin America's 60 million farmers

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Platform-0A4A35?style=for-the-badge&logo=vercel)](https://agrolatam-agent-git-main-agrolatam-s-projects.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Hugging%20Face-FFD21E?style=for-the-badge&logo=huggingface)](https://huggingface.co/spaces/Netricd/agrolatam-agent)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/neterfk-coder/agrolatam-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)



</div>

---

## 🌎 What is AgroLatam Agent?

**AgroLatam Agent** is an autonomous AI platform that monitors commodity markets, weather forecasts and export data across **18 Latin American countries** — then acts on behalf of farmers without human intervention.

> *"AI that doesn't just answer — it acts for Latin America's 60 million farmers."*

Unlike a chatbot, AgroLatam Agent:
- 📡 **Monitors** real-time commodity prices (coffee, cacao, corn, avocado, soy and 6 more)
- 🧠 **Reasons** about cross-country market patterns using Gemini AI
- ⚡ **Acts autonomously** — sending alerts, generating documents and identifying buyers
- 🌦️ **Forecasts** agricultural weather risks for harvest timing
- 💰 **Calculates** farm profitability with real market prices

---

## 🚨 The Problem

**70% of Latin American farmers lack access to real-time market information.**

| Challenge | Impact |
|---|---|
| No real-time price access | Sell at the wrong time, losing 30-50% of potential income |
| No weather intelligence | Harvest losses from unexpected rain or drought |
| No credit access | Can't apply for agricultural loans easily |
| Middleman dependency | Forced to sell below market price |

Large corporations have sophisticated data systems. Small farmers have nothing. **AgroLatam Agent closes that gap.**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Agent Live** | Real-time feed of autonomous agent actions |
| 📊 **Analytics Dashboard** | Live price charts for 11 crops |
| 🗺️ **My Region** | Interactive map with markets, cooperatives and buyers near you |
| 🌦️ **Agricultural Weather** | 7-day forecast with soil conditions and harvest risk alerts |
| 🗓️ **Smart Calendar** | AI-powered planting, care and harvest schedule |
| 💰 **Profitability Calculator** | Estimate farm profit using real market prices |
| 📰 **LATAM News** | Real-time agricultural news in EN/ES |
| 📊 **Admin Panel** | Users, alerts and analytics management |
| 👤 **User Profiles** | Personalized farmer accounts |
| 🌐 **Bilingual** | Full English / Spanish support |
| 📱 **Mobile Responsive** | Works on any device |

---

## 🌾 Crops Monitored

| Crop | Exchange | Main Countries |
|---|---|---|
| ☕ Coffee | ICE NY | Peru, Colombia, Honduras |
| 🍫 Cacao | ICE London | Peru, Ecuador, Brazil |
| 🌽 Corn | CME | Mexico, Argentina, Brazil |
| 🍌 Banana | FAO | Ecuador, Colombia, Honduras |
| 🌱 Soy | CME | Brazil, Argentina, Paraguay |
| 🌴 Palm Oil | BMD Malaysia | Colombia, Ecuador, Honduras |
| 🌾 Rice | CBOT | Brazil, Colombia, Peru |
| 🍬 Sugarcane | ICE NY | Brazil, Mexico, Colombia |
| 🥑 Avocado | FAO | Mexico, Peru, Colombia |
| 🍊 Orange | FAO | Brazil, Mexico, Argentina |
| 🍅 Tomato | FAO | Mexico, Brazil, Chile |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel)                    │
│  HTML · CSS · JavaScript — 14 pages                     │
└─────────────────┬───────────────────────────────────────┘
                  │ API calls
┌─────────────────▼───────────────────────────────────────┐
│                  BACKEND (Hugging Face)                  │
│  FastAPI · Python · Groq + Llama 3.3                    │
│  /api/prices · /api/weather · /api/alerts · /api/chat   │
└──────┬──────────────────────────────────┬───────────────┘
       │                                  │
┌──────▼──────┐                  ┌────────▼────────┐
│  Supabase   │                  │  Open-Meteo API │
│  PostgreSQL │                  │  Weather data   │
│  farmers    │                  │  9 LATAM cities │
│  alerts     │                  └─────────────────┘
│  prices     │
└─────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **AI Agent** | Gemini + Groq/Llama 3.3 | Autonomous reasoning |
| **Data Pipelines** | Fivetran MCP | Market data sync |
| **Backend** | FastAPI + Python | REST API |
| **Database** | Supabase (PostgreSQL) | Users, alerts, prices |
| **Weather** | Open-Meteo | Free agricultural forecasts |
| **Frontend** | HTML + CSS + JS | 14 responsive pages |
| **Hosting** | Vercel + Hugging Face | Free deployment |

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/neterfk-coder/agrolatam-agent.git
cd agrolatam-agent
```

### 2. Set up environment variables
```bash
# Create .env file in /backend
cp .env.example .env

# Fill in your keys:
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
FIVETRAN_API_KEY=your_fivetran_key
FIVETRAN_API_SECRET=your_fivetran_secret
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### 3. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Run the backend
```bash
uvicorn main:app --reload
```

### 5. Open the frontend
Open `frontend/index.html` in your browser or use Live Server in VS Code.

---

## 🗂️ Project Structure

```
agrolatam-agent/
├── backend/
│   ├── main.py           # FastAPI server
│   ├── agent.py          # AI agent logic (Groq/Gemini)
│   ├── fivetran_mcp.py   # Fivetran MCP integration
│   └── requirements.txt
│
├── frontend/
│   ├── index.html        # Main dashboard
│   ├── about.html        # About & Impact
│   ├── agent-live.html   # Autonomous agent feed
│   ├── charts.html       # Analytics & charts
│   ├── map.html          # Regional market map
│   ├── weather.html      # Agricultural weather
│   ├── calendar.html     # Planting calendar
│   ├── calculator.html   # Profitability calculator
│   ├── news.html         # LATAM agricultural news
│   ├── admin.html        # Admin panel
│   ├── style.css         # Global styles
│   ├── app.js            # Main JavaScript
│   └── auth/
│       ├── login.html
│       ├── register.html
│       ├── forgot.html
│       └── profile.html
│
├── LICENSE
└── README.md
```

---

## 🌍 Countries Covered

🇵🇪 Peru · 🇧🇷 Brazil · 🇨🇴 Colombia · 🇲🇽 Mexico · 🇦🇷 Argentina · 🇨🇱 Chile · 🇧🇴 Bolivia · 🇪🇨 Ecuador · 🇵🇾 Paraguay · 🇺🇾 Uruguay · 🇭🇳 Honduras · 🇬🇹 Guatemala · 🇳🇮 Nicaragua · 🇨🇷 Costa Rica · 🇵🇦 Panama · 🇩🇴 Dominican Republic · 🇻🇪 Venezuela · 🇸🇻 El Salvador

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/prices` | Live commodity prices for 11 crops |
| `GET` | `/api/weather` | Weather data for 9 LATAM regions |
| `GET` | `/api/alerts` | Autonomous agent alerts |
| `POST` | `/api/chat` | Chat with the AI agent |
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/farmer` | Save farmer profile |

---

## 🔑 API Keys Required

| Service | Where to get it | Free tier |
|---|---|---|
| Gemini | [aistudio.google.com](https://aistudio.google.com/app/apikey) | ✅ Yes |
| Groq | [console.groq.com](https://console.groq.com/keys) | ✅ Yes |
| Fivetran | [fivetran.com](https://fivetran.com/signup) | ✅ 14-day trial |
| Supabase | [supabase.com](https://supabase.com) | ✅ Free forever |
| Open-Meteo | No key needed | ✅ Completely free |

---

## 🎯 Impact

| Metric | Value |
|---|---|
| Target farmers | 60 million+ |
| Countries covered | 18 |
| Crops monitored | 11 |
| Annual exports impacted | $200 billion |
| Agent uptime | 24/7 |
| Response time | < 2 seconds |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for Latin America's 60 million farmers**

[🌐 Live Platform](https://agrolatam-agent-git-main-agrolatam-s-projects.vercel.app) · [🤖 Backend API](https://netricd-agrolatam-agent.hf.space) · [📊 Admin Panel](https://agrolatam-agent-git-main-agrolatam-s-projects.vercel.app/admin.html)

</div>
