---
name: yandex-translate
description: "Яндекс Перевод — перевод текста, определение языка, 90+ языков. Бесплатный тариф."
metadata:
  openclaw:
    emoji: "🌐"
    requires:
      env: ["YANDEX_TRANSLATE_API_KEY"]
      note: "Free tier: 1M chars/month. Get key at developer.tech.yandex.ru"
---

# Yandex Translate Skill

## Overview

Yandex Translate supports 90+ languages with neural machine translation. Strongest for Russian ↔ English and Russian ↔ CIS languages.

**API Base:** `https://translate.api.cloud.yandex.net/translate/v2`

Auth: `Authorization: Api-Key <key>` header.

## Prerequisites

```bash
export YANDEX_TRANSLATE_API_KEY="your-key"
# Get at: https://developer.tech.yandex.ru/services/translate
# Or use Yandex Cloud IAM token
```

Free tier: 1,000,000 characters/month. Paid: pay per character.

## Translate Text

```bash
curl -X POST "https://translate.api.cloud.yandex.net/translate/v2/translate" \
  -H "Authorization: Api-Key $YANDEX_TRANSLATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceLanguageCode": "ru",
    "targetLanguageCode": "en",
    "texts": ["Привет, как дела?"]
  }'
```

Response: `{"translations": [{"text": "Hi, how are you?", "detectedLanguageCode": "ru"}]}`

### Batch translation

```bash
curl -X POST "https://translate.api.cloud.yandex.net/translate/v2/translate" \
  -H "Authorization: Api-Key $YANDEX_TRANSLATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "targetLanguageCode": "en",
    "texts": ["Доброе утро", "Спасибо за помощь", "Где находится метро?"]
  }'
```

### Auto-detect source language

```bash
curl -X POST "https://translate.api.cloud.yandex.net/translate/v2/translate" \
  -H "Authorization: Api-Key $YANDEX_TRANSLATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "targetLanguageCode": "ru",
    "texts": ["Good morning, how can I help you?"]
  }'
```

Omitting `sourceLanguageCode` triggers auto-detection.

## Language Detection

```bash
curl -X POST "https://translate.api.cloud.yandex.net/translate/v2/detect" \
  -H "Authorization: Api-Key $YANDEX_TRANSLATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Bonjour tout le monde"}'
```

Response: `{"languageCode": "fr"}`

## Supported Language Codes

| Code | Language |
|---|---|
| `ru` | Russian |
| `en` | English |
| `de` | German |
| `fr` | French |
| `es` | Spanish |
| `it` | Italian |
| `zh` | Chinese |
| `ja` | Japanese |
| `ko` | Korean |
| `ar` | Arabic |
| `tr` | Turkish |
| `uk` | Ukrainian |
| `be` | Belarusian |
| `kk` | Kazakh |
| `uz` | Uzbek |
| `ky` | Kyrgyz |
| `tg` | Tajik |
| `hy` | Armenian |
| `az` | Azerbaijani |
| `ka` | Georgian |
| `tt` | Tatar |
| `fi` | Finnish |
| `pl` | Polish |
| `cs` | Czech |

Full list: 90+ languages at Yandex Translate docs.

## Convenience Scripts

### Quick translate (bash function)

```bash
yt() {
  curl -s -X POST "https://translate.api.cloud.yandex.net/translate/v2/translate" \
    -H "Authorization: Api-Key $YANDEX_TRANSLATE_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"sourceLanguageCode\": \"${1:-ru}\", \"targetLanguageCode\": \"${2:-en}\", \"texts\": [\"$3\"]}" | \
    python3 -c "import sys,json; print(json.load(sys.stdin)['translations'][0]['text'])"
}

# Usage:
yt ru en "Привет, как дела?"  →  "Hi, how are you?"
yt en ru "Hello world"         →  "Привет мир"
yt "" fr "Good morning"        →  (auto-detect → French)
```

### Translate channel messages

When a user asks "Translate this to English", use:

```bash
curl -s -X POST "https://translate.api.cloud.yandex.net/translate/v2/translate" \
  -H "Authorization: Api-Key $YANDEX_TRANSLATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"targetLanguageCode\": \"en\", \"texts\": [\"<text-to-translate>\"]}" | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['translations'][0]['text'])"
```

## Important Notes

- Max text length: 10,000 characters per request
- Max texts per batch: 250
- `sourceLanguageCode` optional — auto-detection works well
- Response always includes `detectedLanguageCode` for auto-detect
- Free tier: 1M chars/month, no credit card needed
- Use `format: "HTML"` to preserve HTML tags in translation
