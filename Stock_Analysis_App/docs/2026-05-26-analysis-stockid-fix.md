# 2026-05-26 — Bug Fix: Stock Association Not Saved on Analysis Create/Edit

## Problem

When a user selected a stock via the `StockSearchCombobox` and submitted the analysis form,
the `stock_id` column in the `analyses` table was always left `NULL`. The selected stock was
never associated with the saved analysis.

## Root Cause

`AnalysisCreateRequest` and `AnalysisUpdateRequest` (Java records) did not include a
`stockId` field. Jackson silently ignores unknown JSON fields, so the `stockId` the frontend
sent in the request body was discarded before the service ever saw it.

Three DTOs were missing the field, and the service `toResponse()` also never exposed it:

| File | Missing field |
|---|---|
| `AnalysisCreateRequest.java` | `Long stockId` |
| `AnalysisUpdateRequest.java` | `Long stockId` |
| `AnalysisResponse.java` | `Long stockId` |

## Fix

### Backend (analysis-service)

**`AnalysisCreateRequest.java`** — added `Long stockId` (optional, no constraint)

**`AnalysisUpdateRequest.java`** — added `Long stockId` (optional)

**`AnalysisResponse.java`** — added `Long stockId` after `userId` so the frontend receives
it in GET responses (needed to re-populate the combobox in edit mode)

**`AnalysisService.java`** — three changes:
1. `createAnalysis()`: `analysis.setStockId(request.stockId())`
2. `updateAnalysis()`: `if (request.stockId() != null) analysis.setStockId(request.stockId())`
3. `toResponse()`: `a.getStockId()` added as 3rd positional arg to `AnalysisResponse` constructor

### No frontend changes needed

The frontend already sent `stockId` in the request body and the combobox already called
`setValue('stockId', sel.stockId)` on selection. The bug was entirely server-side.

## Why the Bug Was There

The `stockId` association was added to the `Analysis` entity at an earlier date, but the
request/response DTOs were never updated to include it — an oversight during the initial
implementation.
