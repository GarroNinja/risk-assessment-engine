CREATE TABLE IF NOT EXISTS audit_log (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type  VARCHAR(100) NOT NULL,
    entity_id    BIGINT       NOT NULL,
    action       VARCHAR(20)  NOT NULL,
    old_value    VARCHAR(5000),
    new_value    VARCHAR(5000),
    performed_by VARCHAR(150),
    performed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_by     ON audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_at     ON audit_log(performed_at);