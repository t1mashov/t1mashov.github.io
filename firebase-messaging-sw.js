// Сознательно НЕ используем firebase-messaging-compat.js: у него в некоторых версиях
// сообщение с одновременно заполненными notification и data (а HDE шлёт именно так)
// показывается ДВАЖДЫ — автоматически самим SDK (без наших данных, клик по нему просто
// открывал сайт) и вручную нашим кодом. Сырой Push API даёт полный контроль.
//
// HDE кладёт путь к тикету в data.pushUrl — относительный путь на домене самого бокса,
// например "/ru/ticket/list/filter/id/0/ticket/13".
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
      icon: "icon-192.png",
      data: { pushUrl }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const pushUrl = (event.notification.data && event.notification.data.pushUrl) || "/";
  // Universal Link (openWindow на t1mashov.github.io из воркера ЭТОГО ЖЕ домена) не
  // передаёт управление приложению — iOS считает это внутренней навигацией PWA. Вместо
  // этого открываем свою же страницу с параметром redirect, а она из живой загруженной
  // страницы уходит на кастомную схему helpdeskeddy://open?path=...
  const redirectUrl = "https://t1mashov.github.io/?redirect=" + encodeURIComponent(pushUrl);
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Standalone PWA на iOS допускает только одно окно: если оно уже открыто (свёрнуто,
      // не закрыто), openWindow() с новым URL ничего не делает — нужно явно навигировать
      // существующий клиент, иначе редирект-скрипт не перезапустится.
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
