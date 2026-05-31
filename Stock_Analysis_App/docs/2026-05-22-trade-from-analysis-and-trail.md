# 2026-05-22 — Create Trade from Analysis + Trade Trail System

## What Changed

Two interconnected features added to the trade and analysis modules.

---

## Feature 1: Create Trade from Analysis

### Why
Users were doing pre-trade analysis separately from trade execution. There was no link between the two, forcing manual re-entry of all prices and setup details when moving from analysis to trade.

### What Was Built

**Backend (trade-service)**

- `Trade` entity — added `analysis_id VARCHAR(36)` column (nullable FK, soft reference to analysis-service)
- `TradeCreateRequest` DTO — added optional `analysisId` field
- `TradeResponse` DTO — added `analysisId` field
- `TradeRepository` — added `findByAnalysisId(UUID)` method
- `TradeService` — `createTrade` stores `analysisId`; new `getTradesByAnalysis(analysisId, userId)` method
- `TradeController` — new `GET /trades/by-analysis/{analysisId}` endpoint

**Frontend**

- `AnalysisDetailPage` — "Create Trade" button (visible when analysis has price levels); navigates to `/trades/new` with `location.state.fromAnalysis` containing all prefilled fields
- `NewTradePage` — reads `location.state.fromAnalysis`; passes it as `defaultValues` to TradeForm; sends `analysisId` in create payload; Cancel returns to analysis page when coming from analysis
- `TradeDetailPage` — shows "Linked Analysis" section with a link back to the source analysis (when `analysisId` is present)
- `AnalysisDetailPage` — new "Linked Trades" card at the bottom listing all trades created from this analysis with status/outcome badges
- `services/trades.js` — added `getTradesByAnalysis(analysisId)` function

### Data Relationship
One analysis → many trades (one-to-many, soft reference). The trade stores `analysis_id`; no DB foreign key constraint between services (microservices pattern). The analysis-service has no knowledge of trades.

### Fields Pre-filled
| Analysis field | Trade field |
|---|---|
| ticker | ticker |
| expectedDirection | direction |
| stockPrice | entryPrice |
| riskPrice | stopLoss |
| rewardPrice | targetPrice |
| setupType | setupType |
| thesis | notes |
| id | analysisId (hidden) |

All pre-filled values are editable before submission.

---

## Feature 2: Trade Trail / Trailing SL & Target Tracking

### Why
Traders regularly move their stop-loss and target as trades develop (trailing SL after profits, revising targets on new structure). The existing revision system tracked changes to the trade entity but wasn't purpose-built for this workflow.

The key requirement: **never overwrite** previous SL/target. Every change must be a new append-only record with a complete before/after snapshot.

### What Was Built

**New entity: `trade_trails`**

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(36) PK | UUID |
| trade_id | VARCHAR(36) NOT NULL | FK to trades |
| previous_stop_loss | DECIMAL(15,4) | Active SL before this change |
| new_stop_loss | DECIMAL(15,4) | New SL (null if only target changed) |
| previous_target | DECIMAL(15,4) | Active target before this change |
| new_target | DECIMAL(15,4) | New target (null if only SL changed) |
| reason | TEXT | User-provided reason |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMP | Auto-set, immutable |

**Backend (trade-service)**

- `TradeTrail` entity (JPA, auto-created by `ddl-auto: update`)
- `TradeTrailRepository` — `findByTradeIdOrderByCreatedAtAsc`, `findByTradeIdOrderByCreatedAtDesc`, `deleteByTradeId`
- `TradeTrailCreateRequest` DTO — `newStopLoss`, `newTarget`, `reason`, `notes`
- `TradeTrailResponse` DTO — all fields
- `TradeService`:
  - `addTrailEntry` — validates trade is OPEN; resolves current active SL/target from prior trail entries (or original trade values); stores previous + new values
  - `getTrailEntries` — returns all entries in chronological order
  - `toResponse` — now computes `activeStopLoss` and `activeTarget` from latest trail entries (scanning most-recent-first for each field independently)
  - `deleteTrade` — clears trail entries before deletion
- `TradeController`:
  - `POST /trades/{id}/trails` — add trail entry (TRADER/ADMIN)
  - `GET /trades/{id}/trails` — get trail history (TRADER/ADMIN/VIEWER)
- `TradeResponse` DTO — added `activeStopLoss`, `activeTarget` fields

**Active Value Logic**

`activeStopLoss` = most recent trail entry with a non-null `newStopLoss`, or the trade's original `stopLoss` if no trail has set SL.  
`activeTarget` = most recent trail entry with a non-null `newTarget`, or the trade's original `targetPrice`.

This allows partial updates — a trail entry that only updates SL doesn't affect the active target, and vice versa.

**Frontend**

- `TrailTimeline.jsx` — new component; renders trail entries as a vertical timeline; the most recent entry is tagged "Active"; shows before/after for SL and/or target, reason, notes, timestamp
- `TradeDetailPage` — major overhaul:
  - Loads trail entries alongside trade and revisions
  - "Add Trail Entry" button (amber, visible when OPEN)
  - "Active Levels" section shows `activeStopLoss` / `activeTarget` / current R/R when trails exist
  - "Original levels" section always shown for reference
  - Trail History card with TrailTimeline
  - Add Trail Entry modal with inputs for new SL, new target, reason, notes
- `Button.jsx` — added `warning` (amber) variant for trail-related actions
- `services/trades.js` — added `addTrailEntry(tradeId, data)`, `getTrailEntries(tradeId)`

### Append-Only Guarantee
Trail entries are never updated or deleted via API. `addTrailEntry` only creates new records. `deleteTrade` is admin-only and physically removes all trails with the trade.

---

## Files Changed

**Backend**
- `trade-service/.../entity/Trade.java` — +analysisId field
- `trade-service/.../entity/TradeTrail.java` — new
- `trade-service/.../repository/TradeRepository.java` — +findByAnalysisId
- `trade-service/.../repository/TradeTrailRepository.java` — new
- `trade-service/.../dto/TradeCreateRequest.java` — +analysisId
- `trade-service/.../dto/TradeResponse.java` — +analysisId, activeStopLoss, activeTarget
- `trade-service/.../dto/TradeTrailCreateRequest.java` — new
- `trade-service/.../dto/TradeTrailResponse.java` — new
- `trade-service/.../service/TradeService.java` — +trail methods, updated toResponse
- `trade-service/.../controller/TradeController.java` — +3 endpoints

**Frontend**
- `src/services/trades.js` — +getTradesByAnalysis, addTrailEntry, getTrailEntries
- `src/components/trades/TrailTimeline.jsx` — new
- `src/components/ui/Button.jsx` — +warning variant
- `src/pages/TradeDetailPage.jsx` — trail section + analysis reference
- `src/pages/AnalysisDetailPage.jsx` — Create Trade button + Linked Trades card
- `src/pages/NewTradePage.jsx` — prefill from analysis state
