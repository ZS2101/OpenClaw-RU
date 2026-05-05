# VK Teams (VK WorkSpace)

Corporate messenger by VK/Mail.ru Group. Long Poll-based bot API. Formerly known as MyTeam.

## Setup

1. VK Teams admin panel → Bots → Create bot
2. Copy the token (format: 001.XXXX.XXXX:XXXX)

## Connect

```bash
export VKTEAMS_BOT_TOKEN="001.XXXX.XXXX:XXXX"
```

Or add to `~/.rurik/rurik.json`:
```json
"channels": {
  "vkteams": {
    "enabled": true,
    "token": "001.XXXX.XXXX:XXXX",
    "name": "My VK Teams Bot"
  }
}
```

## Features

- Text messages via Long Poll
- DM and group chat support
- Message editing and deletion
- File uploads
- Chat management (create, info, members, pins)
- Typing indicator (sendActions)
- DM policy: open/pairing/allowlist/disabled
- Group mention detection

## Notes

- Auth: `token` query parameter in GET requests
- API base: `api.internal.myteam.mail.ru/bot/v1`
- All API calls use GET method (not POST)
- Docs: `teams.vk.com/botapi`
- SDKs: Python, Golang, Java (official)
