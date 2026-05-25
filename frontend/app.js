const API = "https://netricd-agrolatam-agent.hf.space";

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
  document.querySelectorAll("[data-en]").forEach((el) => {
    el.textContent = el.dataset[l];
  });
  document.querySelectorAll("[data-en-placeholder]").forEach((el) => {
    el.placeholder = el.dataset[l + "Placeholder"];
  });
  const initMsg = document.querySelector(".agent-msg");
  if (initMsg) initMsg.textContent = initMsg.dataset[l];
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
}

// ── PRICES ────────────────────────────────────────────────────────────────────
const ICONS = {
  coffee: "☕",
  cacao: "🍫",
  corn: "🌽",
  banana: "🍌",
  soy: "🌱",
};
const NAMES_ES = {
  coffee: "Café",
  cacao: "Cacao",
  corn: "Maíz",
  banana: "Banano",
  soy: "Soya",
};

async function loadPrices() {
  try {
    const res = await fetch(`${API}/api/prices`);
    const data = await res.json();
    const grid = document.getElementById("metrics-grid");
    const tbody = document.getElementById("market-tbody");

    grid.innerHTML = Object.entries(data)
      .map(
        ([crop, d]) => `
      <div class="metric-card">
        <div class="metric-crop">${ICONS[crop] || ""} ${lang === "es" ? NAMES_ES[crop] || crop : crop}</div>
        <div class="metric-price">${d.price > 100 ? "$" + d.price.toLocaleString() : "$" + d.price.toFixed(2)}</div>
        <div class="metric-unit">${d.unit}</div>
        <div class="metric-change ${d.change > 0 ? "up" : "down"}">
          ${d.change > 0 ? "▲" : "▼"} ${Math.abs(d.change).toFixed(1)}%
        </div>
        <div class="metric-exchange">${d.exchange}</div>
      </div>`,
      )
      .join("");

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
        <td>${ICONS[crop] || ""} ${lang === "es" ? NAMES_ES[crop] || crop : crop}</td>
        <td class="price-val">${d.price > 100 ? "$" + d.price.toLocaleString() : "$" + d.price.toFixed(2)}</td>
        <td class="${d.change > 0 ? "up-text" : "down-text"}">${d.change > 0 ? "▲" : "▼"} ${Math.abs(d.change).toFixed(1)}%</td>
        <td>${d.unit}</td>
        <td>${d.exchange}</td>
        <td>${sig}</td>
      </tr>`;
      })
      .join("");
  } catch {
    document.getElementById("metrics-grid").innerHTML =
      `<div class="metric-skeleton"></div>`.repeat(5);
  }
}

// ── ALERTS ────────────────────────────────────────────────────────────────────
function renderAlert(a) {
  const dotClass =
    a.type === "critical"
      ? "dot-critical"
      : a.type === "warning"
        ? "dot-warning"
        : "dot-opportunity";
  return `<div class="alert-item">
    <span class="alert-dot ${dotClass}"></span>
    <div>
      <div class="alert-title">${a.title}</div>
      <div class="alert-desc">${a.description}</div>
      <div class="alert-meta">${a.countries.join(", ")} · ${a.time} · <span class="alert-action">${a.action}</span></div>
    </div>
  </div>`;
}

async function loadAlerts() {
  try {
    const res = await fetch(`${API}/api/alerts`);
    const alerts = await res.json();
    const html = alerts.map(renderAlert).join("");
    document.getElementById("alerts-list").innerHTML =
      html ||
      `<div class="loading-text">${lang === "es" ? "Sin alertas" : "No alerts"}</div>`;
    document.getElementById("alerts-full").innerHTML =
      `<div class="card">${html}</div>`;
  } catch {
    const msg = lang === "es" ? "Backend offline" : "Backend offline";
    document.getElementById("alerts-list").innerHTML =
      `<div class="loading-text">${msg}</div>`;
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
    const res = await fetch(`${API}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    document.getElementById("typing")?.remove();
    msgs.innerHTML += `<div class="msg agent-msg">${data.response}</div>`;
  } catch {
    document.getElementById("typing")?.remove();
    msgs.innerHTML += `<div class="msg agent-msg">${lang === "es" ? "Backend offline — inicia el servidor." : "Backend offline — start the server."}</div>`;
  }
  msgs.scrollTop = msgs.scrollHeight;
}

// ── INIT ──────────────────────────────────────────────────────────────────────
setLang(lang);
loadPrices();
loadAlerts();
setInterval(loadPrices, 60000);
setInterval(loadAlerts, 90000);
