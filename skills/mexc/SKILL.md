---
name: mexc
description: "MEXC — криптоданные: цены, тикеры, стаканы, свечи. Открытый API, без ключа."
metadata:
  openclaw:
    emoji: "🔶"
    requires: {}
    note: "Public market data only — no API key required"
---

# MEXC Market Data Skill

## Overview

All MEXC market data endpoints are **public** — no API key, no auth.

**API Base:** `https://api.mexc.com/api/v3`

## When to Use

✅ **Use when:**
- Getting crypto prices (BTC, ETH, SOL, meme coins)
- Checking 24h stats
- Viewing orderbook
- Getting klines/candlesticks
- Checking server status

## Price & Ticker

### Current price (single symbol)

```bash
curl "https://api.mexc.com/api/v3/ticker/price?symbol=BTCUSDT"
```

Response: `{"symbol":"BTCUSDT","price":"67890.12"}`

### All prices

```bash
curl "https://api.mexc.com/api/v3/ticker/price"
```

### 24h stats

```bash
curl "https://api.mexc.com/api/v3/ticker/24hr?symbol=BTCUSDT"
```

Response: `priceChange`, `priceChangePercent`, `highPrice`, `lowPrice`, `volume`, `quoteVolume`

### Batch prices with Python

```bash
for SYM in BTCUSDT ETHUSDT SOLUSDT DOGEUSDT PEPEUSDT; do
  curl -s "https://api.mexc.com/api/v3/ticker/24hr?symbol=$SYM" | python3 -c "
import sys, json
d = json.load(sys.stdin)
pct = float(d.get('priceChangePercent', 0))
vol = float(d.get('volume', 0))
print(f\"{d['symbol']:12s} \${d.get('lastPrice', '—'):>12s} ({pct:+.2f}%)  vol: {vol:,.0f}\")
" 2>/dev/null
done
```

## Orderbook

```bash
# Default: 100 levels
curl "https://api.mexc.com/api/v3/depth?symbol=BTCUSDT"

# Shallow (5 levels)
curl "https://api.mexc.com/api/v3/depth?symbol=BTCUSDT&limit=5"
```

Response: `lastUpdateId`, `bids` (array of `[price, qty]`), `asks`

### Parse orderbook

```bash
curl -s "https://api.mexc.com/api/v3/depth?symbol=BTCUSDT&limit=5" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('Asks (sell):')
for price, qty in reversed(d['asks'][:5]):
    print(f'  {float(price):>12.2f}  {float(qty):>10.4f}')
print(f'Spread: \${float(d[\"asks\"][0][0]) - float(d[\"bids\"][0][0]):.2f}')
print('Bids (buy):')
for price, qty in d['bids'][:5]:
    print(f'  {float(price):>12.2f}  {float(qty):>10.4f}')
"
```

## Klines (Candlesticks)

```bash
# 1-hour candles, last 10
curl "https://api.mexc.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=10"
```

Intervals: `1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1d`, `1w`, `1M`

Response: `[openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, ...]`

## Exchange Info

```bash
# All trading pairs
curl "https://api.mexc.com/api/v3/exchangeInfo"

# Search for specific symbol
curl "https://api.mexc.com/api/v3/exchangeInfo?symbol=BTCUSDT"
```

## Server Status

```bash
curl "https://api.mexc.com/api/v3/ping"
# → {}
curl "https://api.mexc.com/api/v3/time"
# → {"serverTime": 1715000000000}
```

## Market Snapshot

```bash
echo "=== MEXC Market Snapshot ==="
echo ""

echo "--- Top Crypto ---"
for SYM in BTCUSDT ETHUSDT SOLUSDT XRPUSDT DOGEUSDT; do
  curl -s "https://api.mexc.com/api/v3/ticker/24hr?symbol=$SYM" | python3 -c "
import sys, json
d = json.load(sys.stdin)
pct = float(d.get('priceChangePercent', 0))
printf(f'{d[\"symbol\"]:12s}  \${d.get(\"lastPrice\",0):>12s}  {pct:+.2f}%\')
" 2>/dev/null
done

echo ""
echo "--- Meme Coins ---"
for SYM in PEPEUSDT BONKUSDT WIFUSDT FLOKIUSDT; do
  curl -s "https://api.mexc.com/api/v3/ticker/price?symbol=$SYM" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'{d[\"symbol\"]:12s}  \${d[\"price\"]}')
" 2>/dev/null
done

echo ""
echo "--- BTC Detail ---"
curl -s "https://api.mexc.com/api/v3/ticker/24hr?symbol=BTCUSDT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'BTC/USDT')
print(f'  Price:  \${d[\"lastPrice\"]}')
print(f'  High:   \${d[\"highPrice\"]}')
print(f'  Low:    \${d[\"lowPrice\"]}')
print(f'  Change: {float(d[\"priceChangePercent\"]):+.2f}%')
print(f'  Volume: {float(d[\"volume\"]):,.0f} BTC')
"
```

## MEXC-Specific Notes

- MEXC lists **2,900+ trading pairs** — more than Binance or Bybit
- Strong in **meme coins** (PEPE, BONK, WIF, FLOKI) and low-cap gems
- Ruble P2P trading and RUB card deposits available
- `api.mexc.com` is the global endpoint
- No WebSocket in this skill — only REST
- All timestamps in milliseconds
