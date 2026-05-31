# 2026-05-23 — Trending Report: Sortable Day & Change Columns

## What Changed

### Frontend only (`frontend/src/pages/MomentumPage.jsx`)

Added client-side column sorting to the Trending Report results table.

**Sortable columns**: Day 1, Day 2, … Day N (any number of day columns), and Change.
Non-score columns (#, Symbol, Stock Name, Sector) remain unsortable.

**Behaviour**:
- Click a sortable column header → sorts descending (highest first) by default.
- Click the same header again → toggles to ascending.
- Click a different header → switches sort column, resets to descending.
- Running a new "Find Trending Stocks" search → resets sort back to the default
  backend order (latest score descending).
- A "Reset sort" link appears in the card header whenever an active sort is applied;
  clicking it returns to the original order without re-fetching.
- Active sort key and direction shown inline in the sub-heading:
  *"sorted by Day 2 (↓ desc)"*

**Implementation**:
- `sortKey` state: `null | 'change' | 'day-0' | 'day-1' | …`
- `sortDir` state: `'asc' | 'desc'`
- `displayResults` derived with `useMemo` — pure in-memory sort, zero extra API calls.
- `SortTh` helper component renders the `<th>` with cursor-pointer, active colour,
  and the correct `SortIcon` (ChevronUpDownIcon when inactive, ChevronUpIcon /
  ChevronDownIcon when active).
- Added `useMemo`, `ChevronDownIcon`, `ChevronUpDownIcon` to imports.

## Why

Users need to quickly rank trending stocks by a specific day's score or by total score
change (e.g. "which stocks had the highest Day 1 score?" or "which gained the most?").
The data is already fetched and in memory, so client-side sorting gives instant response
with no backend work needed.

## No backend changes

The `/momentum/trending` API is unchanged. Sorting is entirely in the browser.
