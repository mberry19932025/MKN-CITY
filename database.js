const { Pool } = require('pg');

let pool;

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      max: 5
    });
  }
  return pool;
}

async function initializeDatabase() {
  const database = getPool();
  if (!database) return false;
  await database.query(`
    CREATE TABLE IF NOT EXISTS ledger_events (
      id BIGSERIAL PRIMARY KEY,
      provider TEXT NOT NULL,
      provider_event_id TEXT NOT NULL,
      external_account_id TEXT,
      business_id TEXT,
      direction TEXT NOT NULL CHECK (direction IN ('revenue', 'expense')),
      status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'reversed')),
      amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
      currency CHAR(3) NOT NULL DEFAULT 'USD',
      description TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL,
      received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      raw_reference JSONB NOT NULL DEFAULT '{}'::jsonb,
      UNIQUE (provider, provider_event_id)
    );
    CREATE INDEX IF NOT EXISTS ledger_events_status_idx ON ledger_events (status, occurred_at DESC);
  `);
  return true;
}

async function recordLedgerEvent(event) {
  const database = getPool();
  if (!database) throw new Error('Database is not configured.');
  const result = await database.query(`
    INSERT INTO ledger_events (
      provider, provider_event_id, external_account_id, business_id,
      direction, status, amount_cents, currency, description, occurred_at, raw_reference
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (provider, provider_event_id) DO NOTHING
    RETURNING id
  `, [
    event.provider,
    event.providerEventId,
    event.externalAccountId || null,
    event.businessId || null,
    event.direction,
    event.status,
    event.amountCents,
    event.currency,
    event.description,
    event.occurredAt,
    JSON.stringify(event.rawReference || {})
  ]);
  return { inserted: result.rowCount === 1, id: result.rows[0]?.id || null };
}

async function getEconomySummary() {
  const database = getPool();
  if (!database) return null;
  const totals = await database.query(`
    SELECT
      COALESCE(SUM(CASE WHEN status = 'verified' AND direction = 'revenue' THEN amount_cents ELSE 0 END), 0) AS verified_revenue,
      COALESCE(SUM(CASE WHEN status = 'verified' AND direction = 'expense' THEN amount_cents ELSE 0 END), 0) AS verified_expenses,
      COALESCE(SUM(CASE WHEN status = 'pending' AND direction = 'revenue' THEN amount_cents ELSE 0 END), 0) AS pending_revenue,
      COALESCE(SUM(CASE WHEN status = 'pending' AND direction = 'expense' THEN amount_cents ELSE 0 END), 0) AS pending_expenses
    FROM ledger_events
  `);
  const recent = await database.query(`
    SELECT provider, provider_event_id, business_id, direction, status, amount_cents, currency, description, occurred_at
    FROM ledger_events
    ORDER BY occurred_at DESC, id DESC
    LIMIT 20
  `);
  const row = totals.rows[0];
  return {
    verifiedRevenueCents: Number(row.verified_revenue),
    verifiedExpensesCents: Number(row.verified_expenses),
    verifiedProfitCents: Number(row.verified_revenue) - Number(row.verified_expenses),
    pendingRevenueCents: Number(row.pending_revenue),
    pendingExpensesCents: Number(row.pending_expenses),
    recent: recent.rows.map((event) => ({ ...event, amount_cents: Number(event.amount_cents) }))
  };
}

module.exports = { getPool, initializeDatabase, recordLedgerEvent, getEconomySummary };
