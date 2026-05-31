# 2026-05-22 — Momentum Score Dashboard (New Microservice)

## Why

Users need to track daily momentum scores for stocks and identify which stocks are consistently gaining momentum over multiple days. Scores come from an external tool as a CSV export and need to be imported, stored date-wise, and analyzed for trends.

---

## New Service: momentum-service (Port 8086)

A standalone Spring Boot 3.3 microservice following the same patterns as analysis-service. Auto-creates its own tables in the shared `stock_analysis` MySQL database via `ddl-auto: update`.

Gateway route: `GET|POST /api/momentum/**` → `http://localhost:8086`

---

## Database Tables

### `momentum_uploads`
Tracks each CSV import session.

| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK auto | |
| file_name | VARCHAR(255) | Original filename |
| score_date | DATE NOT NULL | User-selected or today |
| uploaded_at | DATETIME | Auto on insert |
| uploaded_by | VARCHAR(36) | UUID of uploader |
| total_rows / inserted / updated / failed | INT | Upload counts |

### `momentum_scores`
Stores one score per (symbol, score_date) — unique constraint.

| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK auto | |
| symbol | VARCHAR(30) NOT NULL | Always UPPERCASE |
| stock_name | VARCHAR(300) NOT NULL | |
| sector_name | VARCHAR(200) | Nullable |
| score | DECIMAL(10,4) NOT NULL | |
| score_date | DATE NOT NULL | Part of unique key |
| upload_id | BIGINT | FK to momentum_uploads |
| uploaded_by | VARCHAR(36) | |
| created_at / updated_at | DATETIME | Auto timestamps |

**Unique constraint:** `uk_momentum_symbol_date (symbol, score_date)` — re-uploading for the same date updates existing rows (upsert).

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /momentum/upload | ADMIN/TRADER | Upload CSV (multipart), optional `?scoreDate=YYYY-MM-DD` |
| GET | /momentum/scores | ALL | Browse scores with filters |
| GET | /momentum/trending | ALL | Get trending stocks |
| GET | /momentum/uploads | ALL | List upload history |
| GET | /momentum/dates | ALL | All distinct score dates |
| GET | /momentum/sectors | ALL | All distinct sectors |

### POST /momentum/upload

- Accepts `multipart/form-data` with `file` field
- Optional `scoreDate` query param (ISO date). Defaults to today.
- **Header-driven column detection**: reads the header row to locate columns by name (case-insensitive). Extra columns (Exch, 4 Day Change, Close, Chg%, etc.) are silently ignored.
- **Required columns**: `Symbol`, `Stock Name`, `Score`
- **Optional column**: `Sector Name`
- Skips blank rows
- Rejects duplicate symbols within the same upload
- Upserts: existing (symbol, scoreDate) → UPDATE; new → INSERT

### GET /momentum/scores

Params: `dateFrom`, `dateTo`, `lastNDays`, `sector`, `symbol`, `page`, `size`

### GET /momentum/trending

Params: `lastNDays` (default 3), `minScore` (default 60.0)

**Algorithm:**
1. Finds the N most recent distinct `score_date` values in the DB
2. Fetches all scores for those dates where `score >= minScore`
3. Groups by symbol; filters to symbols that:
   - Have a score for EVERY one of the N dates
   - Have strictly increasing scores day-over-day
4. Returns results sorted by latest score descending

---

## CSV Format

The service accepts any CSV that includes at minimum these headers (in any order, other columns ignored):

```
...,Stock Name,...,Symbol,...,Sector Name,...,Score,...
```

Example from NSE momentum export:
```csv
Stock Name,Industry,Symbol,Exch,Sector Name,Industry Name,Score,4 Day Change,Close,Chg%,Symbol with Comma for External Upload
Reliance Industries Ltd,Oil & Gas,RELIANCE,NSE,Energy,Oil & Gas,78.50,2.30,2850.00,1.20,RELIANCE
Infosys Ltd,Technology,INFY,NSE,Information Technology,Software,82.30,3.10,1650.00,2.10,INFY
```

Fields stored: Stock Name → `stockName`, Symbol → `symbol` (uppercased), Sector Name → `sectorName`, Score → `score` (decimal).

---

## Frontend: MomentumPage (`/momentum`)

Tab-based single page with three sections, accessible from sidebar (⚡ icon).

### Tab 1: Upload
- Format guide with required columns
- Optional score date picker (defaults to today)
- CSV file picker (`.csv` only)
- Upload & Process button
- Result panel: inserted / updated / failed counts + scrollable error list
- Recent upload history table (file, score date, uploaded at, counts)

### Tab 2: Scores Browser
- Filters: Quick range (last 3/5/7/14/30 days) or custom date range, sector dropdown, symbol search
- Table: Symbol, Stock Name, Sector, Score (color-coded pill), Score Date
- Score colors: ≥80 green, 60-79 lime, 40-59 amber, <40 red
- Pagination

### Tab 3: Trending Report
- Controls: Last N days (3/5/7/10 or custom), Min Score input
- "Find Trending Stocks" button
- Results table:
  - Symbol, Stock Name, Sector
  - **Score Trend** — each date's score as a mini chip with ↑ arrows between them
  - Latest Score (large, color-coded)
  - Change (latest − first, always positive for trending stocks)

---

## Files Created

**Backend (momentum-service — new module)**
- `pom.xml`
- `src/main/resources/application.yml` (port 8086)
- `MomentumApplication.java`
- `config/SecurityConfig.java`
- `config/OpenApiConfig.java`
- `entity/MomentumUpload.java`
- `entity/MomentumScore.java`
- `repository/MomentumUploadRepository.java`
- `repository/MomentumScoreRepository.java`
- `dto/MomentumUploadResult.java`
- `dto/MomentumScoreResponse.java`
- `dto/MomentumUploadSummary.java`
- `dto/DailyScore.java`
- `dto/TrendingStockResponse.java`
- `service/MomentumService.java`
- `controller/MomentumController.java`

**Config changes**
- `pom.xml` (root) — added `<module>momentum-service</module>`
- `api-gateway/application.yml` — added momentum route
- `start-backend.bat` — added step 6 for momentum-service

**Frontend**
- `src/services/momentum.js` — 6 API functions
- `src/pages/MomentumPage.jsx` — full tab-based page
- `src/App.jsx` — route `/momentum`
- `src/components/layout/Sidebar.jsx` — "Momentum" nav item with ⚡ (BoltIcon)
