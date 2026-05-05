# Yandex Messenger

Yandex's messaging platform. Bot API with webhook support.

## Setup

1. Go to Yandex Messenger developer console
2. Create a bot
3. Copy the OAuth token
4. Set webhook URL (your-server:18900/webhooks/yandex)

## Connect

```bash
export YANDEX_BOT_TOKEN="your-oauth-token"
export YANDEX_WEBHOOK_URL="https://your-server/webhooks/yandex"
```

Or add to `~/.rurik/rurik.json`:
```json
"channels": {
  "yandex": {
    "enabled": true,
    "token": "your-oauth-token",
    "webhookUrl": "https://your-server/webhooks/yandex"
  }
}
```

## Features

- Text messages via webhook
- chat_id and login-based addressing
- DM/group detection
- DM policy: open/pairing/allowlist/disabled
- Webhook auto-registration on start

## Notes

- Requires public URL for webhooks (or ngrok for local dev)
- Auth: `OAuth <token>` header
- API base: `botapi.messenger.yandex.net/bot/v1`
