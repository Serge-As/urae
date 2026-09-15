-- Eco-System 1.3 — privacy-safe collective learning observatory.
-- Additive only. No tenant, group, member, financial balance, contact, health or dispute identifiers.
CREATE TABLE IF NOT EXISTS collective_learning_signals (
  signal_id TEXT PRIMARY KEY,
  group_token TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN (
    'MEETING_RHYTHM','RUBRIC_PATTERN','OPERATING_PRACTICE',
    'UX_PREFERENCE','MARKET_INTEREST','COMMUNITY_INTEREST'
  )),
  signal_key TEXT NOT NULL,
  signal_value TEXT NOT NULL,
  confidence REAL NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
  source_fingerprint TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  UNIQUE(group_token, category, signal_key, signal_value)
);

CREATE INDEX IF NOT EXISTS idx_collective_learning_pattern
  ON collective_learning_signals(category, signal_key, signal_value);
CREATE INDEX IF NOT EXISTS idx_collective_learning_group
  ON collective_learning_signals(group_token, last_seen_at);
