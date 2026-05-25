const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787";
const apiToken = import.meta.env.VITE_API_SERVICE_TOKEN ?? "local-dev-token";

type ApiOptions = {
  tenantId?: string;
  fundId?: string;
  userId?: string;
};

async function apiFetch<T>(path: string, init: RequestInit = {}, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${apiToken}`);
  headers.set("content-type", "application/json");
  headers.set("x-tenant-id", options.tenantId ?? "11111111-1111-4111-8111-111111111111");
  headers.set("x-fund-id", options.fundId ?? "22222222-2222-4222-8222-222222222222");
  headers.set("x-user-id", options.userId ?? "local.user");

  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `API request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export type WorkflowApproval = {
  approval_id: string;
  tenant_id: string;
  fund_id: string;
  entity_type: string;
  entity_id: string;
  proposed_action: Record<string, unknown>;
  nav_impact: number;
  gl_impact: Record<string, unknown>;
  maker_user_id: string;
  checker_user_id: string | null;
  status: "Draft" | "Submitted" | "Approved" | "Rejected" | "Posted";
  maker_comment: string | null;
  checker_comment: string | null;
  digital_signature: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  posted_at: string | null;
};

export type GlPosting = {
  posting_id: string;
  tenant_id: string;
  fund_id: string;
  approval_id: string;
  source_entity_type: string;
  source_entity_id: string;
  memo: string;
  lines: Array<{ account: string; debit: number; credit: number }>;
  nav_impact: number;
  posted_by: string;
  posted_at: string;
};

export const institutionalApi = {
  health: () => fetch(`${apiBaseUrl}/health`).then((res) => res.json()),
  bootstrap: (options?: ApiOptions) => apiFetch("/api/v1/bootstrap", {}, options),
  approvals: (options?: ApiOptions) => apiFetch<{ approvals: WorkflowApproval[] }>("/api/v1/workflow/approvals", {}, options),
  glPostings: (options?: ApiOptions) => apiFetch<{ postings: GlPosting[] }>("/api/v1/gl/postings", {}, options),
  submitApproval: (payload: Record<string, unknown>, options?: ApiOptions) => apiFetch<{ approval: WorkflowApproval }>("/api/v1/workflow/approvals", {
    method: "POST",
    body: JSON.stringify(payload),
  }, options),
  approve: (approvalId: string, checkerComment: string, options?: ApiOptions) => apiFetch<{ approval: WorkflowApproval }>(`/api/v1/workflow/approvals/${approvalId}/approve`, {
    method: "POST",
    body: JSON.stringify({ checker_comment: checkerComment }),
  }, options),
  reject: (approvalId: string, checkerComment: string, options?: ApiOptions) => apiFetch<{ approval: WorkflowApproval }>(`/api/v1/workflow/approvals/${approvalId}/reject`, {
    method: "POST",
    body: JSON.stringify({ checker_comment: checkerComment }),
  }, options),
  postToGl: (approvalId: string, options?: ApiOptions) => apiFetch<{ approval: WorkflowApproval; posting: GlPosting }>(`/api/v1/workflow/approvals/${approvalId}/post`, {
    method: "POST",
    body: JSON.stringify({}),
  }, options),
  reopenForCorrection: (approvalId: string, payload: { reason: string; correction_type: string; evidence_note: string }, options?: ApiOptions) => apiFetch<{ approval: WorkflowApproval; correction_approval: WorkflowApproval }>(`/api/v1/workflow/approvals/${approvalId}/reopen`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, options),
  audit: (options?: ApiOptions) => apiFetch("/api/v1/audit", {}, options),
  investigate: (question: string, scope: Record<string, unknown>, options?: ApiOptions) => apiFetch("/api/v1/copilot/investigate", {
    method: "POST",
    body: JSON.stringify({ question, scope }),
  }, options),
};
