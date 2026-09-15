-- 0011_identity_proof_matching.sql
-- Optional CNI-based exact matching. Raw CNI values are never stored in these tables.
CREATE TABLE IF NOT EXISTS identity_proof_tokens (
  proof_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  proof_type TEXT NOT NULL,
  identifier_hash TEXT NOT NULL,
  verification_state TEXT NOT NULL DEFAULT 'CLAIMED',
  source_ref TEXT,
  created_at TEXT NOT NULL,
  verified_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_identity_proof_account_type_hash
  ON identity_proof_tokens(account_id, proof_type, identifier_hash);
CREATE INDEX IF NOT EXISTS idx_identity_proof_hash
  ON identity_proof_tokens(proof_type, identifier_hash);

CREATE TABLE IF NOT EXISTS historical_identity_hints (
  hint_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  membership_id TEXT NOT NULL,
  proof_type TEXT NOT NULL,
  identifier_hash TEXT NOT NULL,
  verification_state TEXT NOT NULL DEFAULT 'MANAGER_RECORDED',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  verified_by TEXT,
  verified_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_historical_identity_hint_membership_type
  ON historical_identity_hints(tenant_id, group_id, membership_id, proof_type);
CREATE INDEX IF NOT EXISTS idx_historical_identity_hint_hash
  ON historical_identity_hints(proof_type, identifier_hash);
