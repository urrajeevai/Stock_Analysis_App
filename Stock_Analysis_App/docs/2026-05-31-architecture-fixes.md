# Architecture Fixes — 2026-05-31

**Scope:** All 8 Spring Boot microservices + React frontend  
**Triggered by:** Architecture review identifying 17 issues across performance, scalability, security, and maintainability

---

## 1. Database Indexes Added (P-5)

**Problem:** No `@Index` annotations on any entity. Full-table scans on every query.

**Fix:** Added composite indexes to all heavily-queried entities:

| Entity / Table | New Indexes |
|---|---|
| `trades` | `(user_id, status)`, `(user_id, created_at DESC)`, `(analysis_id)`, `(user_id, closed_at DESC)` |
| `trade_trails` | `(trade_id, created_at DESC)` |
| `trade_revisions` | `(trade_id, revised_at DESC)` |
| `analyses` | `(user_id, outcome)`, `(user_id, analysis_date DESC)`, `(user_id, ticker)` |
| `alerts` | `(user_id, triggered_at DESC)`, `(trade_id)`, `(user_id, acknowledged)` |
| `momentum_scores` | `(score_date)`, `(score_date, score DESC)`, `(symbol, score_date ASC)` |
| `rsi_scores` | `(score_date)`, `(score_date, rsi_score DESC)`, `(symbol, score_date ASC)` |

**Why:** These are the exact filter/join patterns used by every query in the codebase.

---

## 2. String Fields Replaced with @Enumerated Enums (M-1)

**Problem:** `Trade.status`, `Trade.direction`, `Trade.outcome`, `Analysis.outcome` were raw `String` fields. Business logic used string literals like `"OPEN".equals(...)`, `trade.setStatus("CLOSED")`. Typos were silent.

**Fix:** Applied `@Enumerated(EnumType.STRING)` using the existing `common-lib` enums:
- `Trade.status` → `TradeStatus` (OPEN, CLOSED, CANCELLED)
- `Trade.direction` → `Direction` (LONG, SHORT)
- `Trade.outcome` → `TradeOutcome` (WIN, LOSS, BREAKEVEN)
- `Analysis.outcome` → `AnalysisOutcome` (PENDING, CORRECT, FAILED)

Updated `TradeService`, `TradeRepository`, `AnalysisService` to use enum literals.  
The DB column values are unchanged (still stored as strings like "OPEN") — no data migration needed.

---

## 3. N+1 Trail Query Fixed (P-1)

**Problem:** `TradeService.toResponse()` fired a `SELECT * FROM trade_trails WHERE trade_id = ?` for every trade in every paginated list. Listing 20 trades = 21 queries.

**Fix:** 
- Added `findByTradeIdInOrderByCreatedAtDesc(Collection<UUID> ids)` to `TradeTrailRepository`.
- `listTrades()` now fetches the page, collects all trade IDs, fires **one** batch trail query, builds a `Map<UUID, List<TradeTrail>>`, then maps each trade to its trails.
- Same batch approach in `getOpenTrades()` via new `buildResponseList()` helper.

**Result:** 20 trades = 2 queries regardless of page size.

---

## 4. Internal Endpoints Secured with X-Internal-Token (SEC-2)

**Problem:** `/trades/internal/**` endpoints were open to any caller on the network with no authentication.

**Fix:**
- Added `X-Internal-Token` header validation in `TradeInternalController`. Unauthorized calls return HTTP 401.
- `internal.token` config property added to `trade-service` and `price-alert-service` `application.yml`, defaulting to a placeholder that should be overridden in production.
- Both `price-alert-service` and `performance-service` `TradeServiceClient` now send `X-Internal-Token` on every inter-service call.

---

## 5. Performance Service: Fixed countOpenTrades() + Added Caching (P-2, P-3)

**Problem 1:** `countOpenTrades()` fetched the full list of open trades just to call `.size()`.  
**Problem 2:** 5 separate endpoints each independently called `getClosedTrades()` over HTTP on every page load.

**Fix:**
- Added `GET /trades/internal/count?userId=&status=` endpoint returning a scalar `{count: N}`.
- Performance `TradeServiceClient.countOpenTrades()` now calls this scalar endpoint.
- Added `spring-boot-starter-cache` + Caffeine to `performance-service` pom.
- Created `CacheConfig` with 5-minute TTL for all 5 caches: `perfSummary`, `perfWeekly`, `perfMonthly`, `perfSetups`, `perfRRDist`.
- Added `@Cacheable` to all 5 computation methods (keyed by userId).
- Added `@CacheEvict` (all 5 caches) on `forceRecompute()`.
- `getClosedTrades()` itself is also cached (`@Cacheable`) so the first call per user per 5-min window pays the HTTP cost; subsequent calls within the TTL are free.

---

## 6. Momentum & RSI Trending Moved to SQL (P-4)

**Problem:** Trending report loaded ALL matching rows (potentially 10,000+) into a Java `List` and did grouping + strictly-increasing filtering in Java streams.

**Fix:** Added a native MySQL 8 LAG window-function query to both `MomentumScoreRepository` and `RsiScoreRepository`:

```sql
SELECT ms.* FROM momentum_scores ms
WHERE ms.score_date IN (:dates) AND ms.score >= :minScore
  AND ms.symbol IN (
    SELECT symbol FROM (
      SELECT symbol,
             COUNT(*) AS total_days,
             SUM(CASE WHEN prev_score IS NULL OR score > prev_score THEN 1 ELSE 0 END) AS inc_days
      FROM (
        SELECT symbol, score, score_date,
               LAG(score) OVER (PARTITION BY symbol ORDER BY score_date) AS prev_score
        FROM momentum_scores
        WHERE score_date IN (:dates) AND score >= :minScore
      ) windowed
      GROUP BY symbol
      HAVING total_days = :dateCount AND inc_days = :dateCount
    ) valid_symbols
  )
ORDER BY ms.symbol, ms.score_date
```

The Java layer now just groups the pre-filtered rows by symbol and builds the response.

Additionally:
- Added Caffeine cache (60-min TTL) to both services for the trending results.
- `@CacheEvict(allEntries=true)` fires on every CSV upload, ensuring stale results are never served.

---

## 7. Server-Side Sort for Trades and Analyses (F-1)

**Problem:** `TradeTable` and `AnalysisTable` sorted the current page of 20 records client-side. Sorting by "P/L" or "Date" only reflected the 20 loaded items, not the full dataset.

**Fix:**
- Sort state (`sort`, `sortDir`) moved to `TradesPage` and `AnalysisPage`.
- Passed to hooks (`useTrades`, `useAnalysis`) which forward them as query params (`sort`, `sortDir` / `sort_by`, `sort_order`).
- `TradeTable` and `AnalysisTable` now accept `sortKey`, `sortDir`, `onSort`, `onResetSort` as props — no internal state, no `useMemo` sort.
- The DB sorts the full dataset; pagination then slices it correctly.

---

## 8. Hook Dependencies Fixed: JSON.stringify → Stable Primitives (F-2)

**Problem:** `useTrades` and `useAnalysis` used `JSON.stringify(params)` as a `useCallback` dependency. Serialization is key-order-sensitive and runs on every render.

**Fix:** Both hooks now destructure primitive fields from `params` and list them individually in the dependency array: `[status, ticker, page, size, sort, sortDir]`.

---

## 9. JWT Secret Moved to Environment Variable (SEC-1)

**Problem:** JWT secret was hardcoded as a plain string in all 8 `application.yml` files, committed to the repository.

**Fix:** All 8 services now use `${JWT_SECRET:fallback}` syntax. The fallback keeps local development working without any setup. In production, set `JWT_SECRET` in the environment before starting services.

Similarly `JWT_EXPIRY_MS` and `INTERNAL_TOKEN` are now env-var driven.

---

## 10. Docker Compose Fixed: PostgreSQL → MySQL 8 (M-3)

**Problem:** `docker-compose.yml` provisioned a PostgreSQL 16 container. The application uses MySQL 8 exclusively (MySQL JDBC driver, MySQL-specific SQL, MySQL dialect). The file was non-functional.

**Fix:** Replaced with `mysql:8.0`, added `phpmyadmin` for admin UI, added health check, parameterized credentials via env vars (`DB_ROOT_PASSWORD`, `DB_USER`, `DB_PASSWORD`).

---

## 11. Bug Fix: Analysis Stats Queries Used Wrong Outcome Value

**Problem:** `AnalysisRepository.findSetupStatsByUserId` and `findTickerStatsByUserId` counted `'INCORRECT'` which never matched anything because the `AnalysisOutcome` enum uses `FAILED`. The "failed" count in stats always returned 0.

**Fix:** Replaced `'INCORRECT'` → `'FAILED'` in both JPQL stats queries.

---

## Summary of File Changes

| File | Change |
|---|---|
| `trade-service/.../entity/Trade.java` | Added @Index; status/direction/outcome → @Enumerated enums |
| `trade-service/.../entity/TradeTrail.java` | Added @Index on trade_id |
| `trade-service/.../entity/TradeRevision.java` | Added @Index on trade_id |
| `trade-service/.../repository/TradeRepository.java` | Enum param types |
| `trade-service/.../repository/TradeTrailRepository.java` | Added batch `findByTradeIdIn` query |
| `trade-service/.../service/TradeService.java` | Batch trail load; enum literals; `countTrades()` method |
| `trade-service/.../controller/TradeInternalController.java` | X-Internal-Token guard; `GET /count` endpoint |
| `trade-service/.../resources/application.yml` | JWT/internal token as env vars |
| `analysis-service/.../entity/Analysis.java` | Added @Index; outcome → @Enumerated AnalysisOutcome |
| `analysis-service/.../service/AnalysisService.java` | AnalysisOutcome enum literals |
| `analysis-service/.../resources/application.yml` | JWT as env var |
| `price-alert-service/.../entity/Alert.java` | Added @Index |
| `price-alert-service/.../client/TradeServiceClient.java` | X-Internal-Token header on calls |
| `price-alert-service/.../resources/application.yml` | JWT/internal token as env vars |
| `performance-service/pom.xml` | Added spring-boot-starter-cache + Caffeine |
| `performance-service/.../config/CacheConfig.java` | New: Caffeine cache manager, 5-min TTL |
| `performance-service/.../client/TradeServiceClient.java` | Fixed countOpenTrades; added X-Internal-Token; @Cacheable on getClosedTrades |
| `performance-service/.../service/PerformanceCalculationService.java` | @Cacheable on all 5 compute methods; @CacheEvict on forceRecompute |
| `performance-service/.../resources/application.yml` | JWT/internal token as env vars |
| `momentum-service/pom.xml` | Added spring-boot-starter-cache + Caffeine |
| `momentum-service/.../config/CacheConfig.java` | New: Caffeine cache manager, 60-min TTL |
| `momentum-service/.../repository/MomentumScoreRepository.java` | Added SQL LAG window function trending query |
| `momentum-service/.../service/MomentumService.java` | Uses SQL trending; @Cacheable + @CacheEvict on upload |
| `momentum-service/.../entity/MomentumScore.java` | Added @Index |
| `momentum-service/.../resources/application.yml` | JWT as env var |
| `rsi-service/pom.xml` | Added spring-boot-starter-cache + Caffeine |
| `rsi-service/.../config/CacheConfig.java` | New: Caffeine cache manager, 60-min TTL |
| `rsi-service/.../repository/RsiScoreRepository.java` | Added SQL LAG window function trending query |
| `rsi-service/.../service/RsiService.java` | Uses SQL trending; @Cacheable + @CacheEvict on upload |
| `rsi-service/.../entity/RsiScore.java` | Added @Index |
| `rsi-service/.../resources/application.yml` | JWT as env var |
| `api-gateway/.../resources/application.yml` | JWT as env var |
| `docker-compose.yml` | Replaced PostgreSQL with MySQL 8 + phpMyAdmin |
| `frontend/src/hooks/useTrades.js` | Stable primitive deps; sort params to API |
| `frontend/src/hooks/useAnalysis.js` | Stable primitive deps; sort params to API |
| `frontend/src/pages/TradesPage.jsx` | Sort state; passes sort to hook and table |
| `frontend/src/pages/AnalysisPage.jsx` | Sort state; passes sort to hook and table |
| `frontend/src/components/trades/TradeTable.jsx` | Removed client-side sort; accepts sort props |
| `frontend/src/components/analysis/AnalysisTable.jsx` | Removed client-side sort; accepts sort props |
