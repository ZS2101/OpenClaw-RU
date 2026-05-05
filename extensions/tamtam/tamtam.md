# TamTam

Messenger by Mail.ru Group. Long Poll-based bot API.

## Setup

1. Open TamTam and chat with @PrimeBot
2. Type /create_bot and follow instructions
3. Copy the access token

## Connect

```bash
export TAMTAM_BOT_TOKEN="your-token"
```

Or add to `~/.rurik/rurik.json`:
```json
"channels": {
  "tamtam": {
    "enabled": true,
    "token": "your-token",
    "name": "My TamTam Bot"
  }
}
```

## Features

- Text messages via Long Poll
- Markdown formatting (native TamTam support)
- DM/group detection
- Inline keyboards and callbacks
- DM policy: open/pairing/allowlist/disabled
- Group management (add/remove members)
- Typing indicator

## Notes

- Auth: `access_token` query parameter
- API base: `botapi.tamtam.chat`
- No webhook URL required — uses polling
- Docs: `dev.tamtam.chat`
