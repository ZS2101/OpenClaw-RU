---
name: yandex-weather
description: "Яндекс Погода — текущие условия, прогноз, почасовые данные. Бесплатный тариф."
metadata:
  openclaw:
    emoji: "🌤️"
    requires:
      env: ["YANDEX_WEATHER_API_KEY"]
      note: "Free tier: 50 requests/day. Get key at developer.tech.yandex.ru"
---

# Yandex Weather Skill

## Overview

Yandex Weather provides hyperlocal forecasts with minute-level precision for Russia and worldwide.

**API Base:** `https://api.weather.yandex.ru/v2`

Auth: `X-Yandex-Weather-Key: <api_key>` header.

## Prerequisites

```bash
export YANDEX_WEATHER_API_KEY="your-key"
# Get at: https://developer.tech.yandex.ru/services/weather
```

Free tier: 50 requests/day. Paid: 5000/day.

## Current Weather

### By coordinates

```bash
curl -H "X-Yandex-Weather-Key: $YANDEX_WEATHER_API_KEY" \
  "https://api.weather.yandex.ru/v2/forecast?lat=55.75396&lon=37.620393"
```

### Common coordinates

| City | lat | lon |
|---|---|---|
| Москва | 55.75396 | 37.620393 |
| Санкт-Петербург | 59.93863 | 30.31413 |
| Новосибирск | 55.0302 | 82.9204 |
| Екатеринбург | 56.8389 | 60.6057 |
| Казань | 55.7961 | 49.1064 |
| Сочи | 43.5855 | 39.7231 |
| Владивосток | 43.1155 | 131.8855 |

### Parse conditions

```bash
curl -s -H "X-Yandex-Weather-Key: $YANDEX_WEATHER_API_KEY" \
  "https://api.weather.yandex.ru/v2/forecast?lat=55.75396&lon=37.620393&lang=ru_RU" | python3 -c "
import sys, json
d = json.load(sys.stdin)
f = d['fact']
print(f'🌡 {f[\"temp\"]}°C (feels like {f[\"feels_like\"]}°C)')
print(f'🌤 {f[\"condition\"]}')
print(f'💨 Wind: {f[\"wind_speed\"]} m/s, {f[\"wind_dir\"]}')
print(f'💧 Humidity: {f[\"humidity\"]}%')
print(f'🔵 Pressure: {f[\"pressure_mm\"]} mm Hg')
"
```

### Condition codes

| Code | Russian | English |
|---|---|---|
| `clear` | Ясно | Clear |
| `partly-cloudy` | Малооблачно | Partly cloudy |
| `cloudy` | Облачно с прояснениями | Cloudy |
| `overcast` | Пасмурно | Overcast |
| `drizzle` | Морось | Drizzle |
| `light-rain` | Небольшой дождь | Light rain |
| `rain` | Дождь | Rain |
| `moderate-rain` | Умеренный дождь | Moderate rain |
| `heavy-rain` | Сильный дождь | Heavy rain |
| `showers` | Ливень | Showers |
| `wet-snow` | Дождь со снегом | Wet snow |
| `light-snow` | Небольшой снег | Light snow |
| `snow` | Снег | Snow |
| `snow-showers` | Снегопад | Snow showers |
| `hail` | Град | Hail |
| `thunderstorm` | Гроза | Thunderstorm |
| `thunderstorm-with-rain` | Гроза с дождём | Thunderstorm with rain |
| `thunderstorm-with-hail` | Гроза с градом | Thunderstorm with hail |

## Forecast

```bash
# 7-day forecast
curl -s -H "X-Yandex-Weather-Key: $YANDEX_WEATHER_API_KEY" \
  "https://api.weather.yandex.ru/v2/forecast?lat=55.75396&lon=37.620393&limit=7&lang=ru_RU" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('=== Прогноз на неделю ===')
for day in d['forecasts']:
    parts = day['parts']['day']
    print(f'{day[\"date\"]}: {parts[\"condition\"]}, {parts[\"temp_min\"]}…{parts[\"temp_max\"]}°C, {parts.get(\"wind_speed\",\"?\")} m/s')
"
```

## Multi-city Snapshot

```bash
echo "=== Погода в России ==="
declare -A CITIES
CITIES=(
  ["Москва"]="55.75396,37.620393"
  ["СПб"]="59.93863,30.31413"
  ["Новосибирск"]="55.0302,82.9204"
  ["Сочи"]="43.5855,39.7231"
  ["Владивосток"]="43.1155,131.8855"
)

for city in "${!CITIES[@]}"; do
  IFS=',' read -r lat lon <<< "${CITIES[$city]}"
  DATA=$(curl -s -H "X-Yandex-Weather-Key: $YANDEX_WEATHER_API_KEY" \
    "https://api.weather.yandex.ru/v2/forecast?lat=$lat&lon=$lon&lang=ru_RU" | python3 -c "
import sys, json
d = json.load(sys.stdin)
f = d['fact']
print(f'{f[\"temp\"]}|{f[\"condition\"]}|{f[\"wind_speed\"]}')
" 2>/dev/null)
  if [ -n "$DATA" ]; then
    IFS='|' read -r temp cond wind <<< "$DATA"
    printf "%-16s %3s°C  %-12s  💨%s m/s\n" "$city" "$temp" "$cond" "$wind"
  fi
done
```

## Important Notes

- Coordinates required (lat + lon), no city name lookup
- Response is in Russian by default (`lang=ru_RU`)
- `fact` = current conditions, `forecasts` = daily forecast
- `temp` = current temp, `feels_like` = wind chill adjusted
- `condition` uses English codes (see table above)
- Free tier: 50 requests/day per API key
- Update frequency: ~10 minutes
