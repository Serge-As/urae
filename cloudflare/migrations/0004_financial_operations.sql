-- Additive transaction arbitration. Historical records remain untouched.
CREATE TABLE IF NOT EXISTS financial_operations (
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  operation_kind TEXT NOT NULL CHECK (operation_kind IN ('contribution', 'reversal')),
  idempotency_key TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  operation_json TEXT NOT NULL CHECK (json_valid(operation_json)),
  PRIMARY KEY (tenant_id, group_id, operation_kind, idempotency_key)
);
