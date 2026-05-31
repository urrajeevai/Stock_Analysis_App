# 2026-05-22 — P/L Analytics Dashboard & Trade P/L Display

## What Changed

Four interrelated features that add profit/loss analytics across the dashboard and trade modules.

---

## Feature 1: Quantity Field on Trades

### Why
P/L calculations require trade size. Without quantity all P/L would be per-unit, which is meaningless for real-money tracking.

### Changes
- `Trade` entity — added `quantity` column (`DECIMAL(15,4)`, nullable; null treated as 1 in all P/L computations for backward compatibility with existing trades)
- `TradeCreateRequest` / `TradeUpdateRequest` DTOs — added optional `quantity` field
- `TradeResponse` — added `quantity`
- `TradeForm.jsx` — added Quantity input field (optional, defaults to blank = 1)

---

## Feature 2: P/L Computation on Every TradeResponse

### Why
Having P/L as a computed field on the response means no client-side arithmetic is needed, charts and tables are simpler, and the performance-service can use it via the internal API.

### Formula
- **Long:** `P/L = (actualExitPrice − entryPrice) × quantity`
- **Short:** `P/L = (entryPrice − actualExitPrice) × quantity`
- **P/L %:** `(P/L ÷ (entryPrice × quantity)) × 100`
- **Holding Days:** `Duration.between(createdAt, closedAt).toDays()`

### Changes
- `TradeResponse` — added `plAmount`, `plPercent`, `holdingDays` (all null for OPEN/CANCELLED trades)
- `TradeService.computePL()`, `computePLPercent()`, `computeHoldingDays()` private helpers
- `TradeTable.jsx` — added P/L column (auto-shown when any row is CLOSED); shows amount + % with green/red colour coding

---

## Feature 3: Dashboard P/L Summary (Feature 1 from spec)

### New endpoint: `GET /trades/pl-summary`
Returns `PLSummaryResponse`:
| Field | Description |
|---|---|
| totalClosedTrades | All-time count of CLOSED trades |
| profitTradeCount | All-time count where P/L > 0 |
| lossTradeCount | All-time count where P/L < 0 |
| openTradeCount | Currently OPEN trades |
| totalProfitAmount | Sum of profitable P/L in last 1 month |
| totalLossAmount | Absolute sum of losing P/L in last 1 month |
| netPL | totalProfitAmount − totalLossAmount (last 1 month) |
| periodStart / periodEnd | Date range for amount fields |

### New endpoint: `GET /trades/pl-detail?months=N&type=PROFIT|LOSS|ALL&ticker=...&direction=...`
Returns `List<TradeResponse>` of CLOSED trades within the last N months matching the filters. Sorted by closedAt desc.

### Dashboard changes (DashboardPage.jsx — major rewrite)
- **P/L Summary row:** 6 MetricsCards:
  - Total Trades (all-time closed)
  - Profit Trades count — **clickable**, expands PLTradeListPanel below
  - Loss Trades count — **clickable**, expands PLTradeListPanel below
  - Total Profit (1 month)
  - Total Loss (1 month)
  - Net P/L (1 month) — green if positive, red if negative

---

## Feature 2: Expandable P/L Trade List (Feature 2 from spec)

### Component: `PLTradeListPanel.jsx`
- Loaded when user clicks Profit or Loss card
- Initial load: last 1 month
- **Load More** button increments months by 1 (re-fetches `/trades/pl-detail?months=N`)
- Filters: Symbol, Direction
- Columns: Symbol, Type, Entry Date, Exit Date, Entry Price, Exit Price, Qty, P/L Amount, P/L %, Holding Days, Status
- Click any row → navigates to Trade Detail
- Close button dismisses panel

---

## Feature 4: Dashboard Charts (Feature 4 from spec)

### Chart 1: Monthly Profit vs Loss (bar chart)
- Component: `MonthlyPLChart.jsx`
- Data: `GET /performance/monthly` (now includes `totalProfitAmount` and `totalLossAmount`)
- Shows last 6 months, grouped bars: green = profit, red = loss
- Tooltip shows individual values + net P/L

### Chart 2: Weekly Net P/L Trend (area chart)
- Component: `WeeklyNetPLChart.jsx`
- Data: `GET /performance/weekly` (now includes `totalPL`)
- Shows last 8 weeks as area chart
- Gradient colour: green if all positive, red if all negative, brand purple if mixed

### Chart 3: Win / Loss Distribution
- Reuses existing `WinLossChart.jsx` (donut chart)
- Already existed on Performance page; now also shown on Dashboard

### Chart 4: Top 5 Profitable / Top 5 Losing Trades
- Component: `TopTradesTable.jsx`
- Data: last 3 months of all trades, sorted by plAmount
- Click row → Trade Detail page

---

## Performance Service Changes

`PeriodPerformanceResponse.java` — 3 new fields: `totalPL`, `totalProfitAmount`, `totalLossAmount`

`PerformanceCalculationService.buildPeriodResponse()` — now sums `plAmount` from each trade (available since TradeResponse now includes it via the internal API).

---

## Files Changed

**Backend (trade-service)**
- `entity/Trade.java` — +quantity
- `dto/TradeCreateRequest.java` — +quantity
- `dto/TradeUpdateRequest.java` — +quantity
- `dto/TradeResponse.java` — +quantity, plAmount, plPercent, holdingDays
- `dto/PLSummaryResponse.java` — new
- `repository/TradeRepository.java` — +findByUserIdAndStatusOrderByClosedAtDesc, +findByUserIdAndStatusAndClosedAtAfterOrderByClosedAtDesc
- `service/TradeService.java` — computePL/computePLPercent/computeHoldingDays helpers; getPLSummary(); getPLDetail()
- `controller/TradeController.java` — GET /trades/pl-summary, GET /trades/pl-detail

**Backend (performance-service)**
- `dto/PeriodPerformanceResponse.java` — +totalPL, totalProfitAmount, totalLossAmount
- `service/PerformanceCalculationService.java` — buildPeriodResponse sums plAmount from trade maps

**Frontend**
- `services/trades.js` — +getPLSummary(), +getPLDetail()
- `components/trades/TradeForm.jsx` — +quantity field
- `components/trades/TradeTable.jsx` — +P/L column (auto-shown for closed trades)
- `components/dashboard/MonthlyPLChart.jsx` — new bar chart
- `components/dashboard/WeeklyNetPLChart.jsx` — new area chart
- `components/dashboard/TopTradesTable.jsx` — new top-5 trade list
- `components/dashboard/PLTradeListPanel.jsx` — new expandable panel with Load More
- `pages/DashboardPage.jsx` — full rewrite with P/L summary row + 4 chart widgets + expandable panels
