ALTER TABLE risk_records ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_risk_records_deleted ON risk_records(deleted);