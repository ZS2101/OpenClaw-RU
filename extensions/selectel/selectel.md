# Selectel Foundation Models

Russian hosting provider. Deploy models as inference services, get OpenAI-compatible endpoints.

## Setup

1. Deploy model in Selectel console
2. Get endpoint URL + API key
3. Configure base URL manually

```bash
export SELECTEL_API_KEY="your-key"
rurik config set models.providers.selectel.baseUrl "https://your-endpoint/v1"
rurik models auth login --provider selectel --method api-key
rurik models set selectel/<model-id>
```

## Models

Any model ID works (dynamic resolution). Deploy in Selectel console first.

## API Base

Your inference service endpoint (unique per deployment).

```
https://<your-endpoint>/v1
```

OpenAI-compatible. Auth: standard API key header.
