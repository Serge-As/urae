-- Eco-System 1.5.0 — atomic purge/reconstitution arbitration.
-- Temporary execution guards prevent a purge transaction from winning after the
-- qualifying petition signature has already been committed.
CREATE TABLE IF NOT EXISTS group_purge_execution_guards (
  scope_hash TEXT PRIMARY KEY,
  allowed INTEGER NOT NULL CHECK(allowed=1),
  created_at TEXT NOT NULL
);
