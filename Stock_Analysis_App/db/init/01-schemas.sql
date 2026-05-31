-- ============================================================
-- Stock Analysis App — PostgreSQL Schema Initialization
-- Runs automatically on first Docker container start
-- ============================================================

-- ============================================================
-- SCHEMA: auth
-- ============================================================
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    username      VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth.user_roles (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role    VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','TRADER','VIEWER')),
    PRIMARY KEY (user_id, role)
);

CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token      VARCHAR(512) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_token ON auth.refresh_tokens(token);

-- ============================================================
-- SCHEMA: trade
-- ============================================================
CREATE SCHEMA IF NOT EXISTS trade;

CREATE TABLE IF NOT EXISTS trade.trades (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL,
    ticker            VARCHAR(30) NOT NULL,
    direction         VARCHAR(10) NOT NULL DEFAULT 'LONG' CHECK (direction IN ('LONG','SHORT')),
    entry_price       NUMERIC(15,4) NOT NULL,
    stop_loss         NUMERIC(15,4) NOT NULL,
    target_price      NUMERIC(15,4) NOT NULL,
    rr_ratio          NUMERIC(8,4),
    status            VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED','CANCELLED')),
    outcome           VARCHAR(20) CHECK (outcome IN ('WIN','LOSS','BREAKEVEN')),
    notes             TEXT,
    setup_type        VARCHAR(100),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at         TIMESTAMPTZ,
    actual_exit_price NUMERIC(15,4)
);
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trade.trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_ticker ON trade.trades(ticker);

CREATE TABLE IF NOT EXISTS trade.trade_revisions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id      UUID NOT NULL REFERENCES trade.trades(id) ON DELETE CASCADE,
    field_changed VARCHAR(100) NOT NULL,
    old_value     TEXT,
    new_value     TEXT,
    revised_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason        TEXT
);
CREATE INDEX IF NOT EXISTS idx_revisions_trade ON trade.trade_revisions(trade_id);

-- ============================================================
-- SCHEMA: analysis
-- ============================================================
CREATE SCHEMA IF NOT EXISTS analysis;

CREATE TABLE IF NOT EXISTS analysis.analyses (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL,
    ticker             VARCHAR(30) NOT NULL,
    setup_type         VARCHAR(100),
    thesis             TEXT,
    expected_direction VARCHAR(10) CHECK (expected_direction IN ('LONG','SHORT')),
    outcome            VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (outcome IN ('CORRECT','FAILED','PENDING')),
    analysis_date      DATE NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analyses_user   ON analysis.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_ticker ON analysis.analyses(ticker);
CREATE INDEX IF NOT EXISTS idx_analyses_setup  ON analysis.analyses(setup_type);

-- ============================================================
-- SCHEMA: pricealert
-- ============================================================
CREATE SCHEMA IF NOT EXISTS pricealert;

CREATE TABLE IF NOT EXISTS pricealert.alerts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id         UUID NOT NULL,
    user_id          UUID NOT NULL,
    ticker           VARCHAR(30) NOT NULL,
    alert_type       VARCHAR(30) NOT NULL CHECK (alert_type IN ('SL_PROXIMITY','TARGET_PROXIMITY')),
    threshold_pct    NUMERIC(6,2) NOT NULL DEFAULT 2.0,
    price_at_trigger NUMERIC(15,4),
    triggered_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    acknowledged     BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_alerts_user_ack ON pricealert.alerts(user_id, acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_trade    ON pricealert.alerts(trade_id);

-- ============================================================
-- SCHEMA: performance
-- ============================================================
CREATE SCHEMA IF NOT EXISTS performance;

CREATE TABLE IF NOT EXISTS performance.performance_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    period_type     VARCHAR(20) NOT NULL CHECK (period_type IN ('WEEKLY','MONTHLY','ALL_TIME')),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    win_count       INT NOT NULL DEFAULT 0,
    loss_count      INT NOT NULL DEFAULT 0,
    total_trades    INT NOT NULL DEFAULT 0,
    avg_rr          NUMERIC(8,4),
    strike_rate     NUMERIC(6,2),
    avg_win_rr      NUMERIC(8,4),
    avg_loss_rr     NUMERIC(8,4),
    best_setup_type VARCHAR(100),
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, period_type, period_start)
);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_period ON performance.performance_snapshots(user_id, period_type);
