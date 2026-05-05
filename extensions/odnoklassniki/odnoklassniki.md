# Odnoklassniki (OK.ru)

Russian social network by VK/Mail.ru Group. Webhook-based bot API.

## Setup

1. Go to apiok.ru → Create a bot
2. Select your OK group
3. Copy the access token

## Connect

```bash
export OK_BOT_TOKEN="your-token"
export OK_WEBHOOK_URL="https://your-server/webhooks/odnoklassniki"
```

Or add to `~/.rurik/rurik.json`:
```json
"channels": {
  "odnoklassniki": {
    "enabled": true,
    "token": "your-token",
    "webhookUrl": "https://your-server/webhooks/odnoklassniki"
  }
}
```

## Features

- Text messages via webhook
- DM/group detection
- DM policy: open/pairing/allowlist/disabled
- Group mention detection

## Notes

- Auth: `access_token` query parameter
- API base: `api.ok.ru/graph/me`
- Webhook events: MESSAGE_CREATED, MESSAGE_CALLBACK
