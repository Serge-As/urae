PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_user (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'fr',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_group (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  governance_model TEXT NOT NULL,
  status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(created_by) REFERENCES app_user(id)
);
CREATE INDEX IF NOT EXISTS idx_group_tenant ON tenant_group(tenant_id, id);

CREATE TABLE IF NOT EXISTS membership (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  roles_json TEXT NOT NULL,
  status TEXT NOT NULL,
  joined_at TEXT,
  historical_joined_at TEXT,
  historical_tenure_status TEXT,
  FOREIGN KEY(group_id) REFERENCES tenant_group(id),
  FOREIGN KEY(user_id) REFERENCES app_user(id)
);
CREATE INDEX IF NOT EXISTS idx_membership_scope ON membership(tenant_id, group_id, user_id);

CREATE TABLE IF NOT EXISTS mandate (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  subject_user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  permissions_json TEXT NOT NULL,
  financial_limit INTEGER,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_mandate_scope ON mandate(tenant_id, group_id, subject_user_id);

CREATE TABLE IF NOT EXISTS group_project (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  governance_model TEXT NOT NULL,
  member_count INTEGER NOT NULL,
  sessions INTEGER NOT NULL,
  currency TEXT NOT NULL,
  nominal_contribution INTEGER NOT NULL,
  management_fee INTEGER NOT NULL,
  estimated_external_cost_rate REAL NOT NULL,
  fixed_operating_cost_per_session INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_project_scope ON group_project(tenant_id, id);

CREATE TABLE IF NOT EXISTS obligation (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT,
  assignee_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  due_at TEXT,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  currency TEXT,
  amount INTEGER
);
CREATE INDEX IF NOT EXISTS idx_obligation_inbox ON obligation(tenant_id, assignee_id, status, due_at);

CREATE TABLE IF NOT EXISTS evidence_record (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT,
  data_json TEXT NOT NULL,
  immutable INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS case_record (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT,
  type TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  status TEXT NOT NULL,
  opened_by TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  summary TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_case_scope ON case_record(tenant_id, group_id, status);

CREATE TABLE IF NOT EXISTS audit_event (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  request_id TEXT,
  before_json TEXT,
  after_json TEXT,
  metadata_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_scope ON audit_event(tenant_id, at, target_type, target_id);

-- Le ledger financier réel sera créé dans une migration P2 dédiée après qualification de la fondation.
