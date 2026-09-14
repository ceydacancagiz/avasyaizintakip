/* AVASYA TEKNOLOJİ — push messaging service worker (no app-shell caching) */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "AVASYA TEKNOLOJİ", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "AVASYA TEKNOLOJİ İzin Takip";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon-512.png",
      badge: "/icon-512.png",
      tag: data.tag || data.link || title,
      renotify: true,
      requireInteraction: true,
      data: { link: data.link || "/panel" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/panel";
  event.waitUntil(
    (async () => {
      const target = new URL(link, self.location.origin).href;
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(target);
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
