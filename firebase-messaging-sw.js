importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");
importScripts("debug-store.js");

firebase.initializeApp({
  apiKey: "AIzaSyA3MVD9ief0JprMRC3Atbd7dPt1gmH4SKU",
  authDomain: "hdepush.firebaseapp.com",
  projectId: "hdepush",
  storageBucket: "hdepush.firebasestorage.app",
  messagingSenderId: "647887531816",
  appId: "1:647887531816:web:795292b474ff5e66a46a1d"
});

const messaging = firebase.messaging();

// Срабатывает, когда пуш прилетает, а страница/приложение не в фокусе.
// Пока просто показываем то, что пришло в data/notification — на проде
// сюда же будет уходить {title, body, url} из HDE.
messaging.onBackgroundMessage((payload) => {
  console.log("[sw] Background message payload:", JSON.stringify(payload));
  debugStoreSet("lastPayload", { payload, receivedAt: new Date().toISOString() });

  const data = payload.data || {};
  const notif = payload.notification || {};

  const title = notif.title || data.title || "Новое уведомление";
  const body = notif.body || data.body || "";
  const url = data.url || "/";

  self.registration.showNotification(title, {
    body,
    icon: "icon-192.png",
    data: { url }
  });
});

self.addEventListener("notificationclick", (event) => {
  console.log("[sw] notificationclick data:", JSON.stringify(event.notification.data));

  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      await debugStoreSet("lastClick", { data: event.notification.data, clickedAt: new Date().toISOString() });
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
        }
      }
      // На этом тестовом этапе просто открываем URL как есть.
      // На проде тут будет полный https-адрес на домен Universal Link.
      await self.clients.openWindow(url);
    })()
  );
});
