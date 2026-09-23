-- Eco-System 1.5.0 — direct referral campaign budgets.
-- No multi-level chain is represented: one direct referrer per verified conversion.
CREATE TABLE IF NOT EXISTS referral_campaign_budgets (
  campaign_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  owner_account_id TEXT NOT NULL,
  budget_total INTEGER NOT NULL CHECK(budget_total >= 0),
  reserved_amount INTEGER NOT NULL DEFAULT 0 CHECK(reserved_amount >= 0),
  spent_amount INTEGER NOT NULL DEFAULT 0 CHECK(spent_amount >= 0),
  reward_per_conversion INTEGER NOT NULL DEFAULT 0 CHECK(reward_per_conversion >= 0),
  state TEXT NOT NULL CHECK(state IN ('DRAFT','ACTIVE','PAUSED','DONE')),
  updated_at TEXT NOT NULL,
  CHECK(reserved_amount + spent_amount <= budget_total)
);
CREATE INDEX IF NOT EXISTS idx_referral_campaign_budget_owner
  ON referral_campaign_budgets(tenant_id,owner_account_id,state);

CREATE TABLE IF NOT EXISTS referral_reward_reservations (
  conversion_id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount >= 0),
  state TEXT NOT NULL CHECK(state IN ('RESERVED','APPROVED','CANCELLED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_referral_reward_campaign
  ON referral_reward_reservations(campaign_id,state);
