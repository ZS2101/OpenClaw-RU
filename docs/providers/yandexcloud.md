# Yandex Cloud Foundation Models

Yandex Cloud AI platform. OpenAI-compatible API for YandexGPT, Llama, and more.

## Setup

1. Get API key from Yandex Cloud console
2. Get folder ID
3. Set env vars

```bash
export YANDEX_API_KEY="AQVN..."
export YANDEX_FOLDER_ID="b1g..."
rurik models auth login --provider yandexcloud --method api-key
rurik models set yandexcloud/yandexgpt
```

## Models

Any model ID works (dynamic resolution):
- `yandexgpt` — YandexGPT Pro
- `yandexgpt-lite` — YandexGPT Lite
- `yandexgpt-32k` — Extended context
- `llama-3` — Llama 3 (hosted)

## API Base

```
https://ai.api.cloud.yandex.net/v1
```

OpenAI-compatible. Auth: `Authorization: Api-Key <key>`.
