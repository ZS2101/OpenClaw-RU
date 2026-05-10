---
name: kinopoisk
description: "Поиск фильмов, сериалов, актёров, рейтингов, рецензий и медиа-данных через неофициальный API Кинопоиска (kinopoiskapiunofficial.tech). Использовать когда пользователь спрашивает о фильмах, ищет информацию о кино, рейтингах, актёрах, наградах, сборах, трейлерах, постерах, рецензиях, сиквелах/приквелах, или хочет получить данные из базы Кинопоиска. Не использовать для новостей кинорынка или общих обсуждений — только для структурированных запросов к API."
---

# Kinopoisk Unofficial API

Base URL: `https://kinopoiskapiunofficial.tech`
Auth: `X-API-KEY: <token>` header on every request.

## Quick start

1. Get a free token at https://kinopoiskapiunofficial.tech/signup
2. Store token as `$KP_TOKEN`
3. Query:

```bash
# Film by ID (301 = The Matrix)
curl -H "X-API-KEY: $KP_TOKEN" \
  "https://kinopoiskapiunofficial.tech/api/v2.2/films/301"

# Search by keyword
curl -H "X-API-KEY: $KP_TOKEN" \
  "https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=Интерстеллар&page=1"

# Search persons
curl -H "X-API-KEY: $KP_TOKEN" \
  "https://kinopoiskapiunofficial.tech/api/v1/persons?name=ДиКаприо&page=1"
```

## Rate limits

- 20 req/sec — global limit. 429 response when exceeded.
- Daily limits per plan (see https://kinopoiskapiunofficial.tech/rates). Free tier: 500 req/day.
- Some endpoints have additional limits (check 429 response description).
- **Pacing**: space requests by ≥50ms (shell: `sleep 0.05` between curls). For bulk calls, serialize; do not parallelize.

## Pagination

Endpoints returning lists use `page` parameter (1-indexed). Most return ≤20 items/page.

```bash
# Fetch multiple pages
for page in 1 2 3; do
  curl -H "X-API-KEY: $KP_TOKEN" \
    "https://kinopoiskapiunofficial.tech/api/v2.2/films?order=RATING&page=$page"
  sleep 0.05
done
```

## Core endpoints

### Film data (v2.2)

| Method | Path                                    | Description                                                    |
| ------ | --------------------------------------- | -------------------------------------------------------------- |
| GET    | `/api/v2.2/films/{id}`                  | Film details: title, rating, year, genres, description, poster |
| GET    | `/api/v2.2/films/{id}/seasons`          | Seasons/episodes for TV series                                 |
| GET    | `/api/v2.2/films/{id}/facts`            | Facts (FACT) and bloopers (BLOOPER)                            |
| GET    | `/api/v2.2/films/{id}/box_office`       | Budget & box office                                            |
| GET    | `/api/v2.2/films/{id}/awards`           | Awards & nominations                                           |
| GET    | `/api/v2.2/films/{id}/videos`           | Trailers, teasers, videos                                      |
| GET    | `/api/v2.2/films/{id}/images`           | Posters, stills, wallpapers, fan-art                           |
| GET    | `/api/v2.2/films/{id}/similars`         | Similar films                                                  |
| GET    | `/api/v2.2/films/{id}/relations`        | Related films (sequels, prequels, remakes)                     |
| GET    | `/api/v2.2/films/{id}/reviews`          | User reviews                                                   |
| GET    | `/api/v2.2/films/{id}/distributions`    | Distribution by country                                        |
| GET    | `/api/v2.2/films/{id}/external_sources` | Where to watch online                                          |

### Search & discovery (v2.2)

| Method | Path                          | Description                                                                                                              |
| ------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/v2.2/films`             | Filtered search: `countries`, `genres`, `order`, `type`, `ratingFrom`/`ratingTo`, `yearFrom`/`yearTo`, `keyword`, `page` |
| GET    | `/api/v2.2/films/premieres`   | Premieres by `year` & `month` (JANUARY…DECEMBER)                                                                         |
| GET    | `/api/v2.2/films/collections` | Top lists: `TOP_250_MOVIES`, `TOP_POPULAR_ALL`, `OSKAR_WINNERS_2021`, `CLOSES_RELEASES`, etc.                            |
| GET    | `/api/v2.2/films/filters`     | Genre & country IDs for use in `/api/v2.2/films`                                                                         |

### Legacy search (v2.1)

| Method | Path                                        | Description                    |
| ------ | ------------------------------------------- | ------------------------------ |
| GET    | `/api/v2.1/films/search-by-keyword`         | Keyword search with pagination |
| GET    | `/api/v2.1/films/{id}/sequels_and_prequels` | Sequels & prequels             |

### Staff & persons (v1)

| Method | Path                          | Description                           |
| ------ | ----------------------------- | ------------------------------------- |
| GET    | `/api/v1/staff?filmId={id}`   | Cast & crew for a film                |
| GET    | `/api/v1/staff/{id}`          | Person details by Kinopoisk person ID |
| GET    | `/api/v1/persons?name={name}` | Search persons by name                |

### Other (v1)

| Method | Path                          | Description               |
| ------ | ----------------------------- | ------------------------- |
| GET    | `/api/v1/media_posts`         | Media news from Kinopoisk |
| GET    | `/api/v1/kp_users/{id}/votes` | User's ratings/votes      |
| GET    | `/api/v1/api_keys/{apiKey}`   | API key info              |

## Key conventions

- **Film IDs**: Kinopoisk internal IDs (e.g. 301 = The Matrix, 258687 = Interstellar, 535341 = 1+1). Find IDs via search.
- **Errors**: `401` = bad/missing token, `402` = daily limit exceeded, `404` = not found, `429` = too many requests.
- **Images**: returned as relative URLs (prefix with `https:`). Use `avatarsUrl` field for thumbnails — add `https:` if scheme is missing.
- **Videos**: YouTube URLs, Yandex.Disk URLs, or Kinopoisk widget URLs (widgets require Russian IP).

## Detailed reference

For complete endpoint documentation, request/response schemas, and all query parameters, see [references/api_endpoints.md](references/api_endpoints.md).

## Example recipes

**Find a film and get its details:**

```bash
# Step 1: search
curl -s -H "X-API-KEY: $KP_TOKEN" \
  "https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=Матрица" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); [print(f['filmId'], f['nameRu']) for f in d.get('films',[])[:5]]"

# Step 2: get full info
curl -s -H "X-API-KEY: $KP_TOKEN" \
  "https://kinopoiskapiunofficial.tech/api/v2.2/films/301"
```

**Top 250 with rating > 8.5:**

```bash
# Get filters first
curl -s -H "X-API-KEY: $KP_TOKEN" \
  "https://kinopoiskapiunofficial.tech/api/v2.2/films/filters"

# Then search
curl -s -H "X-API-KEY: $KP_TOKEN" \
  "https://kinopoiskapiunofficial.tech/api/v2.2/films?order=RATING&ratingFrom=8.5&type=ALL&page=1"
```

**Cast of a film:**

```bash
curl -s -H "X-API-KEY: $KP_TOKEN" \
  "https://kinopoiskapiunofficial.tech/api/v1/staff?filmId=301"
```

**Posters for a film:**

```bash
curl -s -H "X-API-KEY: $KP_TOKEN" \
  "https://kinopoiskapiunofficial.tech/api/v2.2/films/301/images?type=POSTER&page=1"
```
