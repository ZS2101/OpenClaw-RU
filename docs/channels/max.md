# MAX Messenger

Russian messenger by max.ru. Webhook-based bot API.

## Setup

1. Go to max.ru → Developer settings
2. Create a bot and copy the token
3. Set webhook URL for receiving messages

## Connect

```bash
export MAX_BOT_TOKEN="your-token"
export MAX_WEBHOOK_URL="https://your-server/webhooks/max"
```

Or add to `~/.rurik/rurik.json`:
```json
"channels": {
  "max": {
    "enabled": true,
    "token": "your-token",
    "webhookUrl": "https://your-server/webhooks/max"
  }
}
```

## Features

- Text messages via webhook
- DM/group detection
- DM policy: open/pairing/allowlist/disabled
- Group mention detection

## Notes

- Auth: `Authorization: <token>` header (plain token)
- API base: `platform-api.max.ru`
- Docs: `dev.max.ru/docs-api`
