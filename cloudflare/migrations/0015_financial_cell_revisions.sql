-- Eco-System 1.5.0 — additive CAS for financial cells.
-- Does not rewrite historical ledger rows or the existing financial_operations table.

CREATE TABLE IF NOT EXISTS financial_cell_revisions (
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  meeting_id TEXT NOT NULL,
  membership_id TEXT NOT NULL,
  rubric_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 0),
  last_operation_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, group_id, meeting_id, membership_id, rubric_id, currency)
);

CREATE INDEX IF NOT EXISTS idx_financial_cell_revisions_group
  ON financial_cell_revisions(tenant_id, group_id, meeting_id);

CREATE TABLE IF NOT EXISTS financial_correction_operations (
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  primary_entry_id TEXT NOT NULL,
  operation_json TEXT NOT NULL CHECK (json_valid(operation_json)),
  created_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, group_id, idempotency_key)
);

-- A failed CAS must make D1.batch() fail rather than silently committing only
-- a subset. The NOT NULL guard is populated from the correction operation row.
CREATE TABLE IF NOT EXISTS financial_correction_commit_guards (
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, group_id, idempotency_key)
);
