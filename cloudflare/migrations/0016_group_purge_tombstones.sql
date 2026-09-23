-- Eco-System 1.5.0 — privacy-safe group purge tombstones.
-- A tombstone contains no group name, member identity, finance, document or raw group id.
CREATE TABLE IF NOT EXISTS purged_group_tombstones (
  scope_hash TEXT PRIMARY KEY,
  purged_at TEXT NOT NULL,
  deletion_hash TEXT NOT NULL,
  purge_policy_version TEXT NOT NULL
);
