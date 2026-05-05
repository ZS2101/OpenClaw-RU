---
name: bybit
description: "Рыночные данные Bybit — цены, тикеры, стаканы (orderbooks), свечи (klines), ставки финансирования. Все публичные эндпоинты, API-ключ не требуется."
metadata:
  openclaw:
    emoji: "₿"
    requires: {}
    note: "Public market data only — no API key required"
---

# Bybit Market Data Skill

## Overview

All Bybit market data endpoints are **public** — no API key, no auth. Just HTTP GET.

**API Base:** `https://api.bybit.com/v5`

Supports: Spot, Linear (USDT perpetual), Inverse (coin-margined), Options.

## When to Use

✅ **Use when:**
- Getting crypto prices (BTC, ETH, SOL, etc.)
- Checking 24h price change
- Viewing orderbook depth
- Getting kline/candlestick data
- Checking funding rates for perpetuals
- Listing available trading pairs

❌ **Don't use when:**
- Trading (needs API key + HMAC signature)
- Account balance (needs API key)
- Historical trades beyond what klines provide

## Price & Ticker

### Single ticker

```bash
curl "https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT"
```

Response: `lastPrice`, `highPrice24h`, `lowPrice24h`, `volume24h`, `price24hPcnt` (24h change %)

### All spot tickers

```bash
curl "https://api.bybit.com/v5/market/tickers?category=spot"
```

### Linear perpetual (USDT futures)

```bash
curl "https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT"
```

### Inverse contracts

```bash
curl "https://api.bybit.com/v5/market/tickers?category=inverse&symbol=BTCUSD"
```

### Parse with Python

```bash
BTC=$(curl -s "https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d['result']['list'][0]
print(f\"BTC: \${r['lastPrice']} ({float(r['price24hPcnt'])*100:+.2f}%)\")
" 2>/dev/null)
echo "$BTC"

ETH=$(curl -s "https://api.bybit.com/v5/market/tickers?category=spot&symbol=ETHUSDT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d['result']['list'][0]
print(f\"ETH: \${r['lastPrice']} ({float(r['price24hPcnt'])*100:+.2f}%)\")
" 2>/dev/null)
echo "$ETH"

SOL=$(curl -s "https://api.bybit.com/v5/market/tickers?category=spot&symbol=SOLUSDT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d['result']['list'][0]
print(f\"SOL: \${r['lastPrice']} ({float(r['price24hPcnt'])*100:+.2f}%)\")
" 2>/dev/null)
echo "$SOL"
```

## Orderbook

```bash
# Spot orderbook (default: 25 levels)
curl "https://api.bybit.com/v5/market/orderbook?category=spot&symbol=BTCUSDT"

# Deeper (up to 200 levels)
curl "https://api.bybit.com/v5/market/orderbook?category=spot&symbol=BTCUSDT&limit=50"
```

Response: `b` (bids, `[price, size]`), `a` (asks), `ts` (timestamp)

### Parse orderbook

```bash
curl -s "https://api.bybit.com/v5/market/orderbook?category=spot&symbol=BTCUSDT&limit=5" | python3 -c "
import sys, json
d = json.load(sys.stdin)
book = d['result']
print('Asks (sell):')
for price, size in reversed(book['a']):
    print(f'  {float(price):>12.2f}  {float(size):>10.4f}')
print(f'Spread: \${float(book[\"a\"][0][0]) - float(book[\"b\"][0][0]):.2f}')
print('Bids (buy):')
for price, size in book['b']:
    print(f'  {float(price):>12.2f}  {float(size):>10.4f}')
"
```

## Klines (Candlesticks)

```bash
# 1-hour candles, last 10
curl "https://api.bybit.com/v5/market/kline?category=spot&symbol=BTCUSDT&interval=60&limit=10"
```

Intervals (minutes): `1`, `3`, `5`, `15`, `30`, `60`, `120`, `240`, `360`, `720`, `D`, `W`, `M`

Response: each candle is `[timestamp, open, high, low, close, volume, turnover]`

## Funding Rate (Perpetuals)

```bash
curl "https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT"
```

The `fundingRate` field shows the current funding rate (e.g., `0.0001` = 0.01%).

```bash
# Check funding for top coins
for SYM in BTCUSDT ETHUSDT SOLUSDT; do
  RATE=$(curl -s "https://api.bybit.com/v5/market/tickers?category=linear&symbol=$SYM" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d['result']['list'][0]
print(f\"{r['fundingRate']}\")
" 2>/dev/null)
  echo "$SYM funding: $RATE"
done
```

## Market Snapshot

```bash
echo "=== Bybit Market Snapshot ==="
echo ""

# Top crypto prices
for SYM in BTCUSDT ETHUSDT SOLUSDT XRPUSDT DOGEUSDT; do
  DATA=$(curl -s "https://api.bybit.com/v5/market/tickers?category=spot&symbol=$SYM" | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d['result']['list'][0]
pct = float(r.get('price24hPcnt', 0)) * 100
vol = float(r.get('volume24h', 0))
print(f\"{r['lastPrice']}|{pct:+.2f}|{vol:.0f}\")
" 2>/dev/null)
  if [ -n "$DATA" ]; then
    PRICE=$(echo "$DATA" | cut -d'|' -f1)
    PCT=$(echo "$DATA" | cut -d'|' -f2)
    VOL=$(echo "$DATA" | cut -d'|' -f3)
    printf "%-8s \$%-12s %6s%%  vol: %s\n" "$SYM" "$PRICE" "$PCT" "$VOL"
  fi
done

echo ""

# BTC 24h stats
curl -s "https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d['result']['list'][0]
print(f\"BTC/USDT\")
print(f\"  Price:  \${r['lastPrice']}\")
print(f\"  24h Hi: \${r['highPrice24h']}\")
print(f\"  24h Lo: \${r['lowPrice24h']}\")
print(f\"  Change: {float(r['price24hPcnt'])*100:+.2f}%\")
print(f\"  Volume: {float(r['volume24h']):,.0f} USDT\")
"
```

## Common Symbols

| Symbol | Description |
|---|---|
| `BTCUSDT` | Bitcoin / USDT |
| `ETHUSDT` | Ethereum / USDT |
| `SOLUSDT` | Solana / USDT |
| `XRPUSDT` | Ripple / USDT |
| `DOGEUSDT` | Dogecoin / USDT |
| `BNBUSDT` | Binance Coin / USDT |
| `ADAUSDT` | Cardano / USDT |
| `AVAXUSDT` | Avalanche / USDT |
| `LINKUSDT` | Chainlink / USDT |
| `TONUSDT` | Toncoin / USDT |

## Important Notes

- All endpoints use `GET`, no auth required
- Response format: `{retCode: 0, retMsg: "OK", result: {...}}`
- `retCode: 0` means success
- Rate limit: 50 requests/second (market data)
- Spot base URL: `/v5/market/` + category
- Linear = USDT perpetual futures
- Timestamps: Unix milliseconds
- Klines limited to 1000 candles per request
