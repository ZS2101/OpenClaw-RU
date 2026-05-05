# VK (VKontakte)

Russian social network — the largest in Russia/CIS. Community bot with Long Poll API.

## Setup

1. Create a VK community (group)
2. Go to Manage → API usage → Create token
3. Select `messages` scope
4. Copy the token (starts with `vk1.a.`)

## Connect

```bash
export VK_BOT_TOKEN="vk1.a...."
```

Or add to `~/.rurik/rurik.json`:
```json
"channels": {
  "vk": {
    "enabled": true,
    "token": "vk1.a....",
    "name": "My VK Bot"
  }
}
```

## Features

- Text messages in DMs and group chats
- Group chat detection (peer_id > 2e9)
- Mention detection (`[club...|@bot]`)
- DM policy: open/pairing/allowlist/disabled
- Long Poll with auto-reconnect

## Notes

- Community tokens only (not user tokens)
- Bot can't initiate conversations — users DM first
- Group messages require bot to be admin
- Rate limit: ~20 messages/second
