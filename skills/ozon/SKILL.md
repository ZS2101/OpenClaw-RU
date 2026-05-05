---
name: ozon
description: "Ozon Seller API — чаты, отзывы, рейтинг. Сообщения покупателей, ответы на отзывы, рейтинг продавца."
metadata:
  openclaw:
    emoji: "📦"
    requires:
      env: ["OZON_API_KEY", "OZON_CLIENT_ID"]
      note: "Premium Plus subscription required for chat/review API access"
---

# Ozon Seller Skill

## Prerequisites

```bash
export OZON_API_KEY="your-key"
export OZON_CLIENT_ID="your-client-id"
```

⚠️ **Premium Plus subscription** (~25,000₽/month) required for chat and review API access.

## API Base

```
https://api-seller.ozon.ru
```

Auth headers: `Client-Id: <id>`, `Api-Key: <key>`, `Content-Type: application/json`

## When to Use

✅ **Use this skill when:**
- Checking for new buyer messages in Ozon chats
- Reviewing unanswered product reviews
- Drafting replies to reviews
- Checking seller rating
- Monitoring chat activity

❌ **Don't use when:**
- Managing products, prices, stocks (use Ozon product API instead)
- Order fulfillment (use Ozon FBO/FBS API)
- Analytics/reports (use Ozon analytics API)

## Available API Functions

The Ozon API module is bundled with Rurik at `extensions/ozon/src/api.ts`.

### Chat Operations

**List all chats (paginated):**
```bash
curl -X POST "https://api-seller.ozon.ru/v2/chat/list" \
  -H "Client-Id: $OZON_CLIENT_ID" \
  -H "Api-Key: $OZON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 30}'
```

**Send message to buyer:**
```bash
curl -X POST "https://api-seller.ozon.ru/v1/chat/send/message" \
  -H "Client-Id: $OZON_CLIENT_ID" \
  -H "Api-Key: $OZON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "<chat-id>", "text": "Здравствуйте! Спасибо за ваш вопрос."}'
```

Text limit: 1-1000 characters.

**Start chat with buyer:**
```bash
curl -X POST "https://api-seller.ozon.ru/v1/chat/start" \
  -H "Client-Id: $OZON_CLIENT_ID" \
  -H "Api-Key: $OZON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"posting_number": "FBS-12345"}'
```

**Get chat history:**
```bash
curl -X POST "https://api-seller.ozon.ru/v2/chat/history" \
  -H "Client-Id: $OZON_CLIENT_ID" \
  -H "Api-Key: $OZON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "<chat-id>", "limit": 50, "direction": "Backward"}'
```

**Mark messages as read:**
```bash
curl -X POST "https://api-seller.ozon.ru/v2/chat/read" \
  -H "Client-Id: $OZON_CLIENT_ID" \
  -H "Api-Key: $OZON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "<chat-id>", "from_message_id": 123}'
```

### Review Operations

**List reviews (filterable):**
```bash
curl -X POST "https://api-seller.ozon.ru/v1/review/list" \
  -H "Client-Id: $OZON_CLIENT_ID" \
  -H "Api-Key: $OZON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50, "status": "UNPROCESSED"}'
```

Status values: `UNPROCESSED`, `PROCESSED`, `ALL`

**Reply to a review:**
```bash
curl -X POST "https://api-seller.ozon.ru/v1/review/comment/create" \
  -H "Client-Id: $OZON_CLIENT_ID" \
  -H "Api-Key: $OZON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"review_id": "<review-id>", "text": "Спасибо за отзыв!", "mark_review_as_processed": true}'
```

### Rating Operations

**Get seller rating:**
```bash
curl -X POST "https://api-seller.ozon.ru/v1/rating/summary" \
  -H "Client-Id: $OZON_CLIENT_ID" \
  -H "Api-Key: $OZON_API_KEY" \
  -H "Content-Type: application/json"
```

## Typical Workflows

### Check for new messages
1. Call `v2/chat/list` to get all chats
2. Check `last_message` field for unread messages from buyers
3. Draft helpful responses
4. Send replies via `v1/chat/send/message`

### Handle unanswered reviews
1. Call `v1/review/list` with `"status": "UNPROCESSED"`
2. For each review:
   - 5 stars: draft a warm thank-you
   - 4 stars: thank and ask what could be improved
   - 3 stars: acknowledge feedback
   - 1-2 stars: DON'T reply automatically — flag for human review
3. Post replies via `v1/review/comment/create`

### Daily health check
```
1. Get rating → report any changes
2. Count unanswered reviews → if > 0, draft replies
3. Count unread chats → if > 0, summarize and offer to respond
```

## Important Notes

- All API calls use POST method
- Review replies can only be edited within 24 hours
- Chat messages limited to 1000 characters
- FBO chats: buyer must initiate first
- FBS/rFBS: seller can start chat within 72h after payment/delivery
- After 72h, seller can only reply to buyer messages (within 48h of receipt)
