-- Eco-System 1.3.2 — founder/control supervision registry.
-- Additive only. No user financial data is duplicated here.
CREATE TABLE IF NOT EXISTS founder_control_items (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL,
  item_key TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(item_type,item_key)
);
CREATE INDEX IF NOT EXISTS idx_founder_control_type_status ON founder_control_items(item_type,status,updated_at);
