# StockTrack — Project Plan

## What We Built

A full-stack stock analysis and trade tracking application for serious traders. Built as six Spring Boot microservices with a React frontend.

**Core capabilities:**
- Trade journal — log entry, stop-loss, target; auto-compute R/R ratio
- Pre-trade analysis — record thesis, setup type, expected direction before entering
- Revision history — every SL/target change tracked with full audit trail
- Live price monitoring — Yahoo Finance polling every 60 seconds for open trades
- Alerts — notified when price is within 2% of stop-loss or target
- Performance reports — win rate, strike rate, avg R/R, best setup breakdown
- Role-based access — ADMIN / TRADER / VIEWER with route and API protection
- Master data — 25 pre-seeded NSE/BSE/NASDAQ stocks, role management

**Tech stack:**
- Frontend: React 18, Vite 6, Tailwind CSS 3, Recharts, Heroicons, DM Sans + JetBrains Mono
- Backend: 6 Spring Boot 3.3 microservices (auth, trade, analysis, price-alert, performance, api-gateway)
- Database: MySQL 8.0 (`stock_analysis` schema, Hibernate ddl-auto)
- Auth: JWT (JJWT 0.12) + BCrypt, role-based Spring Security

---

## What We Improved

**Design system overhaul (Round 1 — Ralph Loop iteration)**

1. **Typography** — Replaced system Inter with `DM Sans` (Google Fonts). All numeric values rendered in `JetBrains Mono` for financial scannability (`.font-data` class).

2. **Login page** — Full split-panel redesign: 52% dark navy brand panel with feature list and copy, 48% clean white form. Most impactful single change.

3. **Sidebar** — Active state now uses a 3px left border indicator instead of background fill. Refined logo (indigo rounded square + SVG chart icon). Reduced width from 256px to 240px.

4. **Navigation** — Topbar now shows breadcrumbs with back-navigation links on detail pages.

5. **Dashboard** — Contextual greeting ("Good morning, Rajeev") with current date. MetricsCard gained icon slot, accent color system, and trend indicator.

6. **UI primitives** — Button press effect (`active:scale-[0.97]`), brand shadow on primary, hover states on inputs. Badge got dot indicator and ring border. EmptyState replaced emoji with SVG icons.

7. **Tables** — Consistent `label-xs` headers, right-aligned price columns, `font-data` on all numbers, `dot` badge on status, `group-hover:text-brand` on clickable rows.

8. **CSS architecture** — Component classes in `index.css` (`.card`, `.section-heading`, `.label-xs`, `.segmented-control`) enforce design consistency across 35+ files.

9. **Mobile** — Sidebar overlay gets `backdrop-blur-sm`. Login stacks gracefully.

10. **Build verified** — `npm run build` passes clean (1515 modules, 3.18s).

---

## Future Roadmap

### Deploy to Vercel (Frontend)
- Build the Vite app, set `VITE_API_BASE_URL` to the production API URL
- Deploy `dist/` to Vercel via GitHub integration or `vercel` CLI
- Configure CORS on the API gateway for the Vercel domain

### WebSocket / SSE for real-time prices
- Replace 60-second polling in price-alert-service with Spring WebFlux SSE
- Connect frontend with EventSource API or SockJS + STOMP
- Show live price tickers in the trade table row

### Performance charts — historical data
- Add time-series storage in performance-service (monthly/weekly snapshots)
- Recharts `AreaChart` for P&L curve over time
- Compare periods year-over-year

### User preferences & settings
- Persist dark mode preference, default currency, timezone
- Per-user notification thresholds (alert at 1% or 3% proximity)
- Saved filter presets on the trades/analysis tables

### Trade journal enhancements
- Chart screenshot uploads via S3/Cloudinary attached to trade records
- Import trades from broker statement CSV (Zerodha, Fyers, Angel One)
- Trade tags for multi-dimensional filtering (sector, index, strategy)

### Portfolio P&L tracking
- Cross-trade P&L in INR/USD across open and closed trades
- Position sizing calculator (risk % of capital → quantity)
- Drawdown tracking per setup type

### Infrastructure
- Flyway database migrations (replace `ddl-auto: update`)
- Docker Compose for full containerized deployment
- GitHub Actions CI pipeline (test + build on PR)
- Mobile app (React Native) sharing the same REST API
