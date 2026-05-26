const API = "https://netricd-agrolatam-agent.hf.space";

// ── SUPABASE ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://pcqgiorwqcxoylvirhbh.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcWdpb3J3cWN4b3lsdmlyaGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDA1ODcsImV4cCI6MjA5NTE3NjU4N30.D7-uUcXnfMfJFoLOTI5TdNqOEtcue0AhhFCbnepWSJk";
let sb = null;
try {
  const { createClient } = supabase;
  sb = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {}

// ── AUTH ──────────────────────────────────────────────────────────────────────
async function checkAuth() {
  if (!sb) return;
  try {
    const {
      data: { session },
    } = await sb.auth.getSession();
    updateAuthUI(!!session, session?.user);
  } catch {}
}
function updateAuthUI(loggedIn, user) {
  const btnIn = document.getElementById("btn-signin");
  const btnOut = document.getElementById("btn-signout");
  if (loggedIn) {
    if (btnIn) btnIn.style.display = "none";
    if (btnOut) btnOut.style.display = "flex";
  } else {
    if (btnIn) btnIn.style.display = "flex";
    if (btnOut) btnOut.style.display = "none";
  }
}
async function signOutUser() {
  if (sb) {
    try {
      await sb.auth.signOut();
    } catch {}
  }
  updateAuthUI(false);
  window.location.href = "auth/login.html";
}

// ── LANGUAGE ──────────────────────────────────────────────────────────────────
let lang = localStorage.getItem("lang") || "es"; // Default: Spanish

// All static translations for texts without data-en/data-es attributes
const T = {
  loading: { en: "Loading...", es: "Cargando..." },
  loadingAlerts: { en: "Loading alerts...", es: "Cargando alertas..." },
  noAlerts: { en: "No alerts", es: "Sin alertas" },
  backendOffline: { en: "Backend offline", es: "Backend desconectado" },
  agentThinking: {
    en: "Agent is thinking...",
    es: "El agente está pensando...",
  },
  agentOffline: {
    en: "Backend offline — start the server.",
    es: "Backend desconectado.",
  },
  agentWelcome: {
    en: "Hello! I am AgroLatam Agent. I monitor commodity prices, weather, and export markets across 18 Latin American countries in real time. How can I help you today?",
    es: "¡Hola! Soy AgroLatam Agent. Monitoreo precios de materias primas, clima y mercados de exportación en 18 países latinoamericanos en tiempo real. ¿Cómo puedo ayudarte hoy?",
  },
  buy: { en: "BUY", es: "COMPRAR" },
  sell: { en: "SELL", es: "VENDER" },
  hold: { en: "HOLD", es: "MANTENER" },
  today: { en: "Today vs yesterday", es: "Hoy vs ayer" },
  noPlaces: {
    en: "Search your location to see relevant crops",
    es: "Busca tu ubicación para ver cultivos relevantes",
  },
  toolsMenu: { en: "🛠 Tools ▾", es: "🛠 Herramientas ▾" },
};

function t(key) {
  return T[key]?.[lang] || T[key]?.en || key;
}

function setLang(l) {
  lang = l;
  localStorage.setItem("lang", l);

  // Update all lang-opt buttons on entire page
  document
    .querySelectorAll(".lang-opt")
    .forEach((b, i) =>
      b.classList.toggle(
        "active",
        (l === "en" && i === 0) || (l === "es" && i === 1),
      ),
    );

  // Update all elements with data-en / data-es attributes (text)
  document.querySelectorAll("[data-en]:not([data-html])").forEach((el) => {
    if (el.dataset[l]) el.textContent = el.dataset[l];
  });

  // Update HTML elements (hero title with <em> tags)
  document.querySelectorAll("[data-html='true']").forEach((el) => {
    if (el.dataset[l]) el.innerHTML = el.dataset[l];
  });

  // Update placeholders
  document.querySelectorAll("[data-en-placeholder]").forEach((el) => {
    el.placeholder =
      el.dataset[l + "Placeholder"] || el.dataset["enPlaceholder"];
  });

  // Update tools dropdown button
  const toolsBtn = document.querySelector(".nav-dropdown-btn");
  if (toolsBtn) toolsBtn.textContent = t("toolsMenu");

  // Update initial agent message
  const agentMsg = document.querySelector("#chat-msgs .agent-msg");
  if (agentMsg) agentMsg.textContent = t("agentWelcome");

  // Re-render dynamic content in new language
  if (Object.keys(priceData).length) {
    renderPriceGrid();
    renderMarketsTable();
  }
  renderAlertsList();

  // Re-render loading texts
  const loadingEl = document.querySelector("#market-tbody td");
  if (loadingEl && loadingEl.textContent === "Loading...") {
    loadingEl.textContent = t("loading");
  }
}

// ── NAV ───────────────────────────────────────────────────────────────────────
function showSection(name, el) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".nav-link")
    .forEach((l) => l.classList.remove("active"));
  document.getElementById("section-" + name)?.classList.add("active");
  if (el) el.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── DROPDOWN ──────────────────────────────────────────────────────────────────
function toggleDropdown() {
  const menu = document.getElementById("dropdown-menu");
  if (menu)
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}
document.addEventListener("click", (e) => {
  if (!document.getElementById("tools-dropdown")?.contains(e.target)) {
    const menu = document.getElementById("dropdown-menu");
    if (menu) menu.style.display = "none";
  }
});

// ── CROP DATA ─────────────────────────────────────────────────────────────────
const ICONS = {
  coffee: "☕",
  cacao: "🍫",
  corn: "🌽",
  banana: "🍌",
  soy: "🌱",
  palm_oil: "🌴",
  rice: "🌾",
  sugarcane: "🍬",
  avocado: "🥑",
  orange: "🍊",
  tomato: "🍅",
};
const NAMES = {
  en: {
    coffee: "Coffee",
    cacao: "Cacao",
    corn: "Corn",
    banana: "Banana",
    soy: "Soy",
    palm_oil: "Palm Oil",
    rice: "Rice",
    sugarcane: "Sugarcane",
    avocado: "Avocado",
    orange: "Orange",
    tomato: "Tomato",
  },
  es: {
    coffee: "Café",
    cacao: "Cacao",
    corn: "Maíz",
    banana: "Banano",
    soy: "Soya",
    palm_oil: "Palma Aceitera",
    rice: "Arroz",
    sugarcane: "Caña de Azúcar",
    avocado: "Aguacate",
    orange: "Naranja",
    tomato: "Tomate",
  },
};
const REGIONS = {
  coffee: "Peru · Colombia · Honduras",
  cacao: "Peru · Ecuador · Brazil",
  corn: "México · Argentina · Brazil",
  banana: "Ecuador · Colombia · Honduras",
  soy: "Brazil · Argentina · Paraguay",
  palm_oil: "Colombia · Ecuador · Honduras",
  rice: "Brazil · Colombia · Peru",
  sugarcane: "Brazil · México · Colombia",
  avocado: "México · Peru · Colombia",
  orange: "Brazil · México · Argentina",
  tomato: "México · Brazil · Chile",
};
function cropName(key) {
  return NAMES[lang]?.[key] || NAMES.en[key] || key;
}

// ── PRICE DATA ────────────────────────────────────────────────────────────────
let priceData = {};

async function loadPrices() {
  try {
    const res = await fetch(`${API}/api/prices`);
    priceData = await res.json();
  } catch {
    priceData = {
      coffee: { price: 2.34, change: -3.2, unit: "USD/lb", exchange: "ICE NY" },
      cacao: {
        price: 3812,
        change: 1.8,
        unit: "USD/ton",
        exchange: "ICE London",
      },
      corn: { price: 4.52, change: 0.5, unit: "USD/bushel", exchange: "CME" },
      banana: { price: 0.89, change: -1.1, unit: "USD/kg", exchange: "FAO" },
      soy: { price: 11.2, change: 2.3, unit: "USD/bushel", exchange: "CME" },
      palm_oil: { price: 1124, change: 0.8, unit: "USD/ton", exchange: "BMD" },
      rice: { price: 17.4, change: -0.6, unit: "USD/cwt", exchange: "CBOT" },
      sugarcane: {
        price: 0.21,
        change: 1.2,
        unit: "USD/kg",
        exchange: "ICE NY",
      },
      avocado: { price: 2.15, change: 3.4, unit: "USD/kg", exchange: "FAO" },
      orange: { price: 1.85, change: -0.9, unit: "USD/kg", exchange: "FAO" },
      tomato: { price: 1.1, change: 0.4, unit: "USD/kg", exchange: "FAO" },
    };
  }
  renderPriceGrid();
  renderMarketsTable();
}

function renderPriceGrid() {
  const grid = document.getElementById("metrics-grid");
  if (!grid || !Object.keys(priceData).length) return;
  grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(160px, 1fr))";
  grid.innerHTML = Object.entries(priceData)
    .map(
      ([crop, d]) => `
    <div class="metric-card">
      <div class="metric-crop">${ICONS[crop] || ""} ${cropName(crop)}</div>
      <div class="metric-price">${d.price > 100 ? "$" + d.price.toLocaleString() : "$" + d.price.toFixed(2)}</div>
      <div class="metric-unit">${d.unit}</div>
      <div class="metric-change ${d.change > 0 ? "up" : "down"}">
        ${d.change > 0 ? "▲" : "▼"} ${Math.abs(d.change).toFixed(1)}%
      </div>
      <div class="metric-exchange">${d.exchange}</div>
      <div class="metric-region">${REGIONS[crop] || ""}</div>
    </div>`,
    )
    .join("");
}

function renderMarketsTable() {
  const tbody = document.getElementById("market-tbody");
  if (!tbody || !Object.keys(priceData).length) return;
  tbody.innerHTML = Object.entries(priceData)
    .map(([crop, d]) => {
      const big = Math.abs(d.change) > 2;
      const sig =
        big && d.change > 0
          ? `<span class="sig-buy">${t("buy")}</span>`
          : big && d.change < 0
            ? `<span class="sig-sell">${t("sell")}</span>`
            : `<span class="sig-hold">${t("hold")}</span>`;
      return `<tr>
      <td>${ICONS[crop] || ""} ${cropName(crop)}</td>
      <td class="price-val">${d.price > 100 ? "$" + d.price.toLocaleString() : "$" + d.price.toFixed(2)}</td>
      <td class="${d.change > 0 ? "up-text" : "down-text"}">${d.change > 0 ? "▲" : "▼"} ${Math.abs(d.change).toFixed(1)}%</td>
      <td>${d.unit}</td><td>${d.exchange}</td><td>${sig}</td>
    </tr>`;
    })
    .join("");
}

// ── ALERTS ────────────────────────────────────────────────────────────────────
let alertsData = [];

function renderAlert(a) {
  const dc =
    a.type === "critical"
      ? "dot-critical"
      : a.type === "warning"
        ? "dot-warning"
        : "dot-opportunity";
  return `<div class="alert-item">
    <span class="alert-dot ${dc}"></span>
    <div>
      <div class="alert-title">${a.title}</div>
      <div class="alert-desc">${a.description}</div>
      <div class="alert-meta">${a.countries.join(", ")} · ${a.time} · <span class="alert-action">${a.action}</span></div>
    </div>
  </div>`;
}

function renderAlertsList() {
  const list = document.getElementById("alerts-list");
  const full = document.getElementById("alerts-full");
  if (!alertsData.length) {
    const msg = `<div class="loading-text">${t("loadingAlerts")}</div>`;
    if (list) list.innerHTML = msg;
    if (full) full.innerHTML = `<div class="card">${msg}</div>`;
    return;
  }
  const html = alertsData.map(renderAlert).join("");
  if (list)
    list.innerHTML = html || `<div class="loading-text">${t("noAlerts")}</div>`;
  if (full) full.innerHTML = `<div class="card">${html}</div>`;
}

async function loadAlerts() {
  try {
    alertsData = await (await fetch(`${API}/api/alerts`)).json();
  } catch {
    alertsData = [];
  }
  renderAlertsList();
}

// ── CHAT ──────────────────────────────────────────────────────────────────────
async function sendChat() {
  const input = document.getElementById("chat-input");
  const msgs = document.getElementById("chat-msgs");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  msgs.innerHTML += `<div class="msg user-msg">${text}</div>`;
  msgs.innerHTML += `<div class="msg typing" id="typing">${t("agentThinking")}</div>`;
  msgs.scrollTop = msgs.scrollHeight;
  try {
    const data = await (
      await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
    ).json();
    document.getElementById("typing")?.remove();
    msgs.innerHTML += `<div class="msg agent-msg">${data.response}</div>`;
  } catch {
    document.getElementById("typing")?.remove();
    msgs.innerHTML += `<div class="msg agent-msg">${t("agentOffline")}</div>`;
  }
  msgs.scrollTop = msgs.scrollHeight;
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function openSettings() {
  document.getElementById("settings-modal").classList.add("active");
}
function closeSettings() {
  document.getElementById("settings-modal").classList.remove("active");
}
function showChangePassword() {
  closeSettings();
  document.getElementById("pw-modal").classList.add("active");
}
function changePassword() {
  const np = document.getElementById("pw-new").value;
  const cp = document.getElementById("pw-confirm").value;
  const msg = document.getElementById("pw-msg");
  const errors = {
    empty: { en: "Fill in all fields.", es: "Completa todos los campos." },
    match: {
      en: "Passwords do not match.",
      es: "Las contraseñas no coinciden.",
    },
    short: { en: "Minimum 6 characters.", es: "Mínimo 6 caracteres." },
    success: { en: "✅ Password updated!", es: "✅ ¡Contraseña actualizada!" },
  };
  if (!np || !cp) {
    msg.className = "pw-msg error";
    msg.textContent = errors.empty[lang];
    return;
  }
  if (np !== cp) {
    msg.className = "pw-msg error";
    msg.textContent = errors.match[lang];
    return;
  }
  if (np.length < 6) {
    msg.className = "pw-msg error";
    msg.textContent = errors.short[lang];
    return;
  }
  msg.className = "pw-msg success";
  msg.textContent = errors.success[lang];
}

// ── WAKE UP BACKEND ───────────────────────────────────────────────────────────
fetch(`${API}/api/health`).catch(() => {});

// ── INIT ──────────────────────────────────────────────────────────────────────
setLang(lang);
checkAuth();
loadPrices();
loadAlerts();
setInterval(loadPrices, 60000);
setInterval(loadAlerts, 90000);
