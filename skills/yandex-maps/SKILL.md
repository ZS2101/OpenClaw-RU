---
name: yandex-maps
description: "Яндекс Карты — геокодирование, обратное гео, маршруты, матрица расстояний, поиск мест."
metadata:
  openclaw:
    emoji: "🗺️"
    requires:
      env: ["YANDEX_MAPS_API_KEY"]
      note: "Free tier: 1000 requests/day. Get key at developer.tech.yandex.ru (JavaScript API + Geocoder)"
---

# Yandex Maps Skill

## Overview

Yandex Maps provides geocoding, routing, and place search with unmatched accuracy for Russia, CIS, and Eastern Europe. Supports Russian addresses better than Google Maps.

**Geocoder API:** `https://geocode-maps.yandex.ru/1.x`

Auth: `apikey=<key>` query parameter.

## Prerequisites

```bash
export YANDEX_MAPS_API_KEY="your-key"
# Get at: https://developer.tech.yandex.ru/services/maps
# Select "JavaScript API and Geocoder" tariff
```

Free tier: 1,000 requests/day.

## Geocoding (address → coordinates)

```bash
curl "https://geocode-maps.yandex.ru/1.x/?apikey=$YANDEX_MAPS_API_KEY&geocode=Москва,+Красная+площадь&format=json&lang=ru_RU"
```

### Parse result

```bash
curl -s "https://geocode-maps.yandex.ru/1.x/?apikey=$YANDEX_MAPS_API_KEY&geocode=Москва,+Тверская+улица,+7&format=json&lang=ru_RU" | python3 -c "
import sys, json
d = json.load(sys.stdin)
obj = d['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']
pos = obj['Point']['pos']
addr = obj['metaDataProperty']['GeocoderMetaData']['text']
print(f'{addr}')
print(f'Coordinates: {pos}')
" 2>/dev/null
```

Coordinates format: `"longitude latitude"` (space-separated, reversed order!)

## Reverse Geocoding (coordinates → address)

```bash
curl "https://geocode-maps.yandex.ru/1.x/?apikey=$YANDEX_MAPS_API_KEY&geocode=37.620393,55.75396&format=json&lang=ru_RU&sco=latlong"
```

### Parse

```bash
curl -s "https://geocode-maps.yandex.ru/1.x/?apikey=$YANDEX_MAPS_API_KEY&geocode=37.620393,55.75396&format=json&lang=ru_RU&sco=latlong" | python3 -c "
import sys, json
d = json.load(sys.stdin)
obj = d['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']
name = obj['name']
desc = obj['description']
addr = obj['metaDataProperty']['GeocoderMetaData']['text']
print(f'{name}, {desc}')
print(f'{addr}')
" 2>/dev/null
```

## Place Search

```bash
# Search for places by name
curl "https://geocode-maps.yandex.ru/1.x/?apikey=$YANDEX_MAPS_API_KEY&geocode=аптека&format=json&lang=ru_RU&results=5"

# In specific city
curl "https://geocode-maps.yandex.ru/1.x/?apikey=$YANDEX_MAPS_API_KEY&geocode=Москва,+ресторан&format=json&lang=ru_RU&results=10"
```

### Parse search results

```bash
curl -s "https://geocode-maps.yandex.ru/1.x/?apikey=$YANDEX_MAPS_API_KEY&geocode=Москва,+аптека&format=json&lang=ru_RU&results=5" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for item in d['response']['GeoObjectCollection']['featureMember']:
    obj = item['GeoObject']
    name = obj['name']
    desc = obj['description']
    addr = obj['metaDataProperty']['GeocoderMetaData']['text']
    pos = obj['Point']['pos']
    kind = obj['metaDataProperty']['GeocoderMetaData'].get('kind', '')
    print(f'{name} — {desc}')
    print(f'  {addr}')
    print(f'  {pos} ({kind})')
    print()
" 2>/dev/null
```

## Routing (between two points)

```bash
# Driving route: Moscow → SPb
curl "https://geocode-maps.yandex.ru/1.x/?apikey=$YANDEX_MAPS_API_KEY&geocode=Москва&format=json&results=1"
curl "https://geocode-maps.yandex.ru/1.x/?apikey=$YANDEX_MAPS_API_KEY&geocode=Санкт-Петербург&format=json&results=1"
```

Routing requires the Yandex Maps Router API (separate endpoint):
```
https://api.routing.yandex.net/v2/route?apikey=<key>&waypoints=37.62,55.75|30.31,59.93&mode=driving
```

## Distance Between Two Points

```bash
# Simple: get coordinates first, then calculate
get_coords() {
  curl -s "https://geocode-maps.yandex.ru/1.x/?apikey=$YANDEX_MAPS_API_KEY&geocode=$1&format=json&results=1&lang=ru_RU" | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print(d['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']['Point']['pos'])"
}

# Get coords
MSK=$(get_coords "Москва")
SPB=$(get_coords "Санкт-Петербург")
echo "Moscow: $MSK"
echo "SPb: $SPB"

# Calculate (Haversine formula in Python)
python3 -c "
import math
msk = list(map(float, '$MSK'.split()))
spb = list(map(float, '$SPB'.split()))
R = 6371
lat1, lon1 = math.radians(msk[1]), math.radians(msk[0])
lat2, lon2 = math.radians(spb[1]), math.radians(spb[0])
d = math.acos(math.sin(lat1)*math.sin(lat2) + math.cos(lat1)*math.cos(lat2)*math.cos(lon2-lon1)) * R
print(f'Distance: {d:.0f} km')
"
```

## Useful Queries

### "What's at this address?"
```bash
ADDR="Москва, улица Арбат, 10"
curl -s "https://geocode-maps.yandex.ru/1.x/?apikey=$YANDEX_MAPS_API_KEY&geocode=$ADDR&format=json&lang=ru_RU&results=1" | python3 -c "
import sys, json
d = json.load(sys.stdin)
obj = d['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']
pos = obj['Point']['pos'].split()
print(f'“{obj[\"name\"]}” — {obj[\"description\"]}')
print(f'Lat: {pos[1]}, Lon: {pos[0]}')
"
```

### "Where am I?" (reverse geocode coordinates)
```bash
LAT="55.75396"
LON="37.620393"
curl -s "https://geocode-maps.yandex.ru/1.x/?apikey=$YANDEX_MAPS_API_KEY&geocode=$LON,$LAT&format=json&lang=ru_RU&sco=latlong" | python3 -c "
import sys, json
d = json.load(sys.stdin)
obj = d['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']
print(obj['metaDataProperty']['GeocoderMetaData']['text'])
"
```

### "Find nearest metro station"
```bash
LAT="55.75396"
LON="37.620393"
curl -s "https://geocode-maps.yandex.ru/1.x/?apikey=$YANDEX_MAPS_API_KEY&geocode=$LON,$LAT&format=json&lang=ru_RU&sco=latlong&kind=metro&results=1" | python3 -c "
import sys, json
d = json.load(sys.stdin)
obj = d['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']
print(f'Nearest metro: {obj[\"name\"]} — {obj[\"description\"]}')
"
```

## Tones

Common `kind` values for filtering: `house`, `street`, `metro`, `district`, `locality`, `area`, `province`, `country`, `hydro`, `railway`, `airport`, `vegetation`.

## Important Notes

- Coordinates in Yandex API are `"longitude latitude"` (reversed from Google!)
- `geocode` parameter accepts: address, place name, or coordinates
- `sco=latlong` switches to reverse geocoding mode
- `results=N` limits number of results
- `kind=metro` filters by object type
- `lang=ru_RU` or `lang=en_US` for response language
- Free tier: 1,000 requests/day
- For bulk/routing, use Yandex Maps Router API (separate tariff)
