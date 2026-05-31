# Analysis Pagination — Configurable Page Size & Explicit API Params

**Date:** 2026-05-27

## What changed

### Backend — `analysis-service`

**`application.yml`**
Added `app.pagination.analysis.page-size: 20` so the default page size is driven by
configuration rather than a Java constant. Changing this value takes effect on restart
without any code change.

**`AnalysisController.java`**
Replaced the `@PageableDefault Pageable pageable` parameter with four explicit
`@RequestParam` entries:

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | int | 1 | 1-based; converted to 0-based for Spring Data |
| `page_size` | Integer | *(from config)* | Clamped to [10, 100] |
| `sort_by` | String | `created_at` | Mapped to JPA field via `SORT_FIELD_MAP` |
| `sort_order` | String | `desc` | `asc` or `desc` |

Supported `sort_by` values and their JPA mappings:

```
created_at    → createdAt
analysis_date → analysisDate
ticker        → ticker
outcome       → outcome
rr_ratio      → rrRatio
```

Validation rules:
- `page_size < 10` → clamped to 10
- `page_size > 100` → clamped to 100
- `page_size` absent → uses `${app.pagination.analysis.page-size}` from config
- `page < 1` → treated as page 1 (`Math.max(0, page - 1)`)
- Unknown `sort_by` → falls back to `createdAt`

### Frontend — React

**`useAnalysis.js`**
The hook now transforms its internal params before calling the API:
- `page` (0-based React state) → `page + 1` (1-based API param)
- `size` (legacy Spring param name) → `page_size` (new param name); omitted entirely
  if not provided, so the backend default applies

**`AnalysisPage.jsx`**
Removed the hardcoded `PAGE_SIZE = 20` constant and the `size: PAGE_SIZE` passed to
the hook. The page size is now fully owned by the backend configuration.

**`Pagination.jsx`**
Added `displayMode` prop:
- `displayMode="range"` (default, unchanged): "Showing X–Y of Z records"
- `displayMode="page"`: "Showing page X of Y | Total Records: Z"

All existing pages (Alerts, Momentum, RSI, Trades) use the default mode; no change
to their display.

**`AnalysisTable.jsx`**
Passes `displayMode="page"` to `<Pagination>`, so the Analysis list footer now reads
"Showing page 1 of 7 | Total Records: 125" (example).

## Why

The prior implementation used Spring's built-in `@PageableDefault` which:
- Accepted Spring's standard `size` param (ambiguous API surface)
- Hardcoded the default page size in Java (requiring a code change to tune)
- Used 0-based `page` numbering (non-intuitive for API consumers)
- Had no validation on the page size range

The new design aligns with the API spec: 1-based pages, underscore-separated param
names (`page_size`, `sort_by`, `sort_order`), and a config-file-driven default that
operations can tune without a redeploy.

## Files changed

**Backend**
- `analysis-service/src/main/resources/application.yml` — pagination config added
- `analysis-service/src/main/java/com/stockapp/analysis/controller/AnalysisController.java` — explicit params, validation, sort mapping

**Frontend**
- `frontend/src/hooks/useAnalysis.js` — page conversion, param rename
- `frontend/src/pages/AnalysisPage.jsx` — removed hardcoded PAGE_SIZE
- `frontend/src/components/ui/Pagination.jsx` — `displayMode` prop
- `frontend/src/components/analysis/AnalysisTable.jsx` — `displayMode="page"`
