# Initial Build — 2026-05-19

## What Was Built

A complete Stock Analysis & Trade Tracking web application built from an empty project folder
in a single session. The app is fully functional at http://localhost:3000.

### Components Delivered

| Component | Details |
|---|---|
| 7 backend services | common-lib, api-gateway, auth, trade, analysis, price-alert, performance |
| 1 React frontend | 12 pages, 37 components, 6 hooks, 5 services |
| Database DDL | 5 PostgreSQL schemas with indexes and constraints |
| Documentation | CLAUDE.md + this decision log |
| Startup scripts | start-backend.bat for one-command backend launch |

---

## Technical Decisions

### 1. H2 In-Memory Database (dev) vs PostgreSQL (production)

**Decision:** Use H2 for the development profile.

**Reason:** Docker and PostgreSQL were not installed on the development machine. H2 allows
the entire app to run with zero external dependencies. Spring Boot auto-creates all tables
via `ddl-auto: create-drop`.

**Production path:** Switch each service's `application.yml` to the PostgreSQL datasource and
run `docker-compose up -d postgres`. The `db/init/01-schemas.sql` file contains the full DDL.

---

### 2. Microservices with Shared common-lib

**Decision:** Split into 5 domain services + 1 gateway + 1 shared library.

**Reason:** The user specified microservices architecture. The `common-lib` JAR is shared
across all services to avoid duplicating JWT validation logic (JwtTokenProvider, JwtAuthFilter)
and exception handling (GlobalExceptionHandler).

**Trade-off:** Running 6 JVM processes locally uses ~1.5 GB RAM. The services are designed
to be run individually — start only the services you need during development.

---

### 3. Spring Cloud Gateway (WebFlux) for API Gateway

**Decision:** Use Spring Cloud Gateway instead of a simple Nginx reverse proxy.

**Reason:** Enables JWT pre-validation at the gateway edge, header injection (X-User-Id,
X-User-Roles), and CORS handling in one place. All other services still validate JWT
independently (defense in depth).

**Key complexity:** Spring Cloud Gateway uses WebFlux (reactive/Netty) and cannot coexist
with spring-webmvc on the classpath. The common-lib's Servlet-based classes (JwtAuthFilter,
GlobalExceptionHandler) are excluded from the gateway's component scan using REGEX filters.

---

### 4. Single PostgreSQL Instance with Multiple Schemas

**Decision:** One PostgreSQL database, five schemas (auth, trade, analysis, pricealert, performance).

**Reason:** Reduces operational overhead vs. five separate databases while maintaining
logical isolation. No cross-schema foreign keys — user identity is carried via JWT claims
(UUID), not DB constraints.

**Future:** Each schema can be extracted to its own database instance without DDL changes.

---

### 5. Yahoo Finance Unofficial Endpoint for Live Prices

**Decision:** Use `https://query2.finance.yahoo.com/v8/finance/chart/{ticker}` — no API key required.

**Reason:** Free tier of official market data APIs (Alpha Vantage, Polygon.io) have strict
rate limits. Yahoo Finance's unofficial endpoint works without registration and supports
Indian stocks (RELIANCE.NS, TCS.NS, NIFTY50.NS) and global equities.

**Trade-off:** Unofficial endpoint — could change without notice. Add a mock fallback in
`YahooFinanceClient` if needed.

---

### 6. No Cross-Schema Foreign Keys

**Decision:** Trade records reference `user_id` as a plain UUID column, not a FK to `auth.users`.

**Reason:** Cross-schema FK constraints prevent the schemas from being split to separate
databases later. User identity is authoritative from the JWT, not from a DB join.

---

### 7. JWT Local Validation at Gateway

**Decision:** Gateway validates JWT using `JwtTokenProvider` from common-lib — no call to auth-service.

**Reason:** If auth-service were a gateway dependency, every request would fail if auth-service
was down. Local validation (shared secret + JJWT library) keeps each downstream service
independently deployable.

---

### 8. React Context + Hooks (no Redux)

**Decision:** Use `AuthContext` + custom hooks (`useTrades`, `useAnalysis`, etc.) instead of Redux.

**Reason:** The app's state is largely server-state (fetched from API). Redux adds boilerplate
for minimal benefit here. React Query would be even better for server-state management and is
a natural next step.

---

### 9. Recharts for Charts

**Decision:** Use Recharts instead of Chart.js or D3.

**Reason:** Recharts is React-native (no imperative DOM manipulation), has a declarative
component API, and has zero non-React peer dependencies. Bundles at ~250 KB.

---

### 10. Single-Flight Token Refresh Pattern

**Decision:** Axios response interceptor implements a queue-based refresh pattern.

**Reason:** Multiple concurrent API calls that all receive 401 could trigger multiple
parallel refresh requests. The `isRefreshing` flag ensures only one refresh happens at a
time; all other failed requests are queued and retried after the new token arrives.

---

## File Counts

| Area | Files |
|---|---|
| Backend Java (all services) | ~120 .java files |
| Backend config/resources | 12 application.yml + pom.xml files |
| Frontend JSX/JS | 51 source files |
| Database DDL | 1 SQL file (5 schemas) |
| Infrastructure | docker-compose.yml, start-backend.bat |
| Documentation | CLAUDE.md, docs/2026-05-19-initial-build.md |

---

## Known Limitations

1. **No persistent storage in dev** — H2 is in-memory; all data is lost on service restart.
2. **Price polling calls Yahoo Finance** — requires internet connection; fails gracefully if unavailable.
3. **Performance service recomputes live** — no background snapshot scheduler; snapshots are computed on request.
4. **No email alerts** — in-app alerts only (stored in `pricealert.alerts` table).
5. **Bundle size** — frontend JS bundle is ~810 KB uncompressed. Consider code-splitting in a future iteration.
