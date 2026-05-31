# Pagination — 2026-05-26

## Problem

The Analysis page and Trades page each showed a maximum of 20 records with no way to navigate to additional pages. Both backends returned a Spring Data `Page<T>` object, but the frontend hooks discarded all pagination metadata (totalPages, totalElements, current page) and only extracted the `content` array. There were no pagination controls anywhere in the UI.

Additionally, the default backend sort was ASC (oldest first), so the 20 visible records were the oldest entries rather than the most recent.

## What Changed

### Backend

**`analysis-service/AnalysisApplication.java`**
- Added `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)` for consistent Spring Data `Page<>` JSON serialization (matches momentum-service and rsi-service).

**`analysis-service/AnalysisController.java`**
- Added `direction = Sort.Direction.DESC` to `@PageableDefault` so the default sort is newest analysis date first.

**`trade-service/TradeApplication.java`**
- Added `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)` — same reason.

**`trade-service/TradeController.java`**
- Added `direction = Sort.Direction.DESC` to `@PageableDefault` so the default sort is newest trade first.

No new backend endpoints or queries were needed — the existing `Page<>` responses already contain `totalPages`, `totalElements`, `number`, and `size`.

### Frontend — Shared component

**`frontend/src/components/ui/Pagination.jsx`** (new)
- Reusable pagination component: shows "Showing X–Y of N" record count, prev/next buttons, and numbered page buttons with ellipsis for large page counts.
- Returns `null` when `totalPages <= 1` so it self-hides when not needed.
- Accepts: `page`, `totalPages`, `totalElements`, `pageSize`, `onPageChange`.
- Used by AnalysisTable, TradeTable, and StocksPage.

### Frontend — Hooks

**`frontend/src/hooks/useAnalysis.js`**
- Now accepts `params` (includes `page`, `size`, filters) instead of just `filters`.
- Returns `pagination: { page, totalPages, totalElements, pageSize }` alongside `analyses`.
- All mutation methods (createAnalysis, updateAnalysis, etc.) still refetch the current page after the mutation.

**`frontend/src/hooks/useTrades.js`**
- Same changes as `useAnalysis.js`.

### Frontend — Pages

**`frontend/src/pages/AnalysisPage.jsx`**
- Manages `page` (0-indexed) state locally.
- Passes `{ ...filters, page, size: 20 }` to `useAnalysis`.
- `handleFilterChange` resets `page` to 0 when filters change.
- Passes `pagination` and `onPageChange` down to `AnalysisTable`.

**`frontend/src/pages/TradesPage.jsx`**
- Same pattern as `AnalysisPage`.

### Frontend — Tables

**`frontend/src/components/analysis/AnalysisTable.jsx`**
- Accepts new `pagination` and `onPageChange` props.
- Renders `<Pagination>` at the bottom of the card when both are provided.
- Client-side sort (R/R, Outcome, Date) continues to sort within the current page.

**`frontend/src/components/trades/TradeTable.jsx`**
- Same changes as `AnalysisTable`.

**`frontend/src/pages/StocksPage.jsx`**
- Added client-side pagination (no backend change needed — stocks master data is small and loaded in full).
- `stockPage` state (0-indexed), reset to 0 when search or `activeOnly` changes.
- `displayedStocks = filtered.slice(page * 20, (page+1) * 20)` via `useMemo`.
- `<Pagination>` rendered at the bottom of the stocks table.

## Why These Choices

- **Server-side pagination for Trades and Analysis**: These tables can grow unboundedly. Only fetching one page at a time keeps the initial load fast.
- **Client-side pagination for Stocks**: Stocks are master data, typically <100 items. Server-side pagination would complicate inline CRUD (add/edit/delete) without meaningful benefit.
- **Reusable Pagination component**: Eliminates the ad-hoc prev/next buttons that existed in MomentumPage and RsiPage (those continue to use their inline controls, which are sufficient since they already had pagination).
- **Sort reset on filter change**: When the user applies a new filter, resetting to page 0 ensures they always see the most relevant first page of results.
- **Within-page client-side sort**: The date/status/P/L sort icons in TradeTable and AnalysisTable sort only within the visible page. This is acceptable because the backend default sort (newest first) already ensures the most recent records appear on page 1.
