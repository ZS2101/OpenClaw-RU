---
name: yandex-metrika
description: "Яндекс Метрика — аналитика сайта: визиты, просмотры, источники, цели, отказы. OAuth-токен."
metadata:
  openclaw:
    emoji: "📊"
    requires:
      env: ["YANDEX_METRIKA_TOKEN", "YANDEX_METRIKA_COUNTER_ID"]
      note: "Get OAuth token at oauth.yandex.ru. Endpoints verified: api-metrika.yandex.net → 403 (auth required, active)."
---

# Yandex Metrika Skill

## Verified Endpoints

```
api-metrika.yandex.net/management/v1/counters → 403 ✅
api-metrika.yandex.net/stat/v1/data → 403 ✅
```

Auth: `Authorization: OAuth <token>` header.

## Prerequisites

```bash
export YANDEX_METRIKA_TOKEN="y0_AgAAAA..."
export YANDEX_METRIKA_COUNTER_ID="12345678"
# Token from: oauth.yandex.ru (scope: metrika)
# Counter ID from: https://metrika.yandex.ru → Settings → Counter code
```

## Counter Info

```bash
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/management/v1/counter/$YANDEX_METRIKA_COUNTER_ID" | python3 -c "
import sys, json
d = json.load(sys.stdin)
c = d['counter']
print(f'Site: {c[\"site\"]}')
print(f'Name: {c[\"name\"]}')
print(f'Type: {c[\"type\"]}')
print(f'Goals: {len(c.get(\"goals\",[]))}')
print(f'Filters: {len(c.get(\"filters\",[]))}')
" 2>/dev/null
```

## Today's Stats

```bash
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/stat/v1/data?ids=$YANDEX_METRIKA_COUNTER_ID&metrics=ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate&dimensions=ym:s:date&date1=today&date2=today&limit=1" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('data'):
    data = d['data'][0]
    metrics = [m.split(':')[2] for m in d['query']['metrics']]
    for m, v in zip(metrics, data['metrics']):
        print(f'{m}: {v}')
" 2>/dev/null
```

## Yesterday's Traffic

```bash
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/stat/v1/data?ids=$YANDEX_METRIKA_COUNTER_ID&metrics=ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds&date1=yesterday&date2=yesterday" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('data'):
    data = d['data'][0]
    visits = data['metrics'][0]
    users = data['metrics'][1]
    pv = data['metrics'][2]
    bounce = data['metrics'][3]
    dur = data['metrics'][4] if len(data['metrics']) > 4 else 0
    print(f'Visits: {visits}')
    print(f'Users: {users}')
    print(f'Pageviews: {pv}')
    print(f'Bounce: {bounce:.1f}%')
    print(f'Avg time: {dur:.0f}s')
"
```

## 7-Day Overview

```bash
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/stat/v1/data?ids=$YANDEX_METRIKA_COUNTER_ID&metrics=ym:s:visits,ym:s:users&dimensions=ym:s:date&date1=7daysAgo&date2=yesterday&limit=7" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('Date         Visits  Users')
for row in d.get('data', []):
    date = row['dimensions'][0]['name']
    visits = row['metrics'][0]
    users = row['metrics'][1]
    bar = '█' * int(visits / max(1, max(r['metrics'][0] for r in d['data']) / 30))
    print(f'{date}  {visits:>6}  {users:>5}  {bar}')
"
```

## Traffic Sources

```bash
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/stat/v1/data?ids=$YANDEX_METRIKA_COUNTER_ID&metrics=ym:s:visits&dimensions=ym:s:trafficSource&date1=7daysAgo&date2=yesterday&limit=10&sort=-ym:s:visits" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for row in d.get('data', []):
    source = row['dimensions'][0]['name']
    visits = row['metrics'][0]
    print(f'{source:30s} {visits}')
"
```

## Popular Pages

```bash
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/stat/v1/data?ids=$YANDEX_METRIKA_COUNTER_ID&metrics=ym:s:pageviews&dimensions=ym:pv:URL&date1=7daysAgo&date2=yesterday&limit=10&sort=-ym:s:pageviews" | python3 -c "
import sys, json, urllib.parse
d = json.load(sys.stdin)
print('Top pages (last 7 days):')
for row in d.get('data', []):
    url = urllib.parse.unquote(row['dimensions'][0]['name'])
    pv = row['metrics'][0]
    print(f'{pv:>5}  {url}')
"
```

## Search Queries

```bash
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/stat/v1/data?ids=$YANDEX_METRIKA_COUNTER_ID&metrics=ym:s:visits&dimensions=ym:s:searchPhrase&date1=30daysAgo&date2=yesterday&limit=10&sort=-ym:s:visits&filters=ym:s:searchPhrase!=''" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for row in d.get('data', []):
    query = row['dimensions'][0]['name']
    visits = row['metrics'][0]
    print(f'{visits:>5}  {query}')
"
```

## Device Breakdown

```bash
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/stat/v1/data?ids=$YANDEX_METRIKA_COUNTER_ID&metrics=ym:s:visits&dimensions=ym:s:deviceCategory&date1=7daysAgo&date2=yesterday" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for row in d.get('data', []):
    device = row['dimensions'][0]['name']
    visits = row['metrics'][0]
    print(f'{device:15s} {visits}')
"
```

## Geo Report

```bash
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/stat/v1/data?ids=$YANDEX_METRIKA_COUNTER_ID&metrics=ym:s:visits&dimensions=ym:s:regionCity&date1=7daysAgo&date2=yesterday&limit=10&sort=-ym:s:visits" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for row in d.get('data', []):
    city = row['dimensions'][0]['name']
    visits = row['metrics'][0]
    print(f'{city:25s} {visits}')
"
```

## Goals / Conversions

```bash
# List goals
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/management/v1/counter/$YANDEX_METRIKA_COUNTER_ID/goals" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for g in d.get('goals', []):
    print(f'Goal {g[\"id\"]}: {g[\"name\"]} ({g[\"type\"]})')
"

# Goal completions over 7 days
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/stat/v1/data?ids=$YANDEX_METRIKA_COUNTER_ID&metrics=ym:s:goal12345678visits&dimensions=ym:s:date&date1=7daysAgo&date2=yesterday&limit=7" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for row in d.get('data', []):
    date = row['dimensions'][0]['name']
    conv = row['metrics'][0]
    print(f'{date}  conversions: {conv}')
"
```

## Daily Dashboard

```bash
echo "=== Yandex Metrika Dashboard ==="
echo ""

# Site name
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/management/v1/counter/$YANDEX_METRIKA_COUNTER_ID" | python3 -c "
import sys, json
print(json.load(sys.stdin)['counter']['site'])
" 2>/dev/null

echo ""

# Today
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/stat/v1/data?ids=$YANDEX_METRIKA_COUNTER_ID&metrics=ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate&date1=today&date2=today" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('data'):
    data = d['data'][0]
    print(f'📊 Today: {data[\"metrics\"][0]} visits, {data[\"metrics\"][1]} users, {data[\"metrics\"][2]} pageviews')
    print(f'   Bounce: {data[\"metrics\"][3]:.1f}%')
" 2>/dev/null

echo ""

# Yesterday comparison
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/stat/v1/data?ids=$YANDEX_METRIKA_COUNTER_ID&metrics=ym:s:visits&date1=yesterday&date2=yesterday" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('data'):
    yesterday = d['data'][0]['metrics'][0]
    print(f'📅 Yesterday: {yesterday} visits')
" 2>/dev/null

echo ""

# Top sources
curl -s -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
  "https://api-metrika.yandex.net/stat/v1/data?ids=$YANDEX_METRIKA_COUNTER_ID&metrics=ym:s:visits&dimensions=ym:s:trafficSource&date1=7daysAgo&date2=yesterday&limit=5&sort=-ym:s:visits" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('Top sources (7 days):')
for row in d.get('data', []):
    source = row['dimensions'][0]['name']
    visits = row['metrics'][0]
    print(f'  {visits:>5}  {source}')
" 2>/dev/null
```

## Common Metrics

| Metric | Description |
|---|---|
| `ym:s:visits` | Total visits |
| `ym:s:users` | Unique visitors |
| `ym:s:pageviews` | Page views |
| `ym:s:bounceRate` | Bounce rate (%) |
| `ym:s:avgVisitDurationSeconds` | Average session time |
| `ym:s:pageDepth` | Pages per visit |
| `ym:s:goal<id>visits` | Goal conversions |
| `ym:s:searchPhrase` | Search queries |
| `ym:s:trafficSource` | Traffic source name |
| `ym:s:deviceCategory` | Desktop/mobile/tablet |
| `ym:s:regionCity` | Visitor city |

## Common Dimensions

| Dimension | Description |
|---|---|
| `ym:s:date` | Date |
| `ym:s:trafficSource` | Source (organic, direct, referral...) |
| `ym:pv:URL` | Page URL |
| `ym:s:deviceCategory` | Device type |
| `ym:s:regionCity` | City |
| `ym:s:searchPhrase` | Search query |
| `ym:s:searchEngine` | Search engine name |

## Important Notes

- **Auth:** `Authorization: OAuth <token>` header
- **Scope:** `metrika` for OAuth token
- **Counter ID:** found in Metrika UI → Settings → Counter code (number)
- **Date formats:** `today`, `yesterday`, `7daysAgo`, `2026-05-01`, `2026-04-24`
- **Rate limits:** ~100 requests/hour for stat API
- **Data delay:** ~10-20 minutes for real-time data
- **Metrics/dimensions:** colon-separated with `ym:s:` prefix
- **Sort:** add `&sort=-ym:s:visits` for descending
- **Filters:** `&filters=ym:s:trafficSource=='organic'` for segmenting
- **API v1:** management API, **stat v1:** statistics API (both at api-metrika.yandex.net)
