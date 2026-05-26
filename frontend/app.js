const API = "https://netricd-agrolatam-agent.hf.space";

// ── SUPABASE ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = "TU_SUPABASE_URL";
const SUPABASE_KEY = "TU_SUPABASE_KEY";
let sb = null;
try {
  const { createClient } = supabase;
  sb = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {}

// ── AUTH STATE ────────────────────────────────────────────────────────────────
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
  const profileBtn = document.getElementById("profile-btn");

  if (loggedIn) {
    if (btnIn) btnIn.style.display = "none";
    if (btnOut) btnOut.style.display = "flex";
    if (profileBtn) profileBtn.title = user?.email || "Profile";
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
let lang = localStorage.getItem("lang") || "en";

function setLang(l) {
  lang = l;
  localStorage.setItem("lang", l);

  document
    .querySelectorAll(".lang-opt")
    .forEach((b, i) =>
      b.classList.toggle(
        "active",
        (l === "en" && i === 0) || (l === "es" && i === 1),
      ),
    );

  // Normal text elements
  document.querySelectorAll("[data-en]:not([data-html])").forEach((el) => {
    el.textContent = el.dataset[l];
  });

  // HTML elements (hero title, etc.)
  document.querySelectorAll("[data-html='true']").forEach((el) => {
    el.innerHTML = el.dataset[l];
  });

  // Placeholders
  document.querySelectorAll("[data-en-placeholder]").forEach((el) => {
    el.placeholder = el.dataset[l + "Placeholder"];
  });

  // Initial agent message
  const initMsg = document.querySelector(".agent-msg");
  if (initMsg && initMsg.dataset[l]) initMsg.textContent = initMsg.dataset[l];
}

// ── NAV ───────────────────────────────────────────────────────────────────────
function showSection(name, el) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".nav-link")
    .forEach((l) => l.classList.remove("active"));
  document.getElementById("section-" + name).classList.add("active");
  if (el) el.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

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
const NAMES_EN = {
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
};
const NAMES_ES = {
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
};
const REGIONS = {
  coffee: "Peru · Colombia · Honduras",
  cacao: "Peru · Ecuador · Brazil",
  corn: "Mexico · Argentina · Brazil",
  banana: "Ecuador · Colombia · Honduras",
  soy: "Brazil · Argentina · Paraguay",
  palm_oil: "Colombia · Ecuador · Honduras",
  rice: "Brazil · Colombia · Peru",
  sugarcane: "Brazil · Mexico · Colombia",
  avocado: "Mexico · Peru · Colombia",
  orange: "Brazil · Mexico · Argentina",
  tomato: "Mexico · Brazil · Chile",
};
function cropName(key) {
  return lang === "es" ? NAMES_ES[key] || key : NAMES_EN[key] || key;
}

// ── PRICES ────────────────────────────────────────────────────────────────────
async function loadPrices() {
  try {
    const res = await fetch(`${API}/api/prices`);
    const data = await res.json();
    const grid = document.getElementById("metrics-grid");
    const tbody = document.getElementById("market-tbody");
    if (!grid) return;

    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(160px, 1fr))";
    grid.innerHTML = Object.entries(data)
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

    if (!tbody) return;
    const buyTxt = lang === "es" ? "COMPRAR" : "BUY";
    const sellTxt = lang === "es" ? "VENDER" : "SELL";
    const holdTxt = lang === "es" ? "MANTENER" : "HOLD";

    tbody.innerHTML = Object.entries(data)
      .map(([crop, d]) => {
        const big = Math.abs(d.change) > 2;
        const sig =
          big && d.change > 0
            ? `<span class="sig-buy">${buyTxt}</span>`
            : big && d.change < 0
              ? `<span class="sig-sell">${sellTxt}</span>`
              : `<span class="sig-hold">${holdTxt}</span>`;
        return `<tr>
        <td>${ICONS[crop] || ""} ${cropName(crop)}</td>
        <td class="price-val">${d.price > 100 ? "$" + d.price.toLocaleString() : "$" + d.price.toFixed(2)}</td>
        <td class="${d.change > 0 ? "up-text" : "down-text"}">${d.change > 0 ? "▲" : "▼"} ${Math.abs(d.change).toFixed(1)}%</td>
        <td>${d.unit}</td><td>${d.exchange}</td><td>${sig}</td>
      </tr>`;
      })
      .join("");
  } catch {
    const g = document.getElementById("metrics-grid");
    if (g) {
      g.style.gridTemplateColumns = "repeat(auto-fill,minmax(160px,1fr))";
      g.innerHTML = `<div class="metric-skeleton"></div>`.repeat(11);
    }
  }
}

// ── ALERTS ────────────────────────────────────────────────────────────────────
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

async function loadAlerts() {
  try {
    const alerts = await (await fetch(`${API}/api/alerts`)).json();
    const html = alerts.map(renderAlert).join("");
    const list = document.getElementById("alerts-list");
    const full = document.getElementById("alerts-full");
    if (list)
      list.innerHTML =
        html ||
        `<div class="loading-text">${lang === "es" ? "Sin alertas" : "No alerts"}</div>`;
    if (full) full.innerHTML = `<div class="card">${html}</div>`;
  } catch {
    const list = document.getElementById("alerts-list");
    if (list)
      list.innerHTML = `<div class="loading-text">Backend offline</div>`;
  }
}

// ── CHAT ──────────────────────────────────────────────────────────────────────
async function sendChat() {
  const input = document.getElementById("chat-input");
  const msgs = document.getElementById("chat-msgs");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  msgs.innerHTML += `<div class="msg user-msg">${text}</div>`;
  msgs.innerHTML += `<div class="msg typing" id="typing">${lang === "es" ? "El agente está pensando..." : "Agent is thinking..."}</div>`;
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
    msgs.innerHTML += `<div class="msg agent-msg">${lang === "es" ? "Backend offline." : "Backend offline."}</div>`;
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
  if (!np || !cp) {
    msg.className = "pw-msg error";
    msg.textContent =
      lang === "es" ? "Completa todos los campos." : "Fill in all fields.";
    return;
  }
  if (np !== cp) {
    msg.className = "pw-msg error";
    msg.textContent =
      lang === "es"
        ? "Las contraseñas no coinciden."
        : "Passwords do not match.";
    return;
  }
  if (np.length < 6) {
    msg.className = "pw-msg error";
    msg.textContent =
      lang === "es" ? "Mínimo 6 caracteres." : "Minimum 6 characters.";
    return;
  }
  msg.className = "pw-msg success";
  msg.textContent =
    lang === "es" ? "✅ ¡Contraseña actualizada!" : "✅ Password updated!";
}

// ── INIT ──────────────────────────────────────────────────────────────────────
setLang(lang);
checkAuth();
loadPrices();
loadAlerts();
setInterval(loadPrices, 60000);
setInterval(loadAlerts, 90000);

// ── DROPDOWN ──────────────────────────────────────────────────────────────────
function toggleDropdown() {
  const menu = document.getElementById("dropdown-menu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}
document.addEventListener("click", (e) => {
  if (!document.getElementById("tools-dropdown")?.contains(e.target)) {
    const menu = document.getElementById("dropdown-menu");
    if (menu) menu.style.display = "none";
  }
});
