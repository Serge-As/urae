-- Additive widening of the financial operation arbitration contract.
-- Keep the historical table untouched for rollback/forensics, seed the new
-- owner with all existing operations, and route new commits through v2.
CREATE TABLE IF NOT EXISTS financial_operations_v2 (
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  operation_kind TEXT NOT NULL CHECK (operation_kind IN (
    'contribution','reversal','cash_in','cash_out','loan_disbursement',
    'loan_repayment','tontine_benefit','opening_balance','transfer'
  )),
  idempotency_key TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  operation_json TEXT NOT NULL CHECK (json_valid(operation_json)),
  PRIMARY KEY (tenant_id, group_id, operation_kind, idempotency_key)
);

INSERT OR IGNORE INTO financial_operations_v2
  (tenant_id,group_id,operation_kind,idempotency_key,entry_id,operation_json)
SELECT tenant_id,group_id,operation_kind,idempotency_key,entry_id,operation_json
FROM financial_operations;
