-- Additive read indexes only. No canonical value, record or history is rewritten.
CREATE INDEX IF NOT EXISTS idx_platform_workspace_module ON platform_records(record_type,tenant_id,json_extract(data_json,'$.moduleId'),group_id) WHERE record_type='workspace_record';
CREATE INDEX IF NOT EXISTS idx_platform_public_group ON platform_records(record_type,json_extract(data_json,'$.groupId')) WHERE record_type='public_group_listing';
