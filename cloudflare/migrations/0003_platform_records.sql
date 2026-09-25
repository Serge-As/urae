-- Eco-System 0.5.1 recovery — additive pilot document store behind PlatformRepository.
-- No destructive DDL. Raw founder archives/PII are not seeded here.
CREATE TABLE IF NOT EXISTS platform_records (
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  tenant_id TEXT,
  group_id TEXT,
  assignee_id TEXT,
  idempotency_key TEXT,
  data_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (record_type, record_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_records_scope
  ON platform_records(record_type, tenant_id, group_id);
CREATE INDEX IF NOT EXISTS idx_platform_records_assignee
  ON platform_records(record_type, tenant_id, assignee_id);
CREATE INDEX IF NOT EXISTS idx_platform_records_idempotency
  ON platform_records(record_type, tenant_id, group_id, idempotency_key);
