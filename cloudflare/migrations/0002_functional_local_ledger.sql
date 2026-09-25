PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meeting_session (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  opened_by TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  scheduled_at TEXT,
  closed_at TEXT,
  FOREIGN KEY(group_id) REFERENCES tenant_group(id)
);
CREATE INDEX IF NOT EXISTS idx_meeting_scope ON meeting_session(tenant_id, group_id, opened_at);

CREATE TABLE IF NOT EXISTS ledger_account (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name_code TEXT NOT NULL,
  type TEXT NOT NULL,
  currency TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(group_id) REFERENCES tenant_group(id),
  UNIQUE(tenant_id, group_id, code, currency)
);
CREATE INDEX IF NOT EXISTS idx_ledger_account_scope ON ledger_account(tenant_id, group_id, currency);

CREATE TABLE IF NOT EXISTS ledger_entry (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  description_code TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  meeting_id TEXT,
  reversal_of_entry_id TEXT,
  FOREIGN KEY(group_id) REFERENCES tenant_group(id),
  FOREIGN KEY(meeting_id) REFERENCES meeting_session(id),
  FOREIGN KEY(reversal_of_entry_id) REFERENCES ledger_entry(id),
  UNIQUE(tenant_id, group_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_scope ON ledger_entry(tenant_id, group_id, created_at);

CREATE TABLE IF NOT EXISTS ledger_line (
  entry_id TEXT NOT NULL,
  line_no INTEGER NOT NULL,
  account_id TEXT NOT NULL,
  debit INTEGER NOT NULL DEFAULT 0 CHECK(debit >= 0),
  credit INTEGER NOT NULL DEFAULT 0 CHECK(credit >= 0),
  memo_code TEXT,
  PRIMARY KEY(entry_id, line_no),
  FOREIGN KEY(entry_id) REFERENCES ledger_entry(id),
  FOREIGN KEY(account_id) REFERENCES ledger_account(id),
  CHECK((debit = 0 AND credit > 0) OR (credit = 0 AND debit > 0))
);
CREATE INDEX IF NOT EXISTS idx_ledger_line_account ON ledger_line(account_id, entry_id);

CREATE TABLE IF NOT EXISTS contribution_receipt (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  membership_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount > 0),
  payment_method TEXT NOT NULL,
  ledger_entry_id TEXT NOT NULL,
  meeting_id TEXT,
  received_at TEXT NOT NULL,
  received_by TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  FOREIGN KEY(group_id) REFERENCES tenant_group(id),
  FOREIGN KEY(membership_id) REFERENCES membership(id),
  FOREIGN KEY(ledger_entry_id) REFERENCES ledger_entry(id),
  FOREIGN KEY(meeting_id) REFERENCES meeting_session(id),
  UNIQUE(tenant_id, group_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_receipt_scope ON contribution_receipt(tenant_id, group_id, received_at);

CREATE TABLE IF NOT EXISTS cashbox_reconciliation (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  meeting_id TEXT,
  currency TEXT NOT NULL,
  opening_cash INTEGER NOT NULL,
  cash_in INTEGER NOT NULL,
  cash_out INTEGER NOT NULL,
  theoretical_closing INTEGER NOT NULL,
  counted_closing INTEGER NOT NULL,
  variance INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  FOREIGN KEY(group_id) REFERENCES tenant_group(id),
  FOREIGN KEY(meeting_id) REFERENCES meeting_session(id)
);
CREATE INDEX IF NOT EXISTS idx_cashbox_scope ON cashbox_reconciliation(tenant_id, group_id, created_at);

-- Important: application code must verify that total debit == total credit before a ledger entry is committed.
-- The future D1 repository should write ledger_entry + ledger_line + receipt inside one D1 batch/transaction boundary.
