---
name: avito
description: "Avito Seller API — чаты, отзывы, рейтинг. Сообщения покупателей, ответы на отзывы, рейтинг продавца."
metadata:
  openclaw:
    emoji: "🏷️"
    requires:
      env: ["AVITO_CLIENT_ID", "AVITO_CLIENT_SECRET"]
      note: "OAuth2 — client_credentials flow. Set user_id in config. ⚠️ Requires paid Avito tariff (Расширенный for services, Максимальный for goods)."
---

# Avito Seller Skill

## ⚠️ Subscription Requirement

**A paid Avito tariff is required** to access the Messenger API:

- For **services**: «Расширенный» or «Максимальный» tariff
- For **goods**: «Максимальный» tariff

Without an active tariff, the API returns access errors even with valid OAuth tokens.

## Prerequisites

```bash
export AVITO_CLIENT_ID="your-id"
export AVITO_CLIENT_SECRET="your-secret"
```

Auth: OAuth2 client_credentials → access token → `Authorization: Bearer <token>` header.

## API Base

```
https://api.avito.ru
```

Token URL: `https://api.avito.ru/token`

## When to Use

✅ **Use when:**

- Checking buyer messages in Avito messenger
- Reviewing ratings and reviews
- Replying to reviews
- Deleting review replies
- Checking unanswered reviews

❌ **Don't use when:**

- Managing listings (use Avito Autoload API)
- Order management (use Avito Delivery API)
- Promotion/CPA analytics

## Getting a Token

```bash
TOKEN=$(curl -s -X POST "https://api.avito.ru/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=$AVITO_CLIENT_ID" \
  -d "client_secret=$AVITO_CLIENT_SECRET" | jq -r '.access_token')
```

Token is valid ~24 hours. Cache it.

## Messenger API

**List all chats:**

```bash
curl "https://api.avito.ru/messenger/v2/accounts/<user_id>/chats" \
  -H "Authorization: Bearer $TOKEN"
```

**Get chat messages:**

```bash
curl "https://api.avito.ru/messenger/v3/accounts/<user_id>/chats/<chat_id>/messages/?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

**Send message:**

```bash
curl -X POST "https://api.avito.ru/messenger/v1/accounts/<user_id>/chats/<chat_id>/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": {"text": "Здравствуйте! Спасибо за ваш вопрос о товаре."}}'
```

**Send image:**

```bash
curl -X POST "https://api.avito.ru/messenger/v1/accounts/<user_id>/chats/<chat_id>/messages/image" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": {"image": "<base64>"}}'
```

**Mark chat as read:**

```bash
curl -X POST "https://api.avito.ru/messenger/v1/accounts/<user_id>/chats/<chat_id>/read" \
  -H "Authorization: Bearer $TOKEN"
```

**Webhook subscription (optional):**

```bash
curl -X POST "https://api.avito.ru/messenger/v3/webhook" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-server/webhooks/avito"}'
```

## Reviews & Ratings API

**Get seller rating:**

```bash
curl "https://api.avito.ru/ratings/v1/info" \
  -H "Authorization: Bearer $TOKEN"
```

**List reviews (paginated):**

```bash
curl "https://api.avito.ru/ratings/v1/reviews?page=1&per_page=20" \
  -H "Authorization: Bearer $TOKEN"
```

Params: `page`, `per_page`, `rating` (1-5 filter), `status`

**Reply to a review:**

```bash
curl -X POST "https://api.avito.ru/ratings/v1/answers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"review_id": "<review-id>", "text": "Спасибо за отзыв! Рады, что вам понравилось."}'
```

**Delete a reply:**

```bash
curl -X DELETE "https://api.avito.ru/ratings/v1/answers/<answer-id>" \
  -H "Authorization: Bearer $TOKEN"
```

## Typical Workflows

### Daily check

1. Get token
2. Get rating → report changes
3. List unanswered reviews → draft replies
4. List chats → check for unread buyer messages
5. Summarize findings

### Handle reviews

- 5 stars: "Спасибо за отзыв! Рады, что всё прошло отлично."
- 4 stars: "Спасибо! Будем стараться стать ещё лучше."
- 3 stars: "Спасибо за обратную связь. Учтём ваши пожелания."
- 1-2 stars: ⚠️ NEVER auto-reply — show to human

### Respond to buyer questions

- "Товар ещё в наличии?" → Check listing, answer yes/no
- "Какое состояние?" → Describe based on listing
- "Торг уместен?" → State your policy
- "Доставка в X?" → Check delivery options

## Important Notes

- `<user_id>` is your Avito account ID (numeric) — find in account settings
- Token expires ~24h, cache and refresh
- Messenger API needs user_id in the URL path
- Review replies can be deleted if mistaken
- Avito is buyer-seller chat only — no group chats
- Webhooks optional — polling works without them
