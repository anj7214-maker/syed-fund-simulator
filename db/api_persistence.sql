create table if not exists api_workflow_approvals (
  approval_id uuid primary key,
  tenant_id uuid not null,
  fund_id uuid not null,
  entity_type text not null,
  entity_id text not null,
  proposed_action jsonb not null,
  nav_impact numeric not null default 0,
  gl_impact jsonb not null default '{}'::jsonb,
  maker_user_id text not null,
  checker_user_id text,
  status text not null,
  maker_comment text,
  checker_comment text,
  digital_signature text,
  submitted_at timestamptz,
  approved_at timestamptz,
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists api_gl_postings (
  posting_id uuid primary key,
  tenant_id uuid not null,
  fund_id uuid not null,
  approval_id uuid not null references api_workflow_approvals(approval_id),
  source_entity_type text not null,
  source_entity_id text not null,
  memo text not null,
  lines jsonb not null,
  nav_impact numeric not null default 0,
  posted_by text not null,
  posted_at timestamptz not null
);

create table if not exists api_audit_events (
  audit_id uuid primary key,
  tenant_id uuid not null,
  fund_id uuid,
  actor_user_id text not null,
  action_type text not null,
  entity_type text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  approval_status text,
  previous_hash text,
  event_hash text not null,
  created_at timestamptz not null
);
