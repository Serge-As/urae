-- Eco-System 1.3.2 — scalable forum state, drafts, read cursors and reactions.
CREATE TABLE IF NOT EXISTS community_messages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  hub_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  parent_id TEXT,
  root_id TEXT,
  kind TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  moderation_state TEXT NOT NULL DEFAULT 'PUBLISHED',
  created_at TEXT NOT NULL,
  edited_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_community_messages_hub_time ON community_messages(tenant_id,group_id,hub_id,created_at,id);
CREATE INDEX IF NOT EXISTS idx_community_messages_thread ON community_messages(root_id,created_at,id);

CREATE TABLE IF NOT EXISTS community_user_state (
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  hub_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  draft_title TEXT NOT NULL DEFAULT '',
  draft_body TEXT NOT NULL DEFAULT '',
  last_read_message_id TEXT,
  last_read_at TEXT,
  anchor_message_id TEXT,
  anchor_ratio REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(tenant_id,group_id,hub_id,user_id)
);

CREATE TABLE IF NOT EXISTS community_reactions (
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  reaction TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(message_id,user_id,reaction)
);
CREATE INDEX IF NOT EXISTS idx_community_reactions_message ON community_reactions(message_id,reaction);
