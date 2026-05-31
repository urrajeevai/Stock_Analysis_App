# 2026-05-23 — Trending Report: Date Range Filter & Day-column Table

## What Changed

### Problem
The Trending Report only supported a "Last N Days" rolling window, which fetched the last N
score dates that existed in the database. There was no way to analyse a specific calendar date
range, and the results table showed scores in a compact visual "trend cell" rather than clearly
labelled Day 1 / Day 2 / Day 3 columns.

### Backend changes (`momentum-service`)

**`MomentumScoreRepository`** — added `findDatesBetween(from, to)`:
```java
@Query("SELECT DISTINCT s.scoreDate FROM MomentumScore s " +
       "WHERE s.scoreDate BETWEEN :from AND :to ORDER BY s.scoreDate ASC")
List<LocalDate> findDatesBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
```

**`MomentumService.getTrendingStocks`** — new signature accepts `LocalDate dateFrom, LocalDate dateTo`:
- When `dateFrom` + `dateTo` are both supplied → resolve dates via `findDatesBetween`
- Otherwise → use `findRecentDates(lastNDays)` as before
- Core strictly-increasing filter logic unchanged
- `buildTrendingResponse` now accepts `datesAsc` and filters raw scores to only the selected
  dates before building the daily score list (guards against stray extra rows leaking through)

**`MomentumController.getTrending`** — added optional `dateFrom` and `dateTo` query params
(ISO date format); both default to `null` and are passed straight through to the service.

### Frontend changes (`frontend/src/pages/MomentumPage.jsx`)

**TrendingTab** refactored:
- **Mode toggle** ("Last N Days" / "Date Range") — pill buttons above the filter row
- In "Last N Days" mode: same N-days selector + custom input as before
- In "Date Range" mode: From Date + To Date calendar pickers; both sent as `dateFrom`/`dateTo`
  query params
- **Results table**: replaced the single "Score Trend" cell (scores crammed into one cell) with
  individual `Day 1 … Day N` columns, each showing the score badge and a chevron-up arrow
  between consecutive days; column header also shows the actual date (e.g. "20 May")
- Removed unused `ChevronDownIcon` import and dead `dayCount` variable

## Why
Users need to identify stocks with continuously increasing momentum scores within a specific
historical date window (e.g. a known bull run period), not just the most recent N upload dates.
The Day-column layout makes it easy to scan which score appeared on which date and confirm the
upward progression at a glance.

## API Contract

```
GET /momentum/trending
  lastNDays  (int,     default 3)   — rolling window; ignored when dateFrom+dateTo supplied
  minScore   (decimal, default 60)
  dateFrom   (ISO date, optional)   — inclusive; must be paired with dateTo
  dateTo     (ISO date, optional)   — inclusive; must be paired with dateFrom
```

Response shape unchanged: `List<TrendingStockResponse>` with `dailyScores: [{date, score}]`
ordered chronologically.
