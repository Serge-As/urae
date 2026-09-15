-- Eco-System 1.3 — EcoPulse first-party engagement and recommendation learning.
-- No cross-site identifiers, no device fingerprint, no sensitive financial/health/dispute features.
CREATE TABLE IF NOT EXISTS engagement_events (
  event_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  group_id TEXT,
  item_id TEXT NOT NULL,
  item_kind TEXT NOT NULL,
  action TEXT NOT NULL,
  source TEXT NOT NULL,
  locality TEXT,
  tags_json TEXT NOT NULL,
  weight REAL NOT NULL,
  session_id TEXT,
  occurred_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_engagement_events_account_time
  ON engagement_events(account_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_events_item
  ON engagement_events(item_kind, item_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS engagement_affinities (
  account_id TEXT NOT NULL,
  dimension TEXT NOT NULL,
  affinity_value TEXT NOT NULL,
  score REAL NOT NULL,
  positive_count INTEGER NOT NULL DEFAULT 0,
  negative_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (account_id, dimension, affinity_value)
);

CREATE INDEX IF NOT EXISTS idx_engagement_affinities_account_score
  ON engagement_affinities(account_id, score DESC);

CREATE TABLE IF NOT EXISTS engagement_item_stats (
  item_kind TEXT NOT NULL,
  item_id TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  opens INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  joins INTEGER NOT NULL DEFAULT 0,
  hides INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (item_kind, item_id)
);
