# StockTrack — Stock Analysis & Trade Tracking App

Full-stack trade journal with 7 Spring Boot microservices + React frontend.

---

## What It Does

- **Trade logging** — Entry/SL/target with auto-computed R/R ratio; optional link to source analysis; searchable stock combobox with inline create; list sortable by P/L, Status, Date
- **Pre-trade analysis** — Record price levels (stock/risk/reward), R/R ratio, buy decision, timeframe, thesis, and up to 4 chart images; images support browse, drag-and-drop, and clipboard paste (Ctrl+V / ⌘V); list sortable by Date, Outcome, R/R
- **Create Trade from Analysis** — One-click trade creation with all fields pre-filled from analysis; full bidirectional navigation
- **Revision history** — Every SL/target change tracked with full audit trail
- **Trade Trails** — Immutable trailing stop-loss / target log; `trade_trails` table stores every change with previous/new values, reason, and notes; active SL/target always derived from latest trail entry
- **P/L Analytics Dashboard** — 6-card P/L summary (all-time counts + 1-month amounts); clickable Profit/Loss cards with expandable trade list + Load More; Monthly P/L bar chart; Weekly Net P/L area chart; Win/Loss donut; Top 5 profit/loss trades table
- **Quantity & P/L on Trades** — `quantity` field on trade; `plAmount`, `plPercent`, `holdingDays` computed on every TradeResponse; TradeTable shows P/L column for closed trades
- **Live price monitoring** — Polls Yahoo Finance every 60 seconds for open trades
- **Alerts** — Notified when price is within 2% of stop-loss or target
- **Performance reports** — Win rate, strike rate, avg R/R, best setup breakdown
- **Role-based access** — ADMIN / TRADER / VIEWER roles
- **Master data** — 25 pre-seeded NSE/BSE/NASDAQ stocks; role management; bulk CSV upsert (Company Name, Industry, Symbol, Series, ISIN Code)
- **Momentum Score Dashboard** — Daily CSV upload, paginated score browser, Trending Report: identifies stocks with strictly-increasing scores over a Last-N-Days window or a custom date range; results shown as Day1/Day2/… columns
- **RSI Score Dashboard** — Daily RSI CSV upload (NSE format), paginated RSI browser, Trending Report: identifies stocks with strictly-increasing RSI over a Last-N-Days window or custom date range; RSI color-coded by overbought/oversold bands (≥70/50–70/30–50/<30)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS 3, Recharts, DM Sans + JetBrains Mono |
| API Gateway | Spring Cloud Gateway (WebFlux, port 8080) |
| Auth Service | Spring Boot 3.3, JWT (JJWT 0.12), BCrypt |
| Trade / Analysis / Performance / Price+Alert | Spring Boot 3.3, Spring Data JPA |
| Momentum Service | Spring Boot 3.3, Spring Data JPA (port 8086) |
| RSI Service | Spring Boot 3.3, Spring Data JPA (port 8087) |
| Database | MySQL 8.0 (schema: `stock_analysis`) |
| Build | Maven 3.9, Node 24, npm 11 |

---

## Quick Start

### Prerequisites
- Java 21, Maven 3.9+, Node 24+, MySQL 8.0 on localhost:3306
- Create database: `CREATE DATABASE stock_analysis;`

### 1. Build all backend services
```bat
mvn clean install -DskipTests
```

### 2. Start backend services
```bat
start-backend.bat
```

### 3. Start frontend
```bat
cd frontend && npm run dev
```

App: **http://localhost:3000**

### 4. Default admin
```
Email:    admin@stockapp.com
Password: Admin@123
```

---

## Service Ports & Swagger

| Service | Port | Swagger UI |
|---|---|---|
| API Gateway | 8080 | — (proxy only) |
| Auth Service | 8081 | http://localhost:8081/swagger-ui.html |
| Trade + Stock Service | 8082 | http://localhost:8082/swagger-ui.html |
| Analysis Service | 8083 | http://localhost:8083/swagger-ui.html |
| Price & Alert Service | 8084 | http://localhost:8084/swagger-ui.html |
| Performance Service | 8085 | http://localhost:8085/swagger-ui.html |
| Momentum Service | 8086 | http://localhost:8086/swagger-ui.html |
| RSI Service | 8087 | http://localhost:8087/swagger-ui.html |
| Frontend | 3000 | http://localhost:3000 |

---

## Database

All services share `stock_analysis` MySQL. Key tables: `roles`, `users`, `refresh_tokens`, `stocks`, `trades`, `trade_revisions`, `analyses`, `alerts`, `performance_snapshots`.

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/stock_analysis?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: root
    password: root
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        type:
          preferred_uuid_jdbc_type: VARCHAR
```

---

## Frontend Design System

The UI uses a "Trading Terminal meets Modern SaaS" aesthetic:

- **Fonts**: DM Sans (body) + JetBrains Mono (all numeric values via `.font-data`)
- **Colors**: Dark navy sidebar (`#0b1120`), warm-white content (`#f0f4f8`), indigo brand (`#6366f1`)
- **Components**: `.card`, `.section-heading`, `.label-xs`, `.segmented-control` CSS classes in `index.css`
- **Active state**: Left-border indicator (3px indigo) on sidebar nav items
- **Badges**: Use `dot` prop for status indicators
- **Animations**: `animate-fade-in` on all page components

---

## Folder Structure

```
Stock_Analysis_App/
├── pom.xml                    # Root Maven parent POM
├── start-backend.bat          # One-click backend launcher
├── CLAUDE.md                  # This file
├── PLAN.md                    # Project plan: built, improved, roadmap
├── common-lib/                # Shared: JWT, enums, exceptions
├── api-gateway/               # Spring Cloud Gateway (port 8080)
├── auth-service/              # Auth + User + Role (port 8081)
├── trade-service/             # Trade + Stock master (port 8082)
├── analysis-service/          # Pre-trade analysis (port 8083)
├── price-alert-service/       # Yahoo Finance + alerts (port 8084)
├── performance-service/       # Metrics + reports (port 8085)
├── frontend/                  # React + Vite (port 3000)
│   └── src/
│       ├── context/           # AuthContext
│       ├── hooks/             # useTrades, useAnalysis, usePerformance, useAlerts
│       ├── services/          # api.js (JWT interceptor), per-domain services
│       ├── utils/             # rrCalculator.js, formatters.js
│       ├── components/        # ui/, layout/, trades/, analysis/, performance/, alerts/
│       └── pages/             # 14 route pages
├── rsi-service/               # RSI score dashboard (port 8087)
└── docs/                      # Decision logs (dated)
```

---

## Next Steps

- [ ] **Deploy to Vercel** — Build Vite app, set `VITE_API_BASE_URL`, deploy `dist/`
- [x] **Analysis price levels** — Stock/risk/reward prices, R/R ratio, buy decision, timeframe, 4 chart images (2026-05-19)
- [x] **Create Trade from Analysis** — "Create Trade" button on AnalysisDetailPage; fields pre-filled; `analysis_id` FK on trades table; bidirectional navigation (2026-05-22)
- [x] **Trade Trail system** — `trade_trails` table; `POST /trades/{id}/trails` & `GET /trades/{id}/trails`; TrailTimeline component; active SL/target always reflects latest trail entry (2026-05-22)
- [x] **P/L Analytics** — `quantity` on Trade entity; P/L computed in TradeResponse; `GET /trades/pl-summary` + `GET /trades/pl-detail`; Dashboard rewritten with 6-card summary, expandable trade lists, 4 chart widgets, top-5 tables; performance-service monthly/weekly now includes totalPL/profitAmount/lossAmount (2026-05-22)
- [x] **Stock CSV bulk upsert** — `POST /stocks/upload-csv`; Stock entity extended with `industry`, `series`, `isinCode`; upsert-by-symbol logic; built-in quoted-field CSV parser; StocksPage shows all new columns + Upload CSV modal with template download + result summary (2026-05-22)
- [x] **Momentum Score Dashboard** — New `momentum-service` on port 8086; tables `momentum_scores` (upsert by symbol+date), `momentum_uploads`; CSV upload with header-driven column detection (ignores extra cols); trending report (score ≥ N, strictly increasing); frontend MomentumPage with Upload / Scores Browser / Trending Report tabs (2026-05-22)
- [x] **Trending Report date-range filter** — `/momentum/trending` accepts optional `dateFrom`/`dateTo` for fixed calendar windows in addition to `lastNDays`; results table shows individual Day1/Day2/… columns with actual date labels; `findDatesBetween` repo query added (2026-05-23)
- [x] **Trending Report column sort** — Day 1/Day 2/…/Change columns are clickable to sort asc/desc; client-side `useMemo` sort, no backend changes; sort resets on new search; active sort shown in sub-heading with Reset link (2026-05-23)
- [x] **Chart image drag-and-drop + paste** — New shared `ChartImageSlot` component; supports browse, drag-and-drop, and clipboard paste (Ctrl+V / ⌘V); one-slot-at-a-time paste coordination via `CustomEvent`; slot shows brand ring + hint when paste-ready; used in `AnalysisDetailPage` and `AnalysisForm`; no backend changes (2026-05-24)
- [x] **Stock search combobox on New Trade** — `TradeForm` now uses `StockSearchCombobox` (reused from analysis form); removes full list fetch; supports debounced search, paste, keyboard nav, and inline stock creation; `canCreate` prop threads through `TradeDetailPage` for edit mode (2026-05-25)
- [x] **Sortable columns on Trades list** — `TradeTable` supports asc/desc sort on P/L, Status, and Date; client-side `useMemo` sort; active column highlighted in brand color with up/down chevron; Reset sort link in filter bar (2026-05-25)
- [x] **Sortable columns on Analysis list** — `AnalysisTable` supports asc/desc sort on R/R, Outcome, and Date; same client-side pattern; Outcome ordered PENDING → CORRECT → FAILED; nulls pushed to bottom (2026-05-25)
- [x] **Default date-descending sort** — Both `TradeTable` and `AnalysisTable` open with latest entries on top; initial `sortKey` state changed from `null` to `'date'`; no backend changes (2026-05-26)
- [x] **Bug fix: stock association not saved on analysis create/edit** — `AnalysisCreateRequest`, `AnalysisUpdateRequest`, and `AnalysisResponse` were all missing the `stockId` field; Jackson silently dropped it; fixed by adding `Long stockId` to all three DTOs and wiring `setStockId()` in the service (2026-05-26)
- [x] **Bug fix: "Create & Select" did not save new stock** — `StockSearchCombobox` rendered the inline create panel as a `<form>` nested inside the outer `AnalysisForm`/`TradeForm` `<form>`; browsers strip inner forms and reassign the submit button to the outer form; fixed by converting the inner `<form>` to `<div>` and the submit button to `type="button"` with `onClick` (2026-05-26)
- [x] **RSI Score Dashboard** — New `rsi-service` on port 8087; tables `rsi_scores` (upsert by symbol+date), `rsi_uploads`; header-driven CSV parser ignores extra NSE columns; trending report (RSI ≥ minRsi, strictly increasing); RSI color thresholds (≥70 overbought amber, 50–70 bullish emerald, 30–50 neutral, <30 oversold red); gateway route added; frontend RsiPage with Upload / Scores Browser / Trending Report tabs and sortable Day/Change columns (2026-05-26)
- [x] **Pagination — Trades, Analysis, Stocks** — Fixed Analysis and Trades pages to fully use backend `Page<>` response: hooks now forward `totalPages`/`totalElements`/`page` metadata; pages manage page state and reset on filter change; new reusable `Pagination.jsx` component renders prev/next + numbered page buttons; default backend sort fixed to DESC (newest first) via `Sort.Direction.DESC`; added `@EnableSpringDataWebSupport` to both services; Stocks page gets client-side pagination (20/page) with no backend change (2026-05-26)
- [x] **Pagination — Alerts, Momentum, RSI + record counts everywhere** — Pagination.jsx updated: always shows "Showing X–Y of N records" when results exist, hides nav buttons only on single-page sets; Alerts page gets client-side pagination (20/page) via `useMemo` slice + AlertList `pagination`/`onPageChange` props; MomentumPage and RsiPage ScoresTabs migrated from custom prev/next footer to reusable `<Pagination>`; all ScoresTabs page size fixed to 20; all list pages show total record count (2026-05-26)
- [x] **Trending Report CSV export** — "Download CSV" button on Trending Stocks results card; exports `displayResults` (current client-side sort preserved); filename encodes filters (`minScore`, `lastNDays`/date range, today's date); backend `GET /momentum/trending/export` endpoint added returning `text/csv` with `Content-Disposition: attachment`; `ArrowDownTrayIcon` added to MomentumPage imports; `exportTrendingCsv()` added to `momentum.js` service (2026-05-27)
- [x] **Analysis pagination — configurable page size + explicit API params** — Controller accepts explicit `page` (1-based), `page_size` (validated 10–100), `sort_by`, `sort_order` params replacing Spring's `@PageableDefault`; default page size driven by `app.pagination.analysis.page-size` in `application.yml`; `useAnalysis` hook converts 0-based React state to 1-based API page and maps `size`→`page_size`; `AnalysisPage` no longer hardcodes page size; `Pagination.jsx` gains `displayMode="page"` prop showing "Showing page X of Y | Total Records: Z"; `AnalysisTable` passes `displayMode="page"` (2026-05-27)
- [x] **Architecture fixes — performance, security, scalability** — DB indexes on all entities; `@Enumerated(STRING)` on Trade/Analysis status/direction/outcome; N+1 trail query fixed (batch `findByTradeIdIn`); internal endpoints secured with `X-Internal-Token`; `countOpenTrades` fixed to scalar endpoint; Caffeine caching on performance/momentum/rsi services; Momentum+RSI trending moved to MySQL 8 LAG window-function query; server-side sort for trades and analyses; hook deps replaced with stable primitives; JWT secret moved to `${JWT_SECRET}` env var; Docker Compose fixed to MySQL 8; bug fix: analysis stats query used `'INCORRECT'` instead of `'FAILED'` (2026-05-31) — see `docs/2026-05-31-architecture-fixes.md`
- [ ] **WebSocket / SSE** — Replace 60s polling with Spring WebFlux SSE for live prices
- [ ] **Historical performance charts** — P&L curve over time, year-over-year comparison
- [ ] **User preferences** — Dark mode, alert thresholds, saved filter presets
- [ ] **Trade journal** — Chart screenshot uploads, broker CSV import, trade tags
- [ ] **Portfolio P&L** — Cross-trade P&L, position sizing calculator, drawdown tracking
- [ ] **Infrastructure** — Flyway migrations, GitHub Actions CI (Docker Compose now working with MySQL 8)
- [ ] **Mobile app** — React Native sharing the same REST API
