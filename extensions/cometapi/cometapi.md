# CometAPI

Russian AI proxy/aggregator. Access OpenAI, Claude, and 200+ models with ruble payment.

## Setup

1. Get API key from api.cometapi.com/console/token
2. Set env: `COMETAPI_API_KEY`

```bash
export COMETAPI_API_KEY="your-key"
rurik models auth login --provider cometapi --method api-key
rurik models set cometapi/gpt-4o
```

## Models

Any model ID works (dynamic resolution):
- `gpt-4o`, `gpt-4o-mini` — OpenAI
- `claude-sonnet-4-5`, `claude-opus-4-7` — Anthropic
- `gemini-2.5-pro` — Google
- 200+ more models

## API Base

```
https://api.cometapi.com/v1
```

OpenAI-compatible. Auth: `Authorization: Bearer <key>`.
