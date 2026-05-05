# GigaChat (Sberbank)

Russian LLM by Sberbank. OpenAI-compatible API.

## Setup

1. Get access token from Sberbank developer portal
2. Set env: `GIGACHAT_ACCESS_TOKEN`

```bash
export GIGACHAT_ACCESS_TOKEN="your-token"
rurik models auth login --provider gigachat --method api-key
rurik models set gigachat/GigaChat
```

## Models

Any model ID works (dynamic resolution):
- `GigaChat`
- `GigaChat-Pro`
- `GigaChat-2-Max`
- `GigaChat3-10B-A1.8B`

## Pricing

Charged in rubles by Sberbank. No subscription required.

## API Base

```
https://gigachat.devices.sberbank.ru/api/v1
```

OpenAI-compatible. Auth: `Authorization: Bearer <token>`.
