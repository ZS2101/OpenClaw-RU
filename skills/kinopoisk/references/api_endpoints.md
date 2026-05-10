# Kinopoisk API — Full Endpoint Reference

Base URL: `https://kinopoiskapiunofficial.tech`
Auth: `X-API-KEY: <token>` header
Rate limit: 20 req/sec | Free tier: 500 req/day

---

## Films v2.2

### `GET /api/v2.2/films/{id}` — Film details

Returns: `Film` object with `kinopoiskId`, `nameRu`, `nameEn`, `nameOriginal`, `posterUrl`, `posterUrlPreview`, `coverUrl`, `logoUrl`, `ratingKinopoisk`, `ratingImdb`, `year`, `filmLength`, `slogan`, `description`, `shortDescription`, `type`, `countries`, `genres`, `startYear`, `endYear`, `serial`, `lastSync`.

```bash
curl -H "X-API-KEY: $KP_TOKEN" "https://kinopoiskapiunofficial.tech/api/v2.2/films/301"
```

### `GET /api/v2.2/films/{id}/seasons` — Seasons (TV series)

Returns: `SeasonResponse` with `total`, `items[]` each containing `number`, `episodes[]` (`episodeNumber`, `nameRu`, `nameEn`, `releaseDate`).

### `GET /api/v2.2/films/{id}/facts` — Facts & bloopers

Returns: `FactResponse` with `total`, `items[]` each containing `text`, `type` (`FACT` or `BLOOPER`), `spoiler`.

### `GET /api/v2.2/films/{id}/box_office` — Budget & box office

Returns: `BoxOfficeResponse` with `total`, `items[]` each containing `type`, `amount`, `currencyCode`, `name`, `symbol`.

### `GET /api/v2.2/films/{id}/awards` — Awards

Returns: `AwardResponse` with `total`, `items[]` each containing `name`, `win`, `imageUrl`, `nominationName`, `year`, `persons[]`.

### `GET /api/v2.2/films/{id}/videos` — Trailers & videos

Returns: `VideoResponse` with `total`, `items[]` each containing `url`, `name`, `site` (`YOUTUBE`, `YANDEX_DISK`, `KINOPOISK_WIDGET`). KINOPOISK_WIDGET urls require Russian IP.

### `GET /api/v2.2/films/{id}/images` — Images

Parameters: `type` (`STILL`, `SHOOTING`, `POSTER`, `FAN_ART`, `PROMO`, `CONCEPT`, `WALLPAPER`, `COVER`, `SCREENSHOT`), `page` (1-indexed, ≤20 per page).

Returns: `ImageResponse` with `total`, `totalPages`, `items[]` each containing `imageUrl`, `previewUrl`.

### `GET /api/v2.2/films/{id}/similars` — Similar films

Returns: `SimilarFilmResponse` with `total`, `items[]` each containing `filmId`, `nameRu`, `nameEn`, `nameOriginal`, `posterUrl`, `relationType`.

### `GET /api/v2.2/films/{id}/relations` — Related films

Returns: `RelatedFilmResponse` with `items[]` each containing `filmId`, `nameRu`, `nameEn`, `nameOriginal`, `posterUrl`, `relationType` (`SEQUEL`, `PREQUEL`, `REMAKE`, `SIMILAR`).

### `GET /api/v2.2/films/{id}/reviews` — User reviews

Parameters: `page`, `order` (`DATE_ASC`, `DATE_DESC`, `USER_POSITIVE_RATING_ASC`, `USER_POSITIVE_RATING_DESC`, `USER_NEGATIVE_RATING_ASC`, `USER_NEGATIVE_RATING_DESC`).

Returns: `ReviewResponse` with `total`, `totalPages`, `items[]` each containing `kinopoiskId`, `type`, `date`, `title`, `description`, `author`, `positiveRating`, `negativeRating`.

### `GET /api/v2.2/films/{id}/distributions` — Distribution by country

Returns: `DistributionResponse` with `total`, `items[]` each containing `country`, `companies[]`, `type`, `date`.

### `GET /api/v2.2/films/{id}/external_sources` — Watch online

Parameters: `page` (≤20 per page).

Returns: `ExternalSourceResponse` with `total`, `items[]` each containing `url`, `platform`, `logoUrl`.

### `GET /api/v2.2/films` — Filtered search

Parameters:

- `countries` (array, comma-separated IDs, max 1)
- `genres` (array, comma-separated IDs, max 1)
- `order` (`RATING`, `NUM_VOTE`, `YEAR`)
- `type` (`FILM`, `TV_SHOW`, `TV_SERIES`, `MINI_SERIES`, `ALL`)
- `ratingFrom`, `ratingTo` (number, 0-10)
- `yearFrom`, `yearTo` (integer)
- `imdbId` (string)
- `keyword` (string, searches film name)
- `page` (≤20 per page, max 400 total results)

Returns: `FilmSearchResponse` with `total`, `totalPages`, `items[]`.

```bash
curl -H "X-API-KEY: $KP_TOKEN" \
  "https://kinopoiskapiunofficial.tech/api/v2.2/films?order=RATING&ratingFrom=7&yearFrom=2020&type=FILM&page=1"
```

### `GET /api/v2.2/films/premieres` — Premieres

Parameters: `year` (required), `month` (required — `JANUARY` through `DECEMBER`).

Returns: `PremiereResponse` with `total`, `items[]`.

```bash
curl -H "X-API-KEY: $KP_TOKEN" \
  "https://kinopoiskapiunofficial.tech/api/v2.2/films/premieres?year=2024&month=DECEMBER"
```

### `GET /api/v2.2/films/collections` — Top lists / collections

Parameters: `type` (optional), `page`.

Types: `TOP_POPULAR_ALL`, `TOP_POPULAR_MOVIES`, `TOP_250_TV_SHOWS`, `TOP_250_MOVIES`, `VAMPIRE_THEME`, `COMICS_THEME`, `CLOSES_RELEASES`, `FAMILY`, `OSKAR_WINNERS_2021`, `LOVE_THEME`, `ZOMBIE_THEME`, `CATASTROPHE_THEME`, `KIDS_ANIMATION_THEME`, `POPULAR_SERIES`.

Returns: paginated list of films (≤20/page).

### `GET /api/v2.2/films/filters` — Genre & country IDs

Returns: `FilterResponse` with `genres[]` (`id`, `genre`) and `countries[]` (`id`, `country`). Use these IDs in `/api/v2.2/films` `genres` and `countries` params.

---

## Films v2.1 (legacy)

### `GET /api/v2.1/films/search-by-keyword` — Keyword search

Parameters: `keyword` (required), `page` (≤20/page).

Returns: `SearchResponse` with `keyword`, `pagesCount`, `searchFilmsCountResult`, `films[]` (`filmId`, `nameRu`, `nameEn`, `year`, `filmLength`, `countries[]`, `genres[]`, `rating`, `posterUrl`).

### `GET /api/v2.1/films/{id}/sequels_and_prequels` — Sequels & prequels

Returns: array of related films with `filmId`, `nameRu`, `nameEn`, `year`, `posterUrl`, `relationType`.

---

## Staff v1

### `GET /api/v1/staff?filmId={id}` — Cast & crew

Returns: array of `Staff` objects (`staffId`, `nameRu`, `nameEn`, `posterUrl`, `professionText`, `professionKey`, `description`).

### `GET /api/v1/staff/{id}` — Person details

Returns: `StaffPerson` with `staffId`, `nameRu`, `nameEn`, `posterUrl`, `sex`, `growth`, `birthday`, `age`, `spouses[]`, `profession`, `facts[]`, `films[]`.

## Persons v1

### `GET /api/v1/persons` — Search persons by name

Parameters: `name` (required), `page` (≤50/page).

Returns: `PersonSearchResponse` with `total`, `items[]` (`kinopoiskId`, `webUrl`, `nameRu`, `nameEn`, `posterUrl`, `sex`, `growth`, `birthday`, `profession`).

## API Keys v1

### `GET /api/v1/api_keys/{apiKey}` — API key info

Returns: API key metadata (plan info, limits, expiry).

## KP Users v1

### `GET /api/v1/kp_users/{id}/votes` — User's ratings

Returns: paginated list of the user's film ratings (`filmId`, `rating`, `date`).

## Media Posts v1

### `GET /api/v1/media_posts` — Media news

Parameters: `page` (≤20/page).

Returns: paginated list of media posts from Kinopoisk.

---

## Error responses

| Status | Meaning                                             |
| ------ | --------------------------------------------------- |
| 401    | Empty or invalid token                              |
| 402    | Daily or total request limit exceeded               |
| 404    | Film/person not found                               |
| 429    | Too many requests (>20 req/sec). Retry after delay. |

## Tips for web_fetch usage

When using `web_fetch` instead of `curl`, set custom headers:

```
Headers: X-API-KEY: <token>
```

The token is passed in the `X-API-KEY` header. For `web_fetch`, include it via the `customHeaders` or equivalent mechanism. If web_fetch doesn't support custom headers, use `exec` with curl instead.
