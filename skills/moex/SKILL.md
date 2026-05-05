---
name: moex
description: "Московская Биржа (MOEX) — акции, индексы, облигации, валюты, дивиденды. Бесплатно, без API-ключа."
metadata:
  openclaw:
    emoji: "📈"
    requires: {}
    note: "Free API, no authentication required"
---

# MOEX ISS API Skill

## Overview

The Moscow Exchange Information & Statistical System (ISS) provides free, public access to market data: stocks, bonds, indices, currencies, and more. No API key needed.

**API Base:** `https://iss.moex.com/iss`

All responses are JSON with two sections: `securities` (metadata) and `marketdata` (prices/trading data).

## When to Use

✅ **Use when:**
- Getting stock/bond prices
- Checking MOEX Index (IMOEX) or other indices
- Looking up currency exchange rates (USD/RUB, EUR/RUB, CNY/RUB)
- Finding dividend information
- Searching for securities by ticker or name
- Getting trading volumes or market caps

❌ **Don't use when:**
- Real-time sub-millisecond trading (use MOEX FAST protocol)
- Historical data beyond what ISS provides
- Non-MOEX exchanges (SPB, foreign exchanges)

## Stock Prices

### Get current price for a security

MOEX uses `SECID` (security ID) — typically the ticker.

```bash
curl "https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/<SECID>.json?iss.meta=off&iss.only=marketdata"
```

Common SECIDs:
- `SBER` — Сбербанк
- `SBERP` — Сбербанк прив.
- `GAZP` — Газпром
- `LKOH` — Лукойл
- `ROSN` — Роснефть
- `VTBR` — ВТБ
- `NVTK` — Новатэк
- `GMKN` — Норникель
- `TATN` — Татнефть
- `TATNP` — Татнефть прив.
- `YNDX` — Яндекс
- `OZON` — Ozon
- `PIKK` — ПИК
- `AFLT` — Аэрофлот
- `MTLR` — Мечел

### Parse the response

```bash
curl -s "https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/SBER.json?iss.meta=off&iss.only=marketdata" | python3 -c "
import sys, json
d = json.load(sys.stdin)['marketdata']['data'][0]
cols = json.load(sys.stdin)['marketdata']['columns']
idx = {c: i for i, c in enumerate(cols)}
last = d[idx['LAST']] or d[idx['LCURRENTPRICE']]
change = d[idx['LASTTOPREVPRICE']]
pct = d[idx['WAPTOPREVWAPPRICE']]
vol = d[idx['VALTODAY_RUR']]
print(f'SBER: {last} ₽ ({change:+.1f}%, vol: {vol/1e6:.0f}M ₽)')
" 2>/dev/null
```

### Batch multiple stocks

```bash
STOCKS="SBER,GAZP,LKOH,ROSN,VTBR"
curl "https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=marketdata&securities=$STOCKS" | python3 -c "
import sys, json
d = json.load(sys.stdin)
cols = d['marketdata']['columns']
idx = {c: i for i, c in enumerate(cols)}
for row in d['marketdata']['data']:
    secid = row[idx['SECID']]
    last = row[idx['LAST']] or row[idx.get('LCURRENTPRICE', 0)] or '—'
    pct = row[idx['LASTTOPREVPRICE']]
    vol = row[idx.get('VALTODAY_RUR', 0)] or 0
    print(f'{secid:6s} {str(last):>8s} ₽ ({pct:+.1f}%) vol={vol/1e6:.0f}M ₽')
"
```

### Search for a security

```bash
# By name
curl "https://iss.moex.com/iss/securities.json?q=Сбербанк&iss.meta=off" | python3 -m json.tool

# By ticker
curl "https://iss.moex.com/iss/securities.json?q=SBER&iss.meta=off" | python3 -m json.tool
```

## MOEX Index

```bash
# IMOEX — основной индекс Мосбиржи
curl "https://iss.moex.com/iss/engines/stock/markets/index/boards/SNDX/securities/IMOEX.json?iss.meta=off&iss.only=marketdata"

# Индекс голубых фишек
curl "https://iss.moex.com/iss/engines/stock/markets/index/boards/SNDX/securities/MOEXBC.json?iss.meta=off&iss.only=marketdata"

# RTS Index (USD)
curl "https://iss.moex.com/iss/engines/stock/markets/index/boards/SNDX/securities/RTSI.json?iss.meta=off&iss.only=marketdata"
```

## Currency Exchange Rates

```bash
# USD/RUB
curl "https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities/USD000UTSTOM.json?iss.meta=off&iss.only=marketdata"

# EUR/RUB
curl "https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities/EUR000UTSTOM.json?iss.meta=off&iss.only=marketdata"

# CNY/RUB
curl "https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities/CNY000UTSTOM.json?iss.meta=off&iss.only=marketdata"
```

Parse:
```bash
curl -s "https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities/USD000UTSTOM.json?iss.meta=off&iss.only=marketdata" | python3 -c "
import sys, json
d = json.load(sys.stdin)['marketdata']['data'][0]
cols = json.load(sys.stdin)['marketdata']['columns']
idx = {c: i for i, c in enumerate(cols)}
print(f\"USD/RUB: {d[idx['LAST']] or d[idx.get('LCURRENTPRICE',0)]} ₽\")
" 2>/dev/null
```

## Bonds (ОФЗ + corporate)

```bash
# List all bonds
curl "https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQCB/securities.json?iss.meta=off&iss.only=securities"

# Specific bond (ОФЗ 26238)
curl "https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQCB/securities/SU26238RMFS4.json?iss.meta=off&iss.only=marketdata"
```

## Dividends

```bash
# Get dividend calendar
curl "https://iss.moex.com/iss/securities/<SECID>/dividends.json?iss.meta=off"
```

## Market Overview (quick snapshot)

```bash
echo "=== MOEX Market Overview ==="

# IMOEX
IMOEX=$(curl -s "https://iss.moex.com/iss/engines/stock/markets/index/boards/SNDX/securities/IMOEX.json?iss.meta=off&iss.only=marketdata" | python3 -c "
import sys,json; d=json.load(sys.stdin)
cols=d['marketdata']['columns']; idx={c:i for i,c in enumerate(cols)}
r=d['marketdata']['data'][0]
print(f\"{r[idx['LAST']]} ({r[idx['LASTTOPREVPRICE']]:+.1f}%)\")
" 2>/dev/null)
echo "IMOEX: $IMOEX"

# USD/RUB
USD=$(curl -s "https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities/USD000UTSTOM.json?iss.meta=off&iss.only=marketdata" | python3 -c "
import sys,json; d=json.load(sys.stdin)
cols=d['marketdata']['columns']; idx={c:i for i,c in enumerate(cols)}
r=d['marketdata']['data'][0]
print(f\"{r[idx['LAST']] or r[idx.get('LCURRENTPRICE',0)]} ₽\")
" 2>/dev/null)
echo "USD/RUB: $USD"

# Top stocks
curl -s "https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=marketdata&securities=SBER,GAZP,LKOH,ROSN,VTBR" | python3 -c "
import sys, json
d = json.load(sys.stdin)
cols = d['marketdata']['columns']
idx = {c: i for i, c in enumerate(cols)}
print()
for row in d['marketdata']['data']:
    secid = row[idx['SECID']]
    last = row[idx['LAST']] or row[idx.get('LCURRENTPRICE',0)] or 0
    pct = row[idx['LASTTOPREVPRICE']]
    vol = row[idx.get('VALTODAY_RUR',0)] or 0
    print(f'{secid:6s} {last:>8.2f} ₽ ({pct:+.1f}%) vol={vol/1e6:.0f}M ₽')
"
```

## Typical Workflows

### "What's the market doing today?"
Run the market overview script above.

### "How is SBER doing?"
Get SBER security data, show price, change %, volume.

### "What's the dollar exchange rate?"
Get USD000UTSTOM from currency market.

### "Show me dividend info for GAZP"
Get dividends endpoint for GAZP.

### "Compare top oil stocks"
Batch LKOH, ROSN, TATN, NVTK — show prices and changes.

## Important Notes

- All GET requests, no POST needed
- `?iss.meta=off` removes metadata (smaller response)
- `?iss.only=marketdata` or `?iss.only=securities` gets specific sections
- Board TQBR = main trading board (T+2)
- Board CETS = currency spot market
- Data is delayed ~15 minutes during trading hours
- Trading hours: 10:00–18:45 MSK (stock), 10:00–23:50 MSK (currency)
- API returns arrays of arrays — use column names to index values
