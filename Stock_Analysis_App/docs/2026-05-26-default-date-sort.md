# 2026-05-26 — Trades & Analysis: Default Sort by Date (Latest First)

## What Changed

Both `TradeTable` and `AnalysisTable` now open with date sorted descending (newest on top)
instead of the server's natural order.

### Files modified

| File | Change |
|---|---|
| `frontend/src/components/trades/TradeTable.jsx` | `useState(null)` → `useState('date')` for `sortKey` |
| `frontend/src/components/analysis/AnalysisTable.jsx` | `useState(null)` → `useState('date')` for `sortKey` |

The sort logic itself was already in place from 2026-05-25. Only the initial state value
changed.

Users can still click any other sortable column header to override the default, and the
"Reset sort" link returns to date-descending.

## No Backend Changes

Sorting is entirely client-side (`useMemo` over the fetched array).

## Why

The most common workflow is reviewing recent activity — users want to see today's trade or
analysis at the top, not scroll to the bottom. Date-descending is the standard default for
any log or journal view.
