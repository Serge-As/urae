-- Eco-System 1.3.2 — durable platform-control ownership.
-- The earliest existing account becomes the initial platform owner exactly once.
-- Future owners must be added explicitly; ordinary group founders are not platform owners.
CREATE TABLE IF NOT EXISTS platform_control_owners (
  account_id TEXT PRIMARY KEY REFERENCES auth_accounts(id),
  role TEXT NOT NULL DEFAULT 'OWNER',
  created_at TEXT NOT NULL,
  source TEXT NOT NULL
);

INSERT OR IGNORE INTO platform_control_owners(account_id,role,created_at,source)
SELECT id,'OWNER',datetime('now'),'INITIAL_EARLIEST_ACCOUNT'
FROM auth_accounts
ORDER BY created_at ASC, id ASC
LIMIT 1;
