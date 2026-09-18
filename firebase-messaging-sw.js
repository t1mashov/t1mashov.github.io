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

// HDE кладёт путь к тикету в data.pushUrl (относительный путь на домене самого бокса,
// например "/ru/ticket/list/filter/id/0/ticket/13"), а не в data.url.
messaging.onBackgroundMessage((payload) => {
  console.log("[sw] Background message payload:", JSON.stringify(payload));

  const data = payload.data || {};
  const notif = payload.notification || {};

  const title = notif.title || data.title || "Новое уведомление";
  const body = notif.body || data.body || "";
  const pushUrl = data.pushUrl || "/";

  return debugStoreSet("lastPayload", { payload, receivedAt: new Date().toISOString() }).then(() =>
    self.registration.showNotification(title, {
      body,
      icon: "icon-192.png",
      data: { pushUrl }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[sw] notificationclick data:", JSON.stringify(event.notification.data));

  event.notification.close();
  const pushUrl = (event.notification.data && event.notification.data.pushUrl) || "/";
  // pushUrl — относительный путь на домене бокса, а не на t1mashov.github.io, поэтому
  // Universal Link открыть его напрямую не может. Заворачиваем в /t/?path=... — этот
  // путь зарегистрирован в apple-app-site-association, и приложение достанет
  // настоящий путь из query-параметра (см. AppDelegate.application(continue:)).
  const universalLink = "https://t1mashov.github.io/t/?path=" + encodeURIComponent(pushUrl);
  event.waitUntil(
    (async () => {
      await debugStoreSet("lastClick", { data: event.notification.data, universalLink, clickedAt: new Date().toISOString() });
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
        }
      }
      await self.clients.openWindow(universalLink);
    })()
  );
});
