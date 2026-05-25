CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  deployment_model TEXT NOT NULL CHECK (deployment_model IN ('saas', 'dedicated', 'customer_vpc')),
  kms_key_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'offboarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE funds (
  fund_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  fund_name TEXT NOT NULL,
  fund_type TEXT NOT NULL,
  base_currency CHAR(3) NOT NULL,
  strategy TEXT NOT NULL,
  nav_frequency TEXT NOT NULL,
  fiscal_year_end TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  email CITEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Analyst', 'Senior Reviewer', 'Fund Controller', 'Tenant Admin', 'Auditor')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE fund_user_access (
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  fund_id UUID NOT NULL REFERENCES funds(fund_id),
  user_id UUID NOT NULL REFERENCES users(user_id),
  approval_limit_bps NUMERIC(12,4) NOT NULL DEFAULT 0,
  can_make BOOLEAN NOT NULL DEFAULT true,
  can_check BOOLEAN NOT NULL DEFAULT false,
  can_publish_nav BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (tenant_id, fund_id, user_id)
);

CREATE TABLE position_reconciliation_breaks (
  break_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  fund_id UUID NOT NULL REFERENCES funds(fund_id),
  nav_date DATE NOT NULL,
  isin TEXT,
  ticker TEXT,
  asset_type TEXT NOT NULL,
  internal_quantity NUMERIC(28,8) NOT NULL,
  custodian_quantity NUMERIC(28,8) NOT NULL,
  prime_broker_quantity NUMERIC(28,8),
  quantity_difference NUMERIC(28,8) GENERATED ALWAYS AS (internal_quantity - custodian_quantity) STORED,
  local_market_value NUMERIC(28,8),
  base_market_value NUMERIC(28,8),
  materiality_amount NUMERIC(28,8),
  materiality_bps NUMERIC(12,4),
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  status TEXT NOT NULL CHECK (status IN ('Open', 'Investigating', 'Escalated', 'Resolved', 'Approved', 'Closed')),
  owner_user_id UUID REFERENCES users(user_id),
  age_days INT NOT NULL DEFAULT 0,
  root_cause TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_approvals (
  approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  fund_id UUID NOT NULL REFERENCES funds(fund_id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  proposed_action JSONB NOT NULL,
  nav_impact NUMERIC(28,8) NOT NULL DEFAULT 0,
  gl_impact JSONB NOT NULL DEFAULT '{}'::jsonb,
  maker_user_id UUID NOT NULL REFERENCES users(user_id),
  checker_user_id UUID REFERENCES users(user_id),
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Posted')),
  maker_comment TEXT,
  checker_comment TEXT,
  digital_signature TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT maker_checker_different CHECK (checker_user_id IS NULL OR maker_user_id <> checker_user_id)
);

CREATE TABLE immutable_audit_trail (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  fund_id UUID REFERENCES funds(fund_id),
  actor_user_id UUID NOT NULL REFERENCES users(user_id),
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  approval_status TEXT,
  maker_user_id UUID,
  checker_user_id UUID,
  ip_address INET,
  user_agent TEXT,
  request_id UUID NOT NULL,
  previous_hash TEXT,
  event_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ingestion_file_batches (
  file_batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  fund_id UUID REFERENCES funds(fund_id),
  source_system TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('CSV', 'XLSX', 'JSON', 'SWIFT_MT515', 'SWIFT_MT548', 'SFTP_DUMP')),
  checksum_sha256 TEXT NOT NULL,
  object_uri TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Landed', 'Parsing', 'Validated', 'Partially Accepted', 'Rejected', 'Posted')),
  row_count INT NOT NULL DEFAULT 0,
  rejected_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, checksum_sha256)
);

CREATE TABLE ingestion_dead_letter_queue (
  dlq_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  fund_id UUID REFERENCES funds(fund_id),
  file_batch_id UUID REFERENCES ingestion_file_batches(file_batch_id),
  source_system TEXT,
  record_payload JSONB,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Info', 'Warning', 'Critical')),
  retry_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('Open', 'Reprocessed', 'Rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'immutable_audit_trail is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER immutable_audit_no_update
BEFORE UPDATE OR DELETE ON immutable_audit_trail
FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

CREATE OR REPLACE FUNCTION compute_audit_hash()
RETURNS trigger AS $$
DECLARE
  prev TEXT;
BEGIN
  SELECT event_hash INTO prev
  FROM immutable_audit_trail
  WHERE tenant_id = NEW.tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  NEW.previous_hash := COALESCE(NEW.previous_hash, prev, 'GENESIS');
  NEW.event_hash := encode(digest(
    COALESCE(NEW.previous_hash, '') ||
    NEW.tenant_id::text ||
    COALESCE(NEW.fund_id::text, '') ||
    NEW.actor_user_id::text ||
    NEW.action_type ||
    NEW.entity_type ||
    COALESCE(NEW.entity_id::text, '') ||
    COALESCE(NEW.old_value::text, '') ||
    COALESCE(NEW.new_value::text, '') ||
    NEW.created_at::text,
    'sha256'
  ), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER immutable_audit_hash
BEFORE INSERT ON immutable_audit_trail
FOR EACH ROW EXECUTE FUNCTION compute_audit_hash();

ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_user_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_reconciliation_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE immutable_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_file_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_dead_letter_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_funds ON funds USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_users ON users USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_access ON fund_user_access USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_position_breaks ON position_reconciliation_breaks USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_approvals ON workflow_approvals USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_audit ON immutable_audit_trail USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_ingestion_batches ON ingestion_file_batches USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_dlq ON ingestion_dead_letter_queue USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE INDEX idx_position_breaks_tenant_fund_date ON position_reconciliation_breaks (tenant_id, fund_id, nav_date DESC);
CREATE INDEX idx_position_breaks_status_severity ON position_reconciliation_breaks (tenant_id, status, severity);
CREATE INDEX idx_workflow_approvals_queue ON workflow_approvals (tenant_id, fund_id, status, created_at DESC);
CREATE INDEX idx_audit_tenant_created ON immutable_audit_trail (tenant_id, created_at DESC);
CREATE INDEX idx_ingestion_batch_status ON ingestion_file_batches (tenant_id, status, created_at DESC);
