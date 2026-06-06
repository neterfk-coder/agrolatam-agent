// ── SERVICE WORKER — AgroLatam Agent ─────────────────────────────────────────
const CACHE_NAME = "agrolatam-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener("push", (e) => {
  const data = e.data?.json() || {
    title: "AgroLatam Agent",
    body: "Nueva alerta del mercado agrícola",
    icon: "/icon-192.png",
  };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon:
        data.icon ||
        "https://agrolatam-agent-git-main-agrolatam-s-projects.vercel.app/icon-192.png",
      badge:
        "https://agrolatam-agent-git-main-agrolatam-s-projects.vercel.app/icon-192.png",
      vibrate: [200, 100, 200],
      tag: data.tag || "agrolatam-alert",
      data: { url: data.url || "/" },
      actions: [
        { action: "view", title: "Ver ahora" },
        { action: "dismiss", title: "Descartar" },
      ],
    }),
  );
});

// Handle notification click
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  if (e.action === "dismiss") return;
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
      } else {
        clients.openWindow(e.notification.data?.url || "/");
      }
    }),
  );
});
