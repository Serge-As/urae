-- Eco-System 1.3 — standalone interest communities (Meetup-style).
-- These communities are intentionally independent from financial groups and their ledgers.
CREATE TABLE IF NOT EXISTS interest_communities (
  community_id TEXT PRIMARY KEY,
  creator_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  locality TEXT,
  visibility TEXT NOT NULL CHECK(visibility IN ('PUBLIC','PRIVATE')),
  join_policy TEXT NOT NULL CHECK(join_policy IN ('OPEN','REQUEST')),
  tags_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('ACTIVE','ARCHIVED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_interest_communities_discovery
  ON interest_communities(status,visibility,locality,updated_at);

CREATE TABLE IF NOT EXISTS interest_community_members (
  community_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('CREATOR','MODERATOR','MEMBER')),
  status TEXT NOT NULL CHECK(status IN ('ACTIVE','LEFT','BANNED')),
  joined_at TEXT NOT NULL,
  PRIMARY KEY(community_id,account_id)
);
CREATE INDEX IF NOT EXISTS idx_interest_community_members_account
  ON interest_community_members(account_id,status);

CREATE TABLE IF NOT EXISTS interest_community_join_requests (
  request_id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL CHECK(status IN ('PENDING','APPROVED','REJECTED','WITHDRAWN')),
  created_at TEXT NOT NULL,
  decided_at TEXT,
  decided_by TEXT,
  UNIQUE(community_id,account_id,status)
);
CREATE INDEX IF NOT EXISTS idx_interest_community_join_requests
  ON interest_community_join_requests(community_id,status,created_at);

CREATE TABLE IF NOT EXISTS interest_community_content (
  content_id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL,
  author_account_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('POST','EVENT','PLACE','OFFER','REQUEST')),
  title TEXT,
  body TEXT NOT NULL,
  category TEXT,
  locality TEXT,
  starts_at TEXT,
  ends_at TEXT,
  metadata_json TEXT NOT NULL,
  moderation_state TEXT NOT NULL CHECK(moderation_state IN ('PUBLISHED','HIDDEN')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_interest_community_content_feed
  ON interest_community_content(community_id,moderation_state,created_at);
CREATE INDEX IF NOT EXISTS idx_interest_community_content_place
  ON interest_community_content(kind,locality,category,created_at);
