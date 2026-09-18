importScripts("debug-store.js");

// Сознательно НЕ используем firebase-messaging-compat.js здесь: у него в некоторых
// версиях сообщение с одновременно заполненными notification и data (а HDE шлёт
// именно так) показывается ДВАЖДЫ — один раз автоматически самим SDK по полю
// notification (без наших данных, поэтому клик по нему просто открывал сайт), и
// второй раз вручную нашим кодом ниже (с корректным data.pushUrl). Сырой Push API
// даёт полный контроль и не имеет такого автоматического поведения.
//
// HDE кладёт путь к тикету в data.pushUrl (относительный путь на домене самого бокса,
// например "/ru/ticket/list/filter/id/0/ticket/13"), а не в data.url.
self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  console.log("[sw] push event payload:", JSON.stringify(payload));

  const data = payload.data || {};
  const notif = payload.notification || {};

  const title = notif.title || data.title || "Новое уведомление";
  const body = notif.body || data.body || "";
  const pushUrl = data.pushUrl || "/";

  event.waitUntil(
    debugStoreSet("lastPayload", { payload, receivedAt: new Date().toISOString() }).then(() =>
      self.registration.showNotification(title, {
        body,
        icon: "icon-192.png",
        data: { pushUrl }
      })
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[sw] notificationclick data:", JSON.stringify(event.notification.data));

  event.notification.close();
  const pushUrl = (event.notification.data && event.notification.data.pushUrl) || "/";
  // Universal Link (openWindow на t1mashov.github.io из воркера ЭТОГО ЖЕ домена) не
  // передаёт управление приложению — iOS считает это внутренней навигацией PWA, а не
  // переходом "снаружи". Вместо этого открываем свою же страницу с параметром redirect,
  // а она уже сама (из живой загруженной страницы, не из воркера) уходит на кастомную
  // схему helpdeskeddy://open?path=... — так же надёжно, как уже работает передача
  // webpush-токена обратно в приложение.
  const redirectUrl = "https://t1mashov.github.io/?redirect=" + encodeURIComponent(pushUrl);
  event.waitUntil(
    (async () => {
      await debugStoreSet("lastClick", { data: event.notification.data, redirectUrl, clickedAt: new Date().toISOString() });
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Standalone PWA на iOS допускает только одно окно: если оно уже открыто
      // (просто свёрнуто, не закрыто), openWindow() с новым URL ничего не делает —
      // нужно явно навигировать существующий клиент, иначе редирект-скрипт на
      // странице не перезапустится и клик по второму подряд уведомлению просто
      // покажет старую страницу PWA без перехода в приложение.
      if (allClients.length > 0) {
        const client = allClients[0];
        if ("navigate" in client) {
          await client.navigate(redirectUrl);
        }
        await client.focus();
      } else {
        await self.clients.openWindow(redirectUrl);
      }
    })()
  );
});
