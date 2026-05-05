# Cloud.ru Foundation Models

Russian cloud provider (ex-SberCloud). OpenAI-compatible API with 16 pre-deployed models.

## Setup

1. Get API key from Cloud.ru console
2. Set env: `CLOUDRU_API_KEY`

```bash
export CLOUDRU_API_KEY="your-key"
rurik models auth login --provider cloudru --method api-key
rurik models set cloudru/GigaChat-2-Max
```

## Models

| ID | Provider | Context |
|---|---|---|
| GigaChat-2-Max | Sber | 131K |
| GigaChat3-10B-A1.8B | ai-sage | 262K |
| MiniMax-M2 | MiniMaxAI | 196K |
| GLM-4.7-Flash | zai-org | 202K (free) |
| GLM-4.7 | zai-org | 202K (free) |
| GLM-4.6 | zai-org | 202K |
| gpt-oss-120b | OpenAI | 131K |
| Qwen3-Coder-Next | Qwen | 262K (free) |
| Qwen3-Coder-480B | Qwen | 262K |
| Qwen3-235B | Qwen | 262K |
| Qwen3-Next-80B | Qwen | 262K |
| T-lite IT 2.1 | t-tech | 40K (free) |
| T-pro IT 2.1 | t-tech | 40K (free) |
| T-pro IT 2.0 | t-tech | 40K |
| T-lite IT 1.0 | t-tech | 32K |
| T-pro IT 1.0 | t-tech | 32K |

6 free models available.

## API Base

```
https://foundation-models.api.cloud.ru/v1
```

OpenAI-compatible. Auth: standard API key header.
