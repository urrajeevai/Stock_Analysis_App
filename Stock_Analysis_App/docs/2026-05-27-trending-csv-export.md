# Trending Stocks Report — CSV Export

**Date:** 2026-05-27

## What changed

### Backend — `momentum-service`

**`MomentumController.java`**

Added `GET /momentum/trending/export` endpoint:

- Accepts the same query params as `/trending`: `lastNDays`, `minScore`, `dateFrom`, `dateTo`
- Calls the existing `momentumService.getTrendingStocks()` — no new service method needed
- Builds CSV in `buildTrendingCsv()`: dynamic `Day N (YYYY-MM-DD)` columns derived from the
  first result row; each data row is `#, Symbol, Stock Name, Sector, day scores…, Change`
- Proper CSV escaping via `csvEscape()`: values containing commas, quotes, or newlines are
  double-quoted with internal quotes doubled
- Returns `text/csv;charset=UTF-8` with `Content-Disposition: attachment; filename="trending_stocks_YYYY-MM-DD.csv"`
- CRLF line endings for maximum spreadsheet compatibility

### Frontend — React

**`frontend/src/services/momentum.js`**

Added `exportTrendingCsv(params)` function:
```js
export function exportTrendingCsv(params) {
  return api.get('/momentum/trending/export', { params, responseType: 'blob' })
}
```
Available for programmatic use; the UI button uses client-side generation instead
(see below).

**`frontend/src/pages/MomentumPage.jsx`**

- Added `ArrowDownTrayIcon` to heroicons imports
- Added `exportTrendingToCsv(rows, minScore, filterMode, effectiveNDays, dateFrom, dateTo)`
  module-level helper function:
  - Builds CSV from the passed `rows` array (which is `displayResults` — the currently
    sorted view, not the raw API response)
  - Dynamic Day N columns from `rows[0].dailyScores`
  - Stock Name and Sector are quoted if they contain a comma
  - Filename encodes applied filters:
    `trending_stocks_minScore60_last3d_2026-05-27.csv`
    `trending_stocks_minScore60_2026-05-01_to_2026-05-27_2026-05-27.csv`
  - Uses `URL.createObjectURL` / anchor click pattern; cleans up URL and DOM node after click
- In `TrendingTab` results card header: replaced the single "Reset sort" button with a
  `flex items-center gap-2` container holding both "Reset sort" and a new
  **"Download CSV"** `Button` (secondary, sm, `ArrowDownTrayIcon`)
  - Button is only rendered when `results.length > 0`
  - Passes `displayResults` so the exported row order exactly matches what the user sees
    (including any active column sort)

## Why

The Trending Stocks report is the primary action view on the Momentum Dashboard. Users
identify candidate stocks for trades from this table and need to share the findings with
others (traders, analysts) or keep a record for future reference. A CSV export is the
standard way to do this — it opens in Excel/Google Sheets without any conversion step.

The export is done **client-side from `displayResults`** rather than making a second API
call because:
1. All data is already loaded (the trending endpoint is not paginated)
2. The client-side sort is not reproducible server-side without sending sort params
3. Instant download with no network latency

The backend endpoint is still added as a clean API surface for external consumers
(automation, scripting, scheduled reports) that need authenticated programmatic access.

## Files changed

**Backend**
- `momentum-service/src/main/java/com/stockapp/momentum/controller/MomentumController.java`
  — `GET /momentum/trending/export`, `buildTrendingCsv()`, `csvEscape()`; added `HttpHeaders` import

**Frontend**
- `frontend/src/services/momentum.js` — `exportTrendingCsv()` added
- `frontend/src/pages/MomentumPage.jsx` — `ArrowDownTrayIcon` import, `exportTrendingToCsv()` helper,
  Download CSV button in TrendingTab results header
