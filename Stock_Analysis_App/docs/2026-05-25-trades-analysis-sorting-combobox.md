# 2026-05-25 — Trades & Analysis: Column Sorting + Searchable Stock Combobox on New Trade

## What Changed

### 1. Searchable stock combobox in `TradeForm.jsx`

Replaced the static `<Select>` stock dropdown in `TradeForm` with the existing
`StockSearchCombobox` component (already used in `AnalysisForm`).

**Removed**
- `listStocks` import
- `stocks` state + its `useEffect` (no more full list fetch on mount)
- Old `handleStockSelect(e)` that read `e.target.value`

**Added**
- `StockSearchCombobox` import (reused from `components/analysis/`)
- New `handleStockSelect(sel)` matching the combobox's `onChange` signature:
  ```js
  const handleStockSelect = (sel) => {
    if (sel) {
      setValue('stockId', sel.stockId)
      setValue('ticker', sel.symbol)
    } else {
      setValue('stockId', '')
    }
  }
  ```
- `canCreate` prop (default `true`) forwarded to `StockSearchCombobox`
- `TradeDetailPage` now passes `canCreate={canEdit}` to `TradeForm` in edit mode

**Features inherited from `StockSearchCombobox`**
- Debounced search (300 ms) after ≥ 2 characters typed
- Paste support — native via `<input type="text">` onChange
- Keyboard navigation (↑ ↓ Enter Escape)
- "Create new stock" inline form when no match found (ADMIN/TRADER only)
- Auto-fills Ticker Symbol field on selection

No backend changes — `GET /stocks/search?q=` and `POST /stocks` already existed.

---

### 2. Sortable columns in `TradeTable.jsx`

Added client-side sorting on three columns in the Trades list. Clicking a column header
toggles between descending and ascending; clicking again reverses direction. A "Reset sort"
link appears in the filter bar when any sort is active.

| Column | Sort key | Sort value |
|---|---|---|
| **P/L** | `pl` | `trade.plAmount` (nulls pushed to bottom) |
| **Status** | `status` | Custom order: OPEN → CLOSED → CANCELLED |
| **Date** | `date` | `trade.createdAt` parsed as timestamp |

**Implementation**
- `sortKey` and `sortDir` state, `handleSort(key)` — same key toggles direction
- `displayTrades = useMemo(...)` — in-memory sort, no re-fetch
- `SortTh` helper component (clickable `<th>` with `SortIcon`)
- `SortIcon` shows `ChevronUpDownIcon` (inactive), `ChevronUpIcon`/`ChevronDownIcon` (active)
- P/L column sort header only rendered when `showPLCol` is true (i.e. at least one closed trade)

---

### 3. Sortable columns in `AnalysisTable.jsx`

Same pattern as TradeTable applied to the Analysis list.

| Column | Sort key | Sort value |
|---|---|---|
| **R/R** | `rr` | `analysis.rrRatio` as float (nulls pushed to bottom) |
| **Outcome** | `outcome` | Custom order: PENDING → CORRECT → FAILED |
| **Date** | `date` | `analysis.analysisDate ?? analysis.createdAt` |

---

## No Backend Changes

All sorting is client-side (`useMemo` over the already-fetched array). No new API endpoints.

## Why

The trades list often has dozens of entries. Users need to quickly surface their best/worst
performing trades (P/L sort), find all open positions (Status sort), and review the most
recent activity (Date sort). The same need applies to analyses — quickly spotting high-R/R
setups and filtering by outcome are frequent workflows. The stock dropdown on the New Trade
form had the same UX problem as the analysis form: 100+ stocks with no search, and no
escape hatch for unlisted stocks.
