# Pagination Complete — Record Counts, Alerts, Momentum, RSI

**Date:** 2026-05-26

## What changed

### Pagination.jsx — always show record count

The original component returned `null` entirely when `totalPages <= 1`, so single-page results showed no feedback at all. Updated to:

- Return `null` only when `totalElements === 0`
- Always render "Showing X–Y of N records" for any non-empty result set
- Only render prev/next/page-number navigation when `totalPages > 1`

### Alerts — client-side pagination

Alerts are small real-time data (only open-trade triggers), so server-side pagination is unnecessary overhead. `AlertsPage` now:

- Loads all alerts in one fetch into `allAlerts`
- Slices to 20/page with `useMemo`
- Tracks `alertPage` state, reset to 0 on filter toggle or refresh
- Passes `displayedAlerts`, `alertPagination`, and `onPageChange` to `AlertList`

`AlertList` received new `pagination` and `onPageChange` props and a count header ("N alerts") above the table, plus `<Pagination>` in the card footer.

### MomentumPage ScoresTab — reusable Pagination

The ScoresTab had a custom prev/next footer and showed `scores.length` (current page count, max 20) instead of total results. Fixed:

- Added `totalElements` state, populated from `data.totalElements`
- Changed page size from 50 → 20
- Header now shows `{totalElements} results` (true total)
- Footer replaced with `<Pagination page={page} totalPages={totalPages} totalElements={totalElements} pageSize={20} onPageChange={(p) => load(p)} />`

### RsiPage ScoresTab — reusable Pagination

Same fixes as MomentumPage ScoresTab:

- Added `totalElements` state
- Page size 50 → 20
- Header shows total count from API
- Custom prev/next replaced with `<Pagination>`

## Why

Every list page should show users how many records exist and how far through the data they are. The original "Page X of Y" footer gave no record count, and hiding everything on single-page sets made the UI feel broken when results happened to fit on one page.

## Files changed

- `frontend/src/components/ui/Pagination.jsx` — count always visible
- `frontend/src/pages/AlertsPage.jsx` — client-side pagination
- `frontend/src/components/alerts/AlertList.jsx` — count header + Pagination footer
- `frontend/src/pages/MomentumPage.jsx` — totalElements state, size 20, Pagination footer
- `frontend/src/pages/RsiPage.jsx` — totalElements state, size 20, Pagination footer
