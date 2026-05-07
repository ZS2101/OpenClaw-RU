# 🦞 OpenClaw RU — Русская редакция

<p align="center">
  <img src="open 1.png" alt="OpenClaw RU" width="500"><br>
</p>

<p align="center">
  <strong>Персональный AI-ассистент на русском</strong><br>
  <em>Полная русификация OpenClaw + новые провайдеры, каналы и скиллы<br>для русскоязычных пользователей и локального AI</em>
</p>
<p align="center">
  <a href="https://github.com/ZS2101/OpenClaw-RU/stargazers">
    <img src="https://img.shields.io/github/stars/ZS2101/OpenClaw-RU?style=for-the-badge&color=facc15" alt="Stars">
  </a>
  <a href="https://github.com/ZS2101/OpenClaw-RU/blob/openclaw-ru/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License MIT">
  </a>
  <a href="https://github.com/ZS2101/OpenClaw-RU/commits/openclaw-ru">
    <img src="https://img.shields.io/github/last-commit/ZS2101/OpenClaw-RU/openclaw-ru?style=for-the-badge&color=3b82f6" alt="Last Commit">
  </a>
</p>

---

## Скриншоты

<p align="center">
  <em>Визард на русском</em><br>
  <img src="WIZARD RU.png" alt="Визард OpenClaw RU" width="600"><br>
</p>

<p align="center">
  <em>Переведенные тэглайны</em><br>
  <img src="tagline-demo-2.png" alt="Визард OpenClaw RU" width="600"><br>
</p>

<p align="center">
  <em>Каналы</em><br>
  <img src="ru wizard channels.png" alt="Каналы и провайдеры" width="600"><br>
</p>

<p align="center">
  <em>Новые провайдеры</em><br>
  <img src="models-demo-1.png" alt="Скиллы на русском" width="600"><br>
</p>

---

## Введение

**OpenClaw RU** — это форк оригинального [OpenClaw](https://github.com/openclaw/openclaw) с полным переводом интерфейса на русский язык и добавлением российских провайдеров, каналов и сервисов.

Проект основан на V2026.4.15 OpenClaw (все билды оригинального OpenClaw после данного пока находятся в нерабочем состоянии).

---

## Что добавлено?

### Провайдеры

| Провайдер | Описание |
|-----------|----------|
| **YandexCloud** | Яндекс Облако — YandexGPT через API Foundation Models |
| **Cloud.ru** | Облачная платформа Cloud.ru с LLM-моделями |
| **Selectel** | Selectel Cloud — GPU и модели |
| **Gigachat** | Сбер GigaChat — российская LLM |
| **CometAPI** | CometAPI — универсальный API-шлюз к 500+ моделям |

*Услуги всех провайдеров выше можно оплатить с российской карты

### Каналы

| Канал | Описание |
|-------|----------|
| **VK** | ВКонтакте — бот сообщества (Long Poll + Callback) |
| **Яндекс Мессенджер** | Через Яндекс Webhook API |
| **OK** | Одноклассники — бот группы |
| **TamTam** | TamTam Messenger бот |
| **MAX** | MAX Messenger бот |
| **VK Teams** | VK Teams бот |

### Скиллы

**Маркетплейсы:**
- **Avito** (Тариф Расширенный/Максимальный)
- **Ozon** (Тариф Premium Plus)
- **Wildberries** (Бесплатно)
  
Скиллы позволяют боту читать и отвечать на сообщения покупателей, мониторить новые отзывы/вопросы и отвечать на них.

**Биржи и криптовалюта:**
- **MOEX**
- **Bybit**
- **MEXC**

Aкции, индексы, облигации, валюты, дивиденды, тикеры, стаканы, свечи(бесплатно, работает через public api). 

**Яндекс Экосистема:**
- **Календарь**: встречи, события, напоминания через CalDAV (caldav.yandex.ru).
- **Диск**: загрузка, скачивание, список файлов, общий доступ через REST API (cloud-api.yandex.net).
- **Почта**: чтение и отправка писем через IMAP/SMTP. 
- **Карты**: геокодирование, маршруты, матрица расстояний, поиск мест.
- **Маркет**: заказы, цены, остатки, отгрузки через Seller API (api.partner.market.yandex.ru).
- **Метрика**: визиты, просмотры, источники, цели, отказы через REST API.
- **Переводчик**: перевод текста на 90+ языков с автоопределением.
- **Vision**: OCR (текст) и распознавание объектов на фото. 
- **Погода**:  текущая погода и прогноз (почасовой, дневной).
---

## Русификация

- **CLI:** баннер, 86 тэглайнов на русском, визард + пасхалка на 9 мая
- **Провайдеры:** 40+ — авторизация, API-ключи, поиск, подсказки
- **Каналы:** все статусы, описания, лейблы, credentials, help-тексты
- **Скиллы + Хуки:** 69 описаний на русском
- **Веб-поиск:** инструкции по настройке поисковых провайдеров
- **Шаблоны:** SOUL.md, AGENTS.md, IDENTITY.md, USER.md, TOOLS.md, BOOTSTRAP.md
---

## Установка

```bash
# Клонируйте форк
git clone https://github.com/ZS2101/OpenClaw-RU.git
cd OpenClaw-RU

# Установите зависимости и соберите
npm install
npm run build

# Запустите визард
openclaw onboard

# Если вы решили не подключать OpenClaw к мессенджеру или у вас возникли с этим проблемы
openclaw dashboard

# Или
openclaw tui
```
По умолчанию бот говорит на русском.
Веселитесь!

---

## Недоработки
Баги:
- **Модели YandexCloud** проблемы с каталогом, пользователю нужно в ручную задавать folder id. Уже чиню.

В следубщих элементах OpenClaw отсутсвует локализация:
- **TUI:** Нет, но планируется (Буквально пара строчек на английском, пока просто не добрались руки).
- **Доки:** Пока нет, вроде как этим наши ребята уже занимаются.
## Ссылки

- [Оригинальный OpenClaw](https://github.com/openclaw/openclaw)
- [Документация OpenClaw](https://docs.openclaw.ai) Пока на английском
- [Discord сообщество OpenClaw](https://discord.gg/clawd)
---

## Лицензия

Проект OpenClaw-RU является производным от оригинального OpenClaw и распространяется под той же лицензией **MIT**.
© 2026 Захар Савченко

---

<p align="center">
  <strong>🦞 EXFOLIATE! EXFOLIATE! 🦞</strong>
</p>
