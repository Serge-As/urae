-- Eco-System 1.3 — first-party commercial preference consent/token.
-- The browser cookie contains only an opaque random token. No affinity is stored in the cookie.
CREATE TABLE IF NOT EXISTS commercial_preference_consents (
  account_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  granted INTEGER NOT NULL CHECK(granted IN (0,1)),
  version INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (account_id, group_id)
);

CREATE TABLE IF NOT EXISTS commercial_preference_tokens (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_commercial_preference_tokens_owner
  ON commercial_preference_tokens(account_id, group_id, expires_at);
