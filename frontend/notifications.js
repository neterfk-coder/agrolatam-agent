// ── AGROLATAM PUSH NOTIFICATIONS ─────────────────────────────────────────────
const NOTIF_KEY = "agrolatam_notifications";
let notifPermission = localStorage.getItem(NOTIF_KEY) || "default";
let lastPrices = {};

// ── REGISTER SERVICE WORKER ───────────────────────────────────────────────────
async function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch (e) {
    console.log("SW registration failed:", e);
  }
}

// ── REQUEST PERMISSION ────────────────────────────────────────────────────────
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showToast(
      lang === "es"
        ? "Tu navegador no soporta notificaciones"
        : "Your browser doesn't support notifications",
      "warning",
    );
    return false;
  }
  if (Notification.permission === "granted") {
    notifPermission = "granted";
    localStorage.setItem(NOTIF_KEY, "granted");
    updateNotifUI(true);
    showToast(
      lang === "es"
        ? "✅ Notificaciones ya activas"
        : "✅ Notifications already active",
      "success",
    );
    return true;
  }
  const result = await Notification.requestPermission();
  notifPermission = result;
  localStorage.setItem(NOTIF_KEY, result);
  if (result === "granted") {
    updateNotifUI(true);
    // Send welcome notification
    setTimeout(() => {
      sendLocalNotification(
        "🌱 AgroLatam Agent",
        lang === "es"
          ? "¡Notificaciones activadas! Te alertaremos cuando los precios cambien significativamente."
          : "Notifications enabled! We'll alert you when prices change significantly.",
        "welcome",
      );
    }, 1000);
    return true;
  }
  showToast(
    lang === "es" ? "Notificaciones bloqueadas" : "Notifications blocked",
    "error",
  );
  return false;
}

// ── SEND LOCAL NOTIFICATION ───────────────────────────────────────────────────
function sendLocalNotification(title, body, tag = "alert", url = "/") {
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "https://agrolatam-agent-git-main-agrolatam-s-projects.vercel.app/icon-192.png",
      badge:
        "https://agrolatam-agent-git-main-agrolatam-s-projects.vercel.app/icon-192.png",
      vibrate: [200, 100, 200],
      tag,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    setTimeout(() => n.close(), 8000);
  } catch (e) {
    console.log("Notification error:", e);
  }
}

// ── CHECK PRICE CHANGES & NOTIFY ─────────────────────────────────────────────
function checkAndNotify(newPrices) {
  if (Notification.permission !== "granted") return;
  if (!Object.keys(lastPrices).length) {
    lastPrices = newPrices;
    return;
  }

  const CROP_NAMES = {
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
      palm_oil: "Palma",
      rice: "Arroz",
      sugarcane: "Caña",
      avocado: "Aguacate",
      orange: "Naranja",
      tomato: "Tomate",
    },
  };
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

  Object.entries(newPrices).forEach(([crop, d]) => {
    const change = d.change || 0;
    const icon = ICONS[crop] || "🌾";
    const name = CROP_NAMES[lang]?.[crop] || crop;

    if (Math.abs(change) >= 2.5) {
      const isUp = change > 0;
      const emoji = isUp ? "📈" : "📉";
      const action = isUp
        ? lang === "es"
          ? "¡Vende ahora!"
          : "Sell now!"
        : lang === "es"
          ? "Espera mejor precio"
          : "Wait for better price";

      sendLocalNotification(
        `${emoji} ${icon} ${name} ${isUp ? "+" : ""}${change.toFixed(1)}%`,
        lang === "es"
          ? `Precio: $${d.price.toFixed(2)} ${d.unit} · ${action}`
          : `Price: $${d.price.toFixed(2)} ${d.unit} · ${action}`,
        `price-${crop}`,
      );
    }
  });

  lastPrices = newPrices;
}

// ── ALERT NOTIFICATIONS ───────────────────────────────────────────────────────
function notifyAlert(alert) {
  if (Notification.permission !== "granted") return;
  const icons = { critical: "🚨", warning: "⚠️", opportunity: "✅" };
  const icon = icons[alert.type] || "🔔";
  sendLocalNotification(
    `${icon} AgroLatam — ${alert.title}`,
    `${alert.description}\n📍 ${alert.countries?.join(", ")} · ${alert.action}`,
    `alert-${alert.type}`,
  );
}

// ── UPDATE UI ─────────────────────────────────────────────────────────────────
function updateNotifUI(enabled) {
  const btn = document.getElementById("notif-btn");
  const toggle = document.getElementById("notif-toggle");
  const status = document.getElementById("notif-status");
  if (btn) {
    btn.style.background = enabled
      ? "rgba(74,222,128,.2)"
      : "rgba(255,255,255,.1)";
    btn.title = enabled
      ? lang === "es"
        ? "Notificaciones activas"
        : "Notifications active"
      : lang === "es"
        ? "Activar notificaciones"
        : "Enable notifications";
    btn.innerHTML = enabled ? "🔔" : "🔕";
  }
  if (toggle) toggle.checked = enabled;
  if (status) {
    status.textContent = enabled
      ? lang === "es"
        ? "Notificaciones activas ✅"
        : "Notifications active ✅"
      : lang === "es"
        ? "Toca para activar"
        : "Tap to enable";
  }
}

// ── TOAST NOTIFICATION ────────────────────────────────────────────────────────
function showToast(msg, type = "info") {
  const existing = document.getElementById("toast");
  if (existing) existing.remove();

  const colors = {
    success: "#0A4A35",
    error: "#B03A2E",
    warning: "#C8902A",
    info: "#1A5276",
  };
  const toast = document.createElement("div");
  toast.id = "toast";
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    background: colors[type] || colors.info,
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "Sora, sans-serif",
    zIndex: "9999",
    boxShadow: "0 8px 24px rgba(0,0,0,.2)",
    animation: "toastIn .3s ease",
  });

  const style = document.createElement("style");
  style.textContent =
    "@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}";
  document.head.appendChild(style);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── INIT ──────────────────────────────────────────────────────────────────────
registerSW();
const isEnabled = Notification.permission === "granted";
updateNotifUI(isEnabled);
if (isEnabled) notifPermission = "granted";
