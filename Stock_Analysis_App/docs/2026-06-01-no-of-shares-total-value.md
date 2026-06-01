# 2026-06-01 — No of Shares & Total Value on Trades

## What changed

Added two new fields to the trade entry, list, and detail views:

- **No of Shares** — renamed from the existing `quantity` field; same DB column (`quantity`), same API field name; only the UI label changed.
- **Total Value** — computed as `entryPrice × quantity`; returned by the API in `TradeResponse.totalValue` (new field); also shown as a live preview in the trade form.

## Backend

| File | Change |
|---|---|
| `TradeResponse.java` | Added `BigDecimal totalValue` field after `quantity` |
| `TradeService.java` | Added `computeTotalValue()` helper; wired into `toResponse()` |

`computeTotalValue` returns `entryPrice × quantity` rounded to 2 decimal places, or `null` if either value is absent. No schema migration needed — `totalValue` is a computed field, not stored.

## Frontend

| File | Change |
|---|---|
| `TradeForm.jsx` | Label "Quantity" → "No of Shares"; moved into a 2-column grid with Setup Type; live Total Value preview added as 4th column in the R/R info box; preview shows `—` when entry price or shares are not yet entered |
| `TradeTable.jsx` | Added "Shares" and "Total Val." columns between R/R and P/L; `colCount` variable drives both `colSpan` on empty state and skeleton row count; `SkeletonRow` accepts `cols` prop |
| `TradeDetailPage.jsx` | "No of Shares" and "Total Value" added to the original levels grid; both are conditional (only rendered when `quantity`/`totalValue` is non-null) |

## Why

The trade list and form previously showed `quantity` only as an unlabelled number. Traders need to know both the position size (shares) and the total capital deployed (total value = entry × shares) at a glance — this surfaces both without requiring a detail-page click.

## Layout improvements

- Form: "No of Shares" + "Setup Type" share a 2-column row, eliminating a lonely full-width quantity field.
- Form info box: expanded from 3 columns (Risk / Reward / R/R) to 4 columns (Risk / Reward / R/R / Total Value), responsive at `sm:grid-cols-4`.
- Table: two new numeric columns fit naturally in the existing `overflow-x-auto` scroll container; no columns were removed.
