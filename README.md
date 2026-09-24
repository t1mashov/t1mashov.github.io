# hde-push-page

Страница для включения push-уведомлений в мобильном приложении HelpDeskEddy
на коробочной версии. Работает на любом статическом хостинге со своим
HTTPS-доменом — необязательно на сервере самой коробки.

репозиторий копируется
туда, откуда его будет отдавать хостинг, а `index.html` сам читает
`config.json` через `fetch()` при загрузке страницы.

## Структура

```
index.html               — страница целиком (разметка + стили + логика)
config.json               — единственное, что нужно заполнить 
firebase-messaging-sw.js  — service worker
manifest.json              — манифест PWA
assets/                     — иконки и логотип
```

## Требования

- Свой проект в Firebase (тот же, что использует `hde.broadcaster` для
  отправки пушей).

## Установка

```bash
git clone <адрес репозитория>
```

Откройте `/var/www/hde.push/config.json` и заполните пять полей:

```json
{
  "apiKey": "...",
  "projectId": "...",
  "appId": "...",
  "messagingSenderId": "...",
  "vapidKey": "..."
}
```

Все значения берутся в консоли Firebase (console.firebase.google.com) —
выберите тот же проект, что указан в `fcm.json` у `hde.broadcaster`:

| Поле | Где взять |
|---|---|
| `apiKey` | Project settings → General → Your apps → веб-приложение |
| `projectId` | Project settings → General, верх страницы (или там же, в блоке веб-приложения) |
| `appId` | Project settings → General → Your apps → веб-приложение |
| `messagingSenderId` | Project settings → General → Your apps → веб-приложение |
| `vapidKey` | Project settings → Cloud Messaging → Web configuration → Web Push certificates → Generate key pair |

Если веб-приложения в проекте ещё нет — добавьте через иконку `</>` на
странице Your apps, дальше все поля появятся там же.

Значения в `config.json` не секретны — это публичные Firebase Web-идентификаторы,
Firebase сам не полагается на то, что они скрыты (защита — через правила
безопасности на стороне Firebase, не через сокрытие ключа). Отдавать файл
как есть безопасно.

## Хостинг

Куда именно выкладывать — решает тот, кто разворачивает: свой nginx на
коробке, отдельный поддомен, GitHub Pages/Cloudflare Pages/Netlify — подходит
любой статический HTTPS-хостинг, специальных настроек не требует.

Если это nginx на самой коробке — пример location в `nginx-push.conf.example`
(поменяйте путь, если клонировали не в `/var/www/hde.push`), затем:
```bash
nginx -t && service nginx reload
```

## Проверка

Откройте `https://<домен коробки>/push/` на iPhone. Если `config.json` не
заполнен или недоступен — страница сама покажет, чего не хватает, прямо в
интерфейсе. Если всё в порядке — увидите кнопку «Включить уведомления».

## Обновление настроек

Поменяли значения в `config.json` (например, перевыпустили VAPID-ключ) —
просто сохраните файл, ничего пересобирать/перезапускать не нужно, страница
читает его заново при каждой загрузке.
