---
name: hh-ru
description: HeadHunter (hh.ru) API — поиск вакансий, резюме, компаний, справочников. Публичный API, большинство методов без авторизации. Использовать когда нужен поиск вакансий на hh.ru, информация о компаниях, зарплатная статистика, справочники (регионы, специализации, навыки).
---

# HeadHunter (hh.ru) API

Base URL: `https://api.hh.ru/`. HTTPS, JSON. User-Agent header required.
OpenAPI docs: https://api.hh.ru/openapi/redoc
GitHub: https://github.com/hhru/api

## Quick Start

### Search vacancies (no auth)

```bash
curl -H 'User-Agent: OpenClaw/1.0' \
  'https://api.hh.ru/vacancies?text=python+developer&area=1&per_page=5'
```

Key params: `text`, `area` (area id from /areas), `experience` (noExperience|between1And3|between3And6|moreThan6), `employment` (full|part|project|volunteer|probation), `schedule` (fullDay|shift|flexible|remote|flyInFlyOut), `salary`, `currency` (RUR|USD|EUR), `only_with_salary`, `order_by` (relevance|salary_asc|salary_desc|publication_time), `page` (0-based), `per_page` (max 100).

### Get vacancy detail

```bash
curl -H 'User-Agent: OpenClaw/1.0' \
  'https://api.hh.ru/vacancies/12345678'
```

### Get area ID (Moscow = 1, SPB = 2, etc.)

```bash
curl -H 'User-Agent: OpenClaw/1.0' \
  'https://api.hh.ru/areas'
```

Returns a tree: countries → regions → cities. Cache this — it changes rarely.

### Search companies

```bash
curl -H 'User-Agent: OpenClaw/1.0' \
  'https://api.hh.ru/employers?text=yandex&only_with_vacancies=true'
```

### Get all dictionaries (experience levels, employment types, industries, etc.)

```bash
curl -H 'User-Agent: OpenClaw/1.0' \
  'https://api.hh.ru/dictionaries'
```

### Autocomplete (suggests)

```bash
# Search query autocomplete
curl -H 'User-Agent: OpenClaw/1.0' \
  'https://api.hh.ru/suggests/vacancy_search_keyword?text=python'

# Company name autocomplete
curl -H 'User-Agent: OpenClaw/1.0' \
  'https://api.hh.ru/suggests/companies?text=сбер'

# Skill autocomplete
curl -H 'User-Agent: OpenClaw/1.0' \
  'https://api.hh.ru/suggests/skill_set?text=python'

# Area autocomplete
curl -H 'User-Agent: OpenClaw/1.0' \
  'https://api.hh.ru/suggests/areas?text=мос'
```

## Pagination

All list endpoints return:

```json
{
  "items": [...],
  "found": 1234,
  "pages": 62,
  "page": 0,
  "per_page": 20
}
```

Use `page` (0-indexed) and `per_page` (max 100). To iterate all results: increment `page` until `page >= pages`.

## Rate Limits

Check response headers: `X-Ratelimit-Remaining`, `X-Ratelimit-Reset`.
Anonymous: ~100 req/min. If rate-limited, add small delays between requests.

## Common Workflows

### Find vacancies by keyword + city

1. If city name unknown → `GET /suggests/areas?text=<city>` to get area id
2. `GET /vacancies?text=<keyword>&area=<id>&per_page=20`
3. For each item, `alternate_url` links to hh.ru, `url` links to API detail

### Compare salaries for a role

1. `GET /dictionaries` → get currency rates via `/salary_statistics/dictionaries/salary_rates`
2. Search with `order_by=salary_desc` and `only_with_salary=true`
3. Extract `salary.from`, `salary.to`, `salary.currency` from results

### Get all vacancies from a company

1. `GET /employers?text=<name>` → get employer id
2. `GET /employers/{id}/vacancies?per_page=100`

## Geo-blocking

hh.ru blocks non-Russian IPs for vacancy/employer search endpoints (`/vacancies`, `/employers`).
Dictionaries (`/areas`, `/dictionaries`, `/suggests/*`) are available worldwide.

Workarounds:

- Use a Russian IP (VPS, VPN)
- Register an app at dev.hh.ru and use an authorized token — may bypass geo-restrictions

## Auth (OAuth2)

Token header: `Authorization: Bearer <token>`

### Register app

1. Go to https://dev.hh.ru → create app
2. Get `client_id` and `client_secret`
3. Set redirect_uri (e.g. `https://example.com/oauth/callback`)

### OAuth2 endpoints

Base: `https://api.hh.ru` (same as public API) and `https://hh.ru/oauth`

```bash
# Step 1: User opens in browser → authorizes → gets code via redirect
open "https://hh.ru/oauth/authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=REDIRECT_URI"

# Step 2: Exchange code for token
curl -X POST -d 'grant_type=authorization_code' \
  -d "client_id=CLIENT_ID" -d "client_secret=CLIENT_SECRET" \
  -d "code=CODE_FROM_STEP1" -d "redirect_uri=REDIRECT_URI" \
  -H 'User-Agent: OpenClaw/1.0' \
  'https://api.hh.ru/oauth/token'
# Response: { "access_token": "...", "refresh_token": "...", "expires_in": 1209600 }

# Step 3: Refresh expired token
curl -X POST -d 'grant_type=refresh_token' \
  -d "refresh_token=REFRESH_TOKEN" \
  -H 'User-Agent: OpenClaw/1.0' \
  'https://api.hh.ru/oauth/token'

# App-level token (no user, limited access)
curl -X POST -d 'grant_type=client_credentials' \
  -d "client_id=CLIENT_ID" -d "client_secret=CLIENT_SECRET" \
  -H 'User-Agent: OpenClaw/1.0' \
  'https://api.hh.ru/oauth/token'
```

### Methods unlocked with auth

| Method                                  | Auth    | Action                                                  |
| --------------------------------------- | ------- | ------------------------------------------------------- |
| `GET /negotiations`                     | 👤 user | List your responses/отклики                             |
| `POST /negotiations`                    | 👤 user | Respond to a vacancy (vacancy_id + resume_id + message) |
| `GET /negotiations/{id}/messages`       | 👤 user | Read messages with employer                             |
| `POST /negotiations/{id}/messages`      | 👤 user | Send message to employer                                |
| `GET /resumes/mine`                     | 👤 user | List your resumes                                       |
| `GET /vacancies/{id}/preferred_contact` | 👤 user | Get direct contacts (email/phone) if employer enabled   |
| Employer vacancy posting                | 🏢 emp  | `POST /vacancies`, `PUT /vacancies/{id}`                |
| Employer resume search                  | 🏢 emp  | `GET /resumes`                                          |

**Note:** OAuth2 token may also bypass the geo-blocking on `/vacancies` and `/employers`.

## Reference

Full endpoint reference with all params, auth levels, and response shapes: [references/api_endpoints.md](references/api_endpoints.md)
Read when: need an endpoint not covered here, need detailed auth requirements, or need exact response field documentation.
