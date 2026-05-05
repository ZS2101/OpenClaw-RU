---
name: yandex-market
description: "Яндекс Маркет — инструменты продавца: заказы, цены, остатки, отгрузки. OAuth-токен."
metadata:
  openclaw:
    emoji: "🛍️"
    requires:
      env: ["YANDEX_MARKET_TOKEN", "YANDEX_MARKET_CAMPAIGN_ID"]
      note: "Get OAuth token at oauth.yandex.ru with market:partner scope. Endpoints verified: 401 → active."
---

# Yandex Market Seller Skill

## Verified Endpoints

```
api.partner.market.yandex.ru → 401 (auth required) ✅
```

All standard REST JSON. Auth: `Authorization: OAuth <token>`.

## Prerequisites

```bash
export YANDEX_MARKET_TOKEN="y0_AgAAAA..."
export YANDEX_MARKET_CAMPAIGN_ID="12345678"
# Token from: oauth.yandex.ru (scope: market:partner)
# Campaign ID from: https://partner.market.yandex.ru → Settings
```

## Orders

### List new orders

```bash
curl -s -H "Authorization: OAuth $YANDEX_MARKET_TOKEN" \
  "https://api.partner.market.yandex.ru/v2/campaigns/$YANDEX_MARKET_CAMPAIGN_ID/orders?status=PROCESSING&limit=20" | python3 -c "
import sys, json
d = json.load(sys.stdin)
orders = d.get('orders', [])
print(f'Processing orders: {len(orders)}')
for o in orders[:5]:
    items = ', '.join(i['offerName'] for i in o.get('items', []))
    print(f'  #{o[\"id\"]}  {o[\"creationDate\"][:10]}  {o[\"buyer\"].get(\"lastName\",\"\")}  {items}')
    print(f'    Status: {o[\"status\"]}  Subsidy: {o.get(\"subsidy\",0)} ₽')
" 2>/dev/null
```

Statuses: `PROCESSING`, `DELIVERY`, `DELIVERED`, `CANCELLED`, `PICKUP`

### Order detail

```bash
ORDER_ID="12345678"
curl -s -H "Authorization: OAuth $YANDEX_MARKET_TOKEN" \
  "https://api.partner.market.yandex.ru/v2/campaigns/$YANDEX_MARKET_CAMPAIGN_ID/orders/$ORDER_ID" | python3 -m json.tool
```

### Update order status

```bash
ORDER_ID="12345678"
curl -X PUT -H "Authorization: OAuth $YANDEX_MARKET_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.partner.market.yandex.ru/v2/campaigns/$YANDEX_MARKET_CAMPAIGN_ID/orders/$ORDER_ID/status" \
  -d '{"order": {"status": "PROCESSING", "substatus": "READY_TO_SHIP"}}'
```

Substatuses: `STARTED`, `READY_TO_SHIP`, `SHIPPED`

## Prices

### Get current prices

```bash
curl -s -H "Authorization: OAuth $YANDEX_MARKET_TOKEN" \
  "https://api.partner.market.yandex.ru/v2/campaigns/$YANDEX_MARKET_CAMPAIGN_ID/offer-prices?limit=10" | python3 -c "
import sys, json
d = json.load(sys.stdin)
offers = d.get('offers', [])
for o in offers[:10]:
    price = o['price']['value']
    discount = o['price'].get('discountBase', price)
    print(f'{o[\"id\"]:30s} {price:>8.0f} ₽ (was: {discount:.0f})')
"
```

### Update prices

```bash
curl -X POST -H "Authorization: OAuth $YANDEX_MARKET_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.partner.market.yandex.ru/v2/campaigns/$YANDEX_MARKET_CAMPAIGN_ID/offer-prices/updates" \
  -d '{"offers": [{"id": "SKU-123", "price": {"value": 999, "currencyId": "RUR"}}]}'
```

## Stocks

### Get stock levels

```bash
curl -s -H "Authorization: OAuth $YANDEX_MARKET_TOKEN" \
  "https://api.partner.market.yandex.ru/v2/campaigns/$YANDEX_MARKET_CAMPAIGN_ID/stats/skus" | python3 -c "
import sys, json
d = json.load(sys.stdin)
shop_skus = d.get('shopSkus', [])
for s in shop_skus[:10]:
    print(f'{s[\"shopSku\"]:30s} stock: {s[\"warehouses\"][0][\"stocks\"][0][\"count\"] if s.get(\"warehouses\") else \"N/A\"}')
"
```

## Shipments (FBY/FBS)

### List shipments

```bash
curl -s -H "Authorization: OAuth $YANDEX_MARKET_TOKEN" \
  "https://api.partner.market.yandex.ru/v2/campaigns/$YANDEX_MARKET_CAMPAIGN_ID/shipments?limit=10" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for s in d.get('shipments', []):
    print(f'Shipment #{s[\"id\"]}  {s[\"status\"]}  {s.get(\"shipmentDate\",\"?\")[:10]}')
    print(f'  Orders: {len(s.get(\"orders\",[]))}')
"
```

## Campaign Info

```bash
curl -s -H "Authorization: OAuth $YANDEX_MARKET_TOKEN" \
  "https://api.partner.market.yandex.ru/v2/campaigns/$YANDEX_MARKET_CAMPAIGN_ID" | python3 -c "
import sys, json
d = json.load(sys.stdin)
c = d.get('campaign', {})
print(f'Campaign: {c.get(\"domain\",\"\")}')
print(f'Type: {c.get(\"business\",{}).get(\"name\",\"\")}')
print(f'Shop: {c.get(\"tradingBehavior\",\"\")}')
"
```

## Commission Report

```bash
# Get last month
curl -s -H "Authorization: OAuth $YANDEX_MARKET_TOKEN" \
  "https://api.partner.market.yandex.ru/v2/campaigns/$YANDEX_MARKET_CAMPAIGN_ID/orders/stats/commissions-report" | python3 -c "
import sys, json
d = json.load(sys.stdin)
report = d.get('result', {})
print(f'Total orders: {report.get(\"totalOrders\",0)}')
print(f'Commission: {report.get(\"totalCommission\",0):.2f} ₽')
print(f'Delivery: {report.get(\"totalDelivery\",0):.2f} ₽')
"
```

## Daily Seller Summary

```bash
echo "=== Yandex Market — Daily Summary ==="
echo ""

# Campaign info
curl -s -H "Authorization: OAuth $YANDEX_MARKET_TOKEN" \
  "https://api.partner.market.yandex.ru/v2/campaigns/$YANDEX_MARKET_CAMPAIGN_ID" | python3 -c "
import sys, json
c = json.load(sys.stdin).get('campaign', {})
print(f'Shop: {c.get(\"domain\",\"\")}')
" 2>/dev/null

# Processing orders count
ORDERS=$(curl -s -H "Authorization: OAuth $YANDEX_MARKET_TOKEN" \
  "https://api.partner.market.yandex.ru/v2/campaigns/$YANDEX_MARKET_CAMPAIGN_ID/orders?status=PROCESSING&limit=100" | python3 -c "
import sys, json
d = json.load(sys.stdin)
orders = d.get('orders', [])
print(f'Orders processing: {len(orders)}')
total = sum(o.get('itemsTotal', 0) or sum(i.get('price', 0) for i in o.get('items', [])) for o in orders)
print(f'Total value: {total:,.0f} ₽')
" 2>/dev/null)
echo "$ORDERS"

# Stock alerts (low stock)
curl -s -H "Authorization: OAuth $YANDEX_MARKET_TOKEN" \
  "https://api.partner.market.yandex.ru/v2/campaigns/$YANDEX_MARKET_CAMPAIGN_ID/stats/skus" | python3 -c "
import sys, json
d = json.load(sys.stdin)
low = []
for s in d.get('shopSkus', []):
    stock = s.get('warehouses', [{}])[0].get('stocks', [{}])[0].get('count', 0) if s.get('warehouses') else 0
    if 0 < stock < 5:
        low.append(f'{s[\"shopSku\"]} — only {stock} left')
if low:
    print(f'⚠️ Low stock ({len(low)}):')
    for l in low: print(f'  {l}')
else:
    print('✅ All stock OK')
" 2>/dev/null
```

## Important Notes

- **Auth:** `Authorization: OAuth <token>` header
- **Campaign ID:** found in Partner UI → Settings → Campaign number
- **Scope:** `market:partner` for OAuth token
- **Rate limits:** ~1000 requests/hour
- **Prices update:** POST to `/offer-prices/updates`, async (check status with returned URL)
- **Order statuses:** PROCESSING → DELIVERY → DELIVERED (or CANCELLED)
- **Subsidies:** Market often subsidizes delivery — visible in order data
- **FBY vs FBS:** different fulfillment models, same API
- **All prices in RUR (rubles)**
