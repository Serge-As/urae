-- Eco-System 1.3 — secure group/member pairing.
-- Additive only. Invite and pairing codes are stored as hashes, never in plaintext.
CREATE TABLE IF NOT EXISTS group_join_links (
  token_hash TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('AUTO_JOIN','HISTORICAL_MATCH')),
  label TEXT,
  max_uses INTEGER NOT NULL CHECK(max_uses >= 1),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK(used_count >= 0),
  expires_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_group_join_links_group ON group_join_links(tenant_id,group_id,expires_at);

CREATE TABLE IF NOT EXISTS member_pairing_codes (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_member_pairing_codes_account ON member_pairing_codes(account_id,expires_at);

CREATE TABLE IF NOT EXISTS historical_pairing_requests (
  request_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PENDING','APPROVED','REJECTED')),
  membership_id TEXT,
  created_at TEXT NOT NULL,
  decided_at TEXT,
  decided_by TEXT,
  decision_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_historical_pairing_requests_group ON historical_pairing_requests(tenant_id,group_id,status);
CREATE INDEX IF NOT EXISTS idx_historical_pairing_requests_account ON historical_pairing_requests(account_id,status);
