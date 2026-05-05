---
name: wildberries
description: "Wildberries Seller API — чаты, отзывы, вопросы. Сообщения покупателей, ответы на отзывы и вопросы."
metadata:
  openclaw:
    emoji: "🛒"
    requires:
      env: ["WB_API_KEY"]
      note: "No subscription required — free for all WB sellers"
---

# Wildberries Seller Skill

## Prerequisites

```bash
export WB_API_KEY="your-key"
```

✅ **No subscription required.** Free for all Wildberries sellers.

## API Base URLs

Wildberries uses separate hosts per API category:

| API | Base URL |
|-----|----------|
| Chat | `https://buyer-chat-api.wildberries.ru` |
| Feedback & Questions | `https://feedbacks-api.wildberries.ru` |
| Common / Ping | `https://common-api.wildberries.ru` |

Auth: `Authorization: <api-key>` header (not Bearer).

Optional locale: `X-Locale: ru` for Russian-language responses.

## When to Use

✅ **Use when:**
- Checking new buyer messages
- Reviewing unanswered product reviews
- Answering product questions
- Checking for new chat events
- Monitoring review status

❌ **Don't use when:**
- Managing products/prices/stocks (use WB Marketplace API)
- Order fulfillment (use WB Orders API)
- Analytics (use WB Statistics API)

## Chat API

**List all chats:**
```bash
curl "https://buyer-chat-api.wildberries.ru/api/v1/seller/chats" \
  -H "Authorization: $WB_API_KEY"
```

**Get chat events (new messages):**
```bash
curl "https://buyer-chat-api.wildberries.ru/api/v1/seller/events" \
  -H "Authorization: $WB_API_KEY"
```

Use `?next=<timestamp>` (integer unix timestamp) for pagination through older events.
Response wraps results in `result.events[]`. There is only one event type: `"message"`.
New chats are identified by the `isNewChat` boolean field on the event, not a separate event type.

**Send message to buyer (text only):**
```bash
curl -X POST "https://buyer-chat-api.wildberries.ru/api/v1/seller/message" \
  -H "Authorization: $WB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"replySign": "<reply-sign>", "message": "Здравствуйте! Спасибо за обращение."}'
```

- `replySign` — the chat's reply sign (from chat object, not the chat ID)
- `message` — text body (max 1000 chars)

**Send message with file (multipart):**
```bash
curl -X POST "https://buyer-chat-api.wildberries.ru/api/v1/seller/message" \
  -H "Authorization: $WB_API_KEY" \
  -F "replySign=<reply-sign>" \
  -F "file=@image.jpg"
```

Max single file size: **5 MB**. Max total file size: **30 MB**.
A message must include either `message` text or a `file`, or both.

**Download file from chat:**
```bash
curl "https://buyer-chat-api.wildberries.ru/api/v1/seller/download/<download-id>" \
  -H "Authorization: $WB_API_KEY" -o file.jpg
```

Returns HTTP 202 if file is still under moderation.

## Review API

**List reviews (with filters):**
```bash
curl "https://feedbacks-api.wildberries.ru/api/v1/feedbacks?take=50&isAnswered=false&order=dateDesc" \
  -H "Authorization: $WB_API_KEY"
```

Params: `take`, `skip`, `isAnswered` (true/false), `order` (dateDesc/dateAsc), `dateFrom`, `dateTo` (unix timestamps), `subjectId`

**Reply to a review:**
```bash
curl -X POST "https://feedbacks-api.wildberries.ru/api/v1/feedbacks/answer" \
  -H "Authorization: $WB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id": "<review-id>", "text": "Спасибо за отзыв! Мы рады, что вам понравилось."}'
```

**Update an existing review reply:**
```bash
curl -X PATCH "https://feedbacks-api.wildberries.ru/api/v1/feedbacks/answer" \
  -H "Authorization: $WB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id": "<review-id>", "text": "Обновлённый ответ."}'
```

**Count reviews:**
```bash
curl "https://feedbacks-api.wildberries.ru/api/v1/feedbacks/count" \
  -H "Authorization: $WB_API_KEY"

# Unanswered only:
curl "https://feedbacks-api.wildberries.ru/api/v1/feedbacks/count-unanswered" \
  -H "Authorization: $WB_API_KEY"
```

Note: `count-unanswered` uses a dash, not a path segment.

## Question API (unique to Wildberries!)

Buyers can ask product questions before purchasing. These are NOT reviews.

**List questions:**
```bash
curl "https://feedbacks-api.wildberries.ru/api/v1/questions?take=50&isAnswered=false" \
  -H "Authorization: $WB_API_KEY"
```

Params: `take`, `skip`, `isAnswered` (true/false), `dateFrom`, `dateTo` (unix timestamps)

**Answer a question:**
```bash
curl -X PATCH "https://feedbacks-api.wildberries.ru/api/v1/questions" \
  -H "Authorization: $WB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id": "<question-id>", "answer": {"text": "Здравствуйте! Этот товар..."}, "state": "wbRu"}'
```

`state` is required — `"wbRu"` publishes the answer. Other states: `"none"` (rejected), `"suppliersPortalSynch"` (new/pending).

**Count questions:**
```bash
curl "https://feedbacks-api.wildberries.ru/api/v1/questions/count" \
  -H "Authorization: $WB_API_KEY"
```

Also available: `GET /api/v1/questions/count-unanswered`

## Pinned Reviews

**List pinned reviews:**
```bash
curl "https://feedbacks-api.wildberries.ru/api/v1/feedbacks/pins" \
  -H "Authorization: $WB_API_KEY"
```

> ⚠️ Not present in the official `wildberries-api` Python SDK (v2.2.0). May be a separate endpoint or undocumented. Verify before relying on it.

## Typical Workflows

### Daily health check
1. Count unanswered reviews → if > 0, list and draft replies
2. Count unanswered questions → if > 0, list and draft answers  
3. Get chat events → summarize any new buyer messages (`eventType: "message"`, check `isNewChat`)
4. Report: rating changes, review count, question count

### Handle reviews
- 5 stars: "Спасибо за отзыв! Мы рады, что вам понравилось."
- 4 stars: "Спасибо! Будем рады узнать, что можно улучшить."
- 3 stars: "Спасибо за обратную связь. Мы работаем над улучшениями."
- 1-2 stars: ⚠️ Flag for human review — DO NOT auto-reply

### Handle questions
- Product availability: "Здравствуйте! Да, этот товар в наличии."
- Size/specs: Provide specific details from product listing
- Delivery: Check order status, provide tracking info
- Unclear: Ask clarifying question back

## Important Notes

- Rate limits: 10 requests per 10 seconds
- Chat senders: `client` (buyer), `seller` (you), or `wb` (Wildberries)
- Events paginate via integer `next` timestamp (not a string cursor). Note: `replySign` from chat events may be expired — always use the latest event's sign.
- Questions are pre-purchase, reviews are post-purchase
- Responses use `result` / `errors` wrapper (not `data` / `error`)
- Feedback answer states: `none` (new), `wbRu` (accepted), `reviewRequired` (on review), `rejected`, `rejectedAntispam`
- Question states: `none` (rejected), `wbRu` (accepted), `suppliersPortalSynch` (new)
- File downloads return HTTP 202 while under moderation
- Max single file: 5 MB; max total files: 30 MB (server-side limit)
