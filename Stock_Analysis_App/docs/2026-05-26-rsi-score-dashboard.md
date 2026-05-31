# RSI Score Dashboard — 2026-05-26

## What Changed

Added a new **RSI Score Dashboard** module (port 8087) alongside the existing Momentum Score Dashboard.

### Backend — `rsi-service` (new Spring Boot service, port 8087)

**Entities**
- `rsi_scores` table: stores symbol, stockName, sectorName, rsiScore (BigDecimal), scoreDate; unique constraint on (symbol, score_date)
- `rsi_uploads` table: tracks each CSV upload session (fileName, scoreDate, uploadedBy, inserted/updated/failed counts)

**CSV Parsing**
- Header-driven column detection (case-insensitive, BOM-stripped)
- Required columns: `Stock Name`, `Symbol`, `RSI`
- Optional: `Sector Name`
- All other columns from the NSE export (Exch, Industry Name, Prev. RSI, Close, Chg %, Symbol with Comma for External Upload) are silently ignored
- Per-row upsert in a `REQUIRES_NEW` transaction via `RsiRowSaver` — a bad row never rolls back the rest

**Endpoints**
- `POST /rsi/upload` — multipart CSV + optional `scoreDate` param; roles: ADMIN, TRADER
- `GET /rsi/scores` — paginated browser with dateFrom/dateTo/lastNDays/sector/symbol filters
- `GET /rsi/trending` — strictly-increasing RSI report; params: lastNDays, minRsi (default 50), dateFrom, dateTo
- `GET /rsi/uploads` — upload history
- `GET /rsi/dates` — distinct score dates
- `GET /rsi/sectors` — distinct sectors

**Trending logic**: identical to Momentum — finds stocks present on every date in the selected window with strictly increasing RSI day-over-day; dateFrom+dateTo takes precedence over lastNDays.

**Infrastructure**
- Root `pom.xml`: added `<module>rsi-service</module>`
- `api-gateway/application.yml`: added route `/api/rsi/**` → `http://localhost:8087` with `StripPrefix=1`
- `start-backend.bat`: added RSI service start command (step 7/8)

### Frontend

**`frontend/src/services/rsi.js`** (new)
- `uploadRsiCsv`, `listRsiScores`, `getTrendingRsiStocks`, `listRsiUploads`, `getAvailableRsiDates`, `getAvailableRsiSectors`

**`frontend/src/pages/RsiPage.jsx`** (new)
- Three-tab layout: Upload, Scores Browser, Trending Report — identical UX pattern to MomentumPage
- RSI-specific color thresholds: ≥ 70 overbought (amber), 50–70 bullish (emerald), 30–50 neutral (slate), < 30 oversold (red)
- Trending Report: sortable Day 1/Day 2/… and Change columns (client-side useMemo, sort resets on new search)
- Min RSI filter defaults to 50 (matching backend default)

**`frontend/src/App.jsx`** — added `<Route path="/rsi" element={<RsiPage />} />`

**`frontend/src/components/layout/Sidebar.jsx`** — added RSI nav item using `SignalIcon`

## Why

User requested a dedicated RSI Score Dashboard that mirrors the Momentum Score Dashboard but stores RSI values from NSE-style CSV exports. The key differences are:
- Column name is `RSI` not `Score`
- RSI has well-known interpretation bands (overbought/oversold) reflected in the UI color coding
- Default minRsi is 50 (momentum in the bullish zone) rather than 60
