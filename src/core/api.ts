import type {
  AssignInput,
  AuditEntry,
  Claim,
  NewClaim,
  Policy,
  ReviewInput,
  Session,
  User,
} from './models';
import { getSession } from './session';
import { settings } from './settings';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Everything the UI needs from the backend. What each call returns depends on the signed-in user:
 * customers only get their own policies and claims, staff get everything.
 */
export interface Api {
  login(username: string, password: string): Promise<Session>;

  listPolicies(): Promise<Policy[]>;
  listClaims(): Promise<Claim[]>;
  getClaim(id: string): Promise<Claim>;
  submitClaim(claim: NewClaim): Promise<Claim>;
  addDocuments(claimId: string, names: string[]): Promise<Claim>;

  /** Staff only. */
  listStaff(): Promise<User[]>;
  /** Manager only. */
  assignReview(claimId: string, input: AssignInput): Promise<Claim>;
  /** Assigned employee or manager. */
  submitReview(claimId: string, input: ReviewInput): Promise<Claim>;
  /** Manager only: every history entry of every claim, newest first. */
  listHistory(): Promise<AuditEntry[]>;
}

/** Calls the services through the API Gateway. */
export class HttpApi implements Api {
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = getSession()?.token;
    const res = await fetch(`${settings.apiUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new ApiError(res.status, data?.message ?? res.statusText);
    }
    return res.json() as Promise<T>;
  }

  login(username: string, password: string) {
    return this.request<Session>('POST', '/auth/login', { username, password });
  }
  listPolicies() {
    return this.request<Policy[]>('GET', '/policies');
  }
  listClaims() {
    return this.request<Claim[]>('GET', '/claims');
  }
  getClaim(id: string) {
    return this.request<Claim>('GET', `/claims/${id}`);
  }
  submitClaim(claim: NewClaim) {
    return this.request<Claim>('POST', '/claims', claim);
  }
  addDocuments(claimId: string, names: string[]) {
    return this.request<Claim>('POST', `/documents/${claimId}`, { names });
  }
  listStaff() {
    return this.request<User[]>('GET', '/users?role=staff');
  }
  assignReview(claimId: string, input: AssignInput) {
    return this.request<Claim>('PUT', `/reviews/${claimId}/assignment`, input);
  }
  submitReview(claimId: string, input: ReviewInput) {
    return this.request<Claim>('POST', `/reviews/${claimId}/decision`, input);
  }
  listHistory() {
    return this.request<AuditEntry[]>('GET', '/claims/history');
  }
}

/** Download link for a stored document (DocumentService, real backend only). */
export function documentUrl(claimId: string, name: string) {
  return `${settings.apiUrl}/documents/${claimId}/${encodeURIComponent(name)}`;
}
