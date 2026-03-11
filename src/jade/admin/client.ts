/**
 * Anthropic Admin API client.
 *
 * Wraps the Admin API endpoints for organization, workspace,
 * member, and usage/cost management.
 *
 * Authentication: requires an Admin API key (sk-ant-admin...).
 * The key is resolved from:
 *   1. deploy.json adminAuth.adminApiKey
 *   2. ANTHROPIC_ADMIN_KEY env var
 *   3. Passed directly via constructor
 */

const ADMIN_API_BASE = "https://api.anthropic.com/v1/organizations";

export interface AdminClientConfig {
  adminApiKey: string;
  baseUrl?: string;
}

export interface OrgInfo {
  id: string;
  name: string;
  created_at: string;
}

export interface OrgMember {
  user_id: string;
  email: string;
  name: string;
  role: string;
  joined_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  display_name: string;
  created_at: string;
  archived_at: string | null;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  workspace_id: string;
  created_at: string;
  status: string;
}

export interface UsageReportParams {
  start_date: string;
  end_date: string;
  workspace_id?: string;
}

export interface CostReportParams {
  start_date?: string;
  end_date?: string;
  workspace_id?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  has_more: boolean;
  first_id: string | null;
  last_id: string | null;
}

/**
 * Typed client for the Anthropic Admin API.
 * All methods return typed responses or throw on HTTP errors.
 */
export class AdminApiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: AdminClientConfig) {
    this.apiKey = config.adminApiKey;
    this.baseUrl = config.baseUrl ?? ADMIN_API_BASE;
  }

  /**
   * Create from environment or deploy config.
   * Returns null if no admin key is available.
   */
  static fromEnv(): AdminApiClient | null {
    const key = process.env["ANTHROPIC_ADMIN_KEY"];
    if (!key) return null;
    return new AdminApiClient({ adminApiKey: key });
  }

  // ---- Organization ----

  async getOrganization(): Promise<OrgInfo> {
    return this.get<OrgInfo>("/me");
  }

  // ---- Members ----

  async listMembers(): Promise<PaginatedResponse<OrgMember>> {
    return this.get<PaginatedResponse<OrgMember>>("/users");
  }

  async removeMember(userId: string): Promise<void> {
    await this.delete(`/users/${userId}`);
  }

  // ---- Invites ----

  async createInvite(email: string, role: string): Promise<{ id: string }> {
    return this.post<{ id: string }>("/invites", { email, role });
  }

  async listInvites(): Promise<PaginatedResponse<{ id: string; email: string; role: string }>> {
    return this.get("/invites");
  }

  // ---- Workspaces ----

  async listWorkspaces(): Promise<PaginatedResponse<Workspace>> {
    return this.get<PaginatedResponse<Workspace>>("/workspaces");
  }

  async getWorkspace(id: string): Promise<Workspace> {
    return this.get<Workspace>(`/workspaces/${id}`);
  }

  async createWorkspace(name: string, displayName?: string): Promise<Workspace> {
    return this.post<Workspace>("/workspaces", {
      name,
      display_name: displayName ?? name,
    });
  }

  async archiveWorkspace(id: string): Promise<void> {
    await this.post(`/workspaces/${id}/archive`, {});
  }

  // ---- Workspace Members ----

  async listWorkspaceMembers(workspaceId: string): Promise<PaginatedResponse<OrgMember>> {
    return this.get(`/workspaces/${workspaceId}/members`);
  }

  async addWorkspaceMember(
    workspaceId: string,
    userId: string,
    role: string
  ): Promise<void> {
    await this.post(`/workspaces/${workspaceId}/members`, {
      user_id: userId,
      workspace_role: role,
    });
  }

  async removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
    await this.delete(`/workspaces/${workspaceId}/members/${userId}`);
  }

  // ---- API Keys ----

  async listApiKeys(): Promise<PaginatedResponse<ApiKeyInfo>> {
    return this.get<PaginatedResponse<ApiKeyInfo>>("/api_keys");
  }

  async getApiKey(id: string): Promise<ApiKeyInfo> {
    return this.get<ApiKeyInfo>(`/api_keys/${id}`);
  }

  // ---- Usage & Cost Reports ----

  async getUsageReport(params: UsageReportParams): Promise<Record<string, unknown>> {
    const qs = new URLSearchParams();
    qs.set("start_date", params.start_date);
    qs.set("end_date", params.end_date);
    if (params.workspace_id) qs.set("workspace_id", params.workspace_id);
    return this.get(`/usage_report/messages?${qs.toString()}`);
  }

  async getCostReport(params?: CostReportParams): Promise<Record<string, unknown>> {
    const qs = new URLSearchParams();
    if (params?.start_date) qs.set("start_date", params.start_date);
    if (params?.end_date) qs.set("end_date", params.end_date);
    if (params?.workspace_id) qs.set("workspace_id", params.workspace_id);
    const query = qs.toString();
    return this.get(`/cost_report${query ? `?${query}` : ""}`);
  }

  async getClaudeCodeAnalytics(params?: UsageReportParams): Promise<Record<string, unknown>> {
    const qs = new URLSearchParams();
    if (params?.start_date) qs.set("start_date", params.start_date);
    if (params?.end_date) qs.set("end_date", params.end_date);
    const query = qs.toString();
    return this.get(`/usage_report/claude_code${query ? `?${query}` : ""}`);
  }

  // ---- HTTP primitives ----

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new AdminApiError(res.status, await res.text(), path);
    }
    return res.json() as Promise<T>;
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { ...this.headers(), "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new AdminApiError(res.status, await res.text(), path);
    }
    return res.json() as Promise<T>;
  }

  private async delete(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new AdminApiError(res.status, await res.text(), path);
    }
  }

  private headers(): Record<string, string> {
    return {
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
    };
  }
}

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly path: string
  ) {
    super(`Admin API ${status} on ${path}: ${body}`);
    this.name = "AdminApiError";
  }
}
