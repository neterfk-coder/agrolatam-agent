const API = "http://localhost:8000";

// ── NAV ──────────────────────────────────────────────────────────────────────
function showSection(name) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".nav-link")
    .forEach((l) => l.classList.remove("active"));
  document.getElementById(`section-${name}`).classList.add("active");
  event.target.classList.add("active");
}

// ── PRICES ───────────────────────────────────────────────────────────────────
async function loadPrices() {
  const grid = document.getElementById("metrics-grid");
  const tbody = document.getElementById("market-table-body");

  try {
    const res = await fetch(`${API}/api/prices`);
    const data = await res.json();

    const icons = {
      coffee: "☕",
      cacao: "🍫",
      corn: "🌽",
      banana: "🍌",
      soy: "🌱",
    };

    grid.innerHTML = Object.entries(data)
      .map(
        ([crop, d]) => `
      <div class="metric-card">
        <div class="metric-crop">${icons[crop] || ""} ${crop}</div>
        <div class="metric-price">${
          typeof d.price === "number" && d.price > 100
            ? "$" + d.price.toLocaleString()
            : "$" + d.price.toFixed(2)
        }</div>
        <div class="metric-unit">${d.unit}</div>
        <div class="metric-change ${d.change > 0 ? "up" : "down"}">
          ${d.change > 0 ? "▲" : "▼"} ${Math.abs(d.change).toFixed(1)}% today
        </div>
        <div class="metric-exchange">${d.exchange}</div>
      </div>
    `,
      )
      .join("");

    tbody.innerHTML = Object.entries(data)
      .map(([crop, d]) => {
        const up = d.change > 0;
        const big = Math.abs(d.change) > 2;
        const signal =
          big && up
            ? `<span class="signal-buy">BUY</span>`
            : big && !up
              ? `<span class="signal-sell">SELL</span>`
              : `<span class="signal-hold">HOLD</span>`;
        return `
        <tr>
          <td>${icons[crop] || ""} ${crop}</td>
          <td class="price-val">${
            typeof d.price === "number" && d.price > 100
              ? "$" + d.price.toLocaleString()
              : "$" + d.price.toFixed(2)
          }</td>
          <td class="${up ? "up-text" : "down-text"}">
            ${up ? "▲" : "▼"} ${Math.abs(d.change).toFixed(1)}%
          </td>
          <td>${d.unit}</td>
          <td>${d.exchange}</td>
          <td>${signal}</td>
        </tr>`;
      })
      .join("");
  } catch {
    grid.innerHTML = `<div class="metric-card loading">Backend offline — run: uvicorn main:app</div>`;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">Backend offline</td></tr>`;
  }
}

// ── ALERTS ───────────────────────────────────────────────────────────────────
function renderAlert(a) {
  const dotClass =
    a.type === "critical"
      ? "dot-critical"
      : a.type === "warning"
        ? "dot-warning"
        : "dot-opportunity";
  return `
    <div class="alert-item">
      <span class="alert-dot ${dotClass}"></span>
      <div>
        <div class="alert-title">${a.title}</div>
        <div class="alert-desc">${a.description}</div>
        <div class="alert-meta">
          ${a.countries.join(", ")} · ${a.time} ·
          <span class="alert-action">${a.action}</span>
        </div>
      </div>
    </div>`;
}

async function loadAlerts() {
  const list = document.getElementById("alerts-list");
  const fullList = document.getElementById("alerts-full-list");
  try {
    const res = await fetch(`${API}/api/alerts`);
    const alerts = await res.json();
    const html = alerts.map(renderAlert).join("");
    list.innerHTML = html;
    fullList.innerHTML = `<div class="card">${html}</div>`;
  } catch {
    list.innerHTML = `<div class="loading-text">Backend offline</div>`;
    fullList.innerHTML = `<div class="card"><div class="loading-text">Backend offline</div></div>`;
  }
}

// ── CHAT ─────────────────────────────────────────────────────────────────────
async function sendChat() {
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";

  messages.innerHTML += `<div class="msg user-msg">${text}</div>`;
  messages.innerHTML += `<div class="msg typing" id="typing">Agent is thinking...</div>`;
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch(`${API}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    document.getElementById("typing")?.remove();
    messages.innerHTML += `<div class="msg agent-msg">${data.response}</div>`;
  } catch {
    document.getElementById("typing")?.remove();
    messages.innerHTML += `<div class="msg agent-msg">Backend offline — start the server first.</div>`;
  }

  messages.scrollTop = messages.scrollHeight;
}

// ── INIT ─────────────────────────────────────────────────────────────────────
loadPrices();
loadAlerts();
setInterval(loadPrices, 60000);
setInterval(loadAlerts, 90000);
