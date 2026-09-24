// Сырой Push API, а не firebase-messaging-compat.js: у того сообщения с notification и data показываются дважды — SDK и нашим кодом.

// data.pushUrl — относительный путь на домене бокса, например "/ru/ticket/list/filter/id/0/ticket/13".
// Приход push: браузер будит воркер даже при закрытой странице, здесь показываем уведомление.
self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const data = payload.data || {};
  const notif = payload.notification || {};

  // Заголовок и текст берём из notification, запасной вариант — data.
  const title = notif.title || data.title || "Новое уведомление";
  const body = notif.body || data.body || "";
  const pushUrl = data.pushUrl || "/";

  // Путь тикета кладём в уведомление, чтобы получить его обратно по клику.
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "assets/icon-192.png",
      data: { pushUrl }
    })
  );
});

// Клик по уведомлению: передаём путь тикета странице PWA, а она открывает приложение.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const pushUrl = (event.notification.data && event.notification.data.pushUrl) || "/";

  // openWindow() на том же домене iOS считает навигацией внутри PWA, поэтому идём через свою страницу (?redirect=), которая уходит на helpdeskeddy://open.
  // self.registration.scope вместо хардкода домена — файл одинаков для любого клиента.
  const redirectUrl = new URL("?redirect=" + encodeURIComponent(pushUrl), self.registration.scope).href;
  event.waitUntil(
    (async () => {
      // Ищем уже открытое окно PWA.
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      
      // У standalone PWA одно окно: при открытом окне openWindow() ничего не делает, navigate() падает для неуправляемых страниц, а postMessage работает всегда.
      if (allClients.length > 0) {

        // Окно открыто: шлём ему путь сообщением и выводим на передний план.
        const client = allClients[0];
        client.postMessage({ pushUrl });
        await client.focus();
      } 
      else {

        // Окна нет: открываем страницу с ?redirect=, она сама уйдёт в приложение.
        await self.clients.openWindow(redirectUrl);
      }
    })()
  );
});
