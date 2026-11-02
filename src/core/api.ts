import {
  userFromAuth,
  type AssignInput,
  type AuditEntry,
  type AuthLoginRequest,
  type AuthRegisterRequest,
  type AuthTokenResponse,
  type AuthUserResponse,
  type Claim,
  type NewClaim,
  type Policy,
  type ReviewInput,
  type Session,
  type User,
} from './models';
import { getSession } from './session';
import { settings } from './settings';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Per-field validation messages, e.g. { password: "size must be between 8 and 72" }. */
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

/**
 * Everything the UI needs from the backend. What each call returns depends on the signed-in user:
 * customers only get their own policies and claims, staff get everything.
 */
export interface Api {
  login(email: string, password: string): Promise<Session>;
  /** Creates a customer account. Sign in afterwards with login(). */
  register(email: string, password: string): Promise<void>;

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
  private async request<T>(method: string, path: string, body?: unknown, token = getSession()?.token): Promise<T> {
    const res = await fetch(`${settings.apiUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      // Spring services answer errors as "problem details": { status, title, detail }.
      const data = await res.json().catch(() => null);
      throw new ApiError(res.status, data?.detail ?? data?.message ?? res.statusText, data?.errors ?? {});
    }
    return res.json() as Promise<T>;
  }

  /**
   * auth-service login takes two calls:
   * 1. POST /auth/login → the token
   * 2. GET /auth/me with that token → who the user is (id, email, role)
   */
  async login(email: string, password: string): Promise<Session> {
    const body: AuthLoginRequest = { email, password };
    const { accessToken } = await this.request<AuthTokenResponse>('POST', '/auth/login', body);
    const me = await this.request<AuthUserResponse>('GET', '/auth/me', undefined, accessToken);
    return { token: accessToken, user: userFromAuth(me) };
  }

  /** POST /auth/register → 201 with the new user, 409 if the email is taken, 400 if a field is invalid. */
  async register(email: string, password: string): Promise<void> {
    const body: AuthRegisterRequest = { email, password };
    await this.request<AuthUserResponse>('POST', '/auth/register', body);
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
