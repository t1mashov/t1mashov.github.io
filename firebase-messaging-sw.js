// Сырой Push API, а не firebase-messaging-compat.js: у него сообщения с одновременно
// заполненными notification и data показываются дважды — и самим SDK, и нашим кодом.
//
// data.pushUrl — относительный путь на домене бокса, например
// "/ru/ticket/list/filter/id/0/ticket/13".
self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const data = payload.data || {};
  const notif = payload.notification || {};

  const title = notif.title || data.title || "Новое уведомление";
  const body = notif.body || data.body || "";
  const pushUrl = data.pushUrl || "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "assets/icon-192.png",
      data: { pushUrl }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const pushUrl = (event.notification.data && event.notification.data.pushUrl) || "/";
  // openWindow() на том же домене не передаёт управление приложению — iOS считает
  // это внутренней навигацией PWA. Редиректим через свою же страницу (?redirect=),
  // которая уходит на helpdeskeddy://open?path=... — self.registration.scope вместо
  // хардкода домена, поэтому файл одинаковый для любого клиента.
  const redirectUrl = new URL("?redirect=" + encodeURIComponent(pushUrl), self.registration.scope).href;
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // iOS допускает только одно окно standalone PWA: если оно уже открыто, простой
      // openWindow() с новым URL ничего не делает — нужен явный navigate().
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
