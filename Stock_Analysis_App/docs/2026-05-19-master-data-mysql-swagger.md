# Change Log — 2026-05-19 (Master Data + MySQL + Swagger)

## What Changed

This update redesigned the auth model, added Stock/Role master data tables,
migrated the database from H2 in-memory to MySQL, and enabled Swagger UI across all services.

---

## Changes Made

### 1. Database: H2 → MySQL

**What changed:** All 5 backend services now connect to MySQL 8.0 (`stock_analysis` schema)
instead of H2 in-memory.

**Why:** Persistent data between service restarts. User-provided MySQL instance at
localhost:3306 with credentials root/root.

**How applied:**
- Replaced `com.h2database:h2` with `com.mysql:mysql-connector-j` in all service pom.xml files
- Updated all `application.yml` datasource URLs to `jdbc:mysql://localhost:3306/stock_analysis`
- Set `spring.jpa.hibernate.ddl-auto: update` (tables auto-created on startup)
- Added `hibernate.type.preferred_uuid_jdbc_type: VARCHAR` to fix Hibernate 6 UUID binary
  storage issue — MySQL needs UUIDs as VARCHAR(36), not BINARY(16)

---

### 2. Role Master Data (new table)

**What changed:** Replaced `@ElementCollection Set<String> roles` in User entity with a
proper `roles` table and `@ManyToOne Role role` relationship.

**New table: `roles`**
```sql
CREATE TABLE roles (
    role_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL
);
-- Seeded on startup: ADMIN, TRADER, VIEWER
```

**New APIs (auth-service, port 8081):**
```
GET  /roles          → List all roles (public, no auth)
GET  /roles/{id}     → Get by ID
POST /roles          → Create (ADMIN only)
PUT  /roles/{id}     → Update (ADMIN only)
DELETE /roles/{id}   → Delete (ADMIN only)
```
Accessible via gateway at `/api/roles/**`.

**Why:** Roles were hardcoded strings in the User ElementCollection. A proper FK relationship
allows role management at runtime without code changes (e.g., adding an ANALYST role).

---

### 3. User Entity Redesign

**What changed:** User entity expanded with new fields, password hash column renamed.

**New `users` table columns:**
```sql
id           VARCHAR(36) PK   -- UUID, previously the same
name         VARCHAR(100)     -- NEW: full name
email        VARCHAR(255)     -- unchanged
username     VARCHAR(100)     -- unchanged
password     VARCHAR(255)     -- renamed from password_hash
mobile       VARCHAR(20)      -- NEW: phone number
role_id      BIGINT FK        -- NEW: FK to roles.role_id (replaces user_roles join table)
active       BOOLEAN
created_time DATETIME         -- renamed from created_at
updated_time DATETIME         -- renamed from updated_at
```

**New registration payload:**
```json
{
  "name": "Rajeev Sharma",
  "username": "rajeev",
  "email": "rajeev@example.com",
  "password": "Pass@123",
  "mobile": "9876543210",
  "roleName": "TRADER"
}
```

**Auto-seeded admin user on first startup:**
- Email: `admin@stockapp.com`
- Password: `Admin@123`
- Role: ADMIN

**Why:** The user profile needed richer data for a real-world trading app (name for display,
mobile for future SMS alerts). The role FK allows proper relational integrity.

---

### 4. Stock Master Data (new entity)

**What changed:** Added `stocks` table to trade-service with full CRUD API.

**New table: `stocks`**
```sql
CREATE TABLE stocks (
    stock_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
    name         VARCHAR(100)        -- "Reliance Industries"
    symbol       VARCHAR(30) UNIQUE  -- "RELIANCE.NS"
    exchange     VARCHAR(20)         -- "NSE", "BSE", "NASDAQ"
    active       BOOLEAN DEFAULT 1
    created_time DATETIME
    updated_time DATETIME
);
```

**25 stocks pre-seeded on first startup** (NSE, BSE, NASDAQ instruments).

**New APIs (trade-service, port 8082):**
```
GET  /stocks               → List all (?activeOnly=true for active only) — PUBLIC
GET  /stocks/search?q=     → Search by name or symbol — PUBLIC
GET  /stocks/{id}          → Get by ID — PUBLIC
GET  /stocks/symbol/{sym}  → Get by ticker symbol — PUBLIC
POST /stocks               → Create (TRADER/ADMIN)
PUT  /stocks/{id}          → Update (TRADER/ADMIN)
DELETE /stocks/{id}        → Delete (ADMIN)
```
Accessible via gateway at `/api/stocks/**`.

**Trade entity update:** `trades.stock_id BIGINT` column added (nullable FK to stocks).
When creating a trade, pass `stockId` alongside `ticker`. The ticker remains a denormalized
string for backward compatibility and display.

**Why:** Previously tickers were free-text strings (e.g. "RELIANCE.NS"). Master data allows
dropdown selection in forms, prevents typos, enables consistent referencing across trades and
analyses, and supports future features like sector-based grouping.

---

### 5. Swagger UI — All Services

**What changed:** Added OpenAPI 3 configuration beans to all 5 services with:
- Service-specific title and description
- JWT Bearer authentication scheme (click "Authorize" → paste token)
- `@Tag` and `@Operation` annotations on all controllers

**Swagger UI URLs:**
| Service | URL |
|---|---|
| Auth (Users, Roles) | http://localhost:8081/swagger-ui.html |
| Trade + Stocks | http://localhost:8082/swagger-ui.html |
| Analysis | http://localhost:8083/swagger-ui.html |
| Price & Alerts | http://localhost:8084/swagger-ui.html |
| Performance | http://localhost:8085/swagger-ui.html |

**How to use Swagger for testing:**
1. Open any Swagger URL
2. Use `POST /auth/login` to get a token (or in auth-service swagger directly)
3. Click the "Authorize 🔓" button at the top right
4. Enter: `<your JWT token>` (no "Bearer " prefix needed in the field)
5. All authenticated endpoints now work from the UI

**Why:** The requirement was to enable API testing from Swagger without needing curl or Postman.

---

### 6. Frontend Updates

**New pages:**
- `/stocks` — Stock master data CRUD table (search, filter active, add/edit/delete)
- `/roles` — Role master data table (ADMIN can add/edit/delete)

**Updated pages:**
- `/register` — Now includes Name, Mobile, Role dropdown (fetched from /api/roles)
- `/admin` — Full user table with name, mobile, role, createdTime; edit modal with role dropdown

**Updated components:**
- `TradeForm` — Stock picker dropdown; selecting a stock auto-fills the ticker and stores stockId
- `AnalysisForm` — Same stock picker pattern
- `Sidebar` — Added Stocks and Roles nav items

---

## Technical Notes

### UUID storage fix for MySQL (Hibernate 6)
Hibernate 6 defaults to `BINARY(16)` for UUID storage in MySQL, causing
`Incorrect string value` errors. Fixed by adding to all application.yml:
```yaml
spring.jpa.properties.hibernate.type.preferred_uuid_jdbc_type: VARCHAR
```
All entity UUID fields also have `columnDefinition = "VARCHAR(36)"` as explicit override.

### Gateway public GET paths
`/api/stocks` and `/api/roles` GET requests bypass JWT validation in `JwtGatewayFilter`
since stock/role master data should be readable without authentication (for the register
form role dropdown and trade form stock picker).

### Single-role model
Users now have ONE role (ManyToOne FK) instead of a Set<String>. The JWT `roles` claim
still uses a List for compatibility with `JwtAuthFilter`'s `@PreAuthorize` checks.
