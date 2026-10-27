import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { ClaimsApi } from './claims-api';
import { DEMO_PASSWORD, ORGANISATIONS, POLICIES, runAgents, seedClaims, USERS } from './mock-data';
import { AssignInput, Claim, LoginInput, NewClaim, ReviewInput, Session, User } from './models';
import { SessionStore } from './session';

const LATENCY_MS = 250;
const DB_KEY = 'claimdesk.mock-db.v2';

function fail(status: number, message: string) {
  return throwError(() => new HttpErrorResponse({ status, statusText: message, error: { message } }));
}

function reply<T>(value: T, ms = LATENCY_MS): Observable<T> {
  return of(structuredClone(value)).pipe(delay(ms));
}

/**
 * In-memory fake backend, so the UI works before the services exist.
 * Changes are kept in sessionStorage, so they survive a page reload in the same tab.
 */
@Injectable()
export class MockClaimsApi extends ClaimsApi {
  private readonly session = inject(SessionStore);
  private claims: Claim[] = this.loadDb();

  private loadDb(): Claim[] {
    try {
      const raw = sessionStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw) as Claim[];
    } catch {
      // fall through to seed data
    }
    return seedClaims();
  }

  private saveDb() {
    try {
      sessionStorage.setItem(DB_KEY, JSON.stringify(this.claims));
    } catch {
      // Storage blocked: changes last until reload.
    }
  }

  /** The logged-in user, or null. */
  private me(): User | null {
    return this.session.user();
  }

  private orgClaim(id: string): Claim | undefined {
    const me = this.me();
    return this.claims.find((c) => c.id === id && c.orgId === me?.orgId);
  }

  // Auth and users

  listOrganisations() {
    return reply(ORGANISATIONS);
  }

  login({ orgId, username, password }: LoginInput): Observable<Session> {
    const user = USERS.find(
      (u) => u.orgId === orgId && u.username.toLowerCase() === username.trim().toLowerCase(),
    );
    const organisation = ORGANISATIONS.find((o) => o.id === orgId);
    if (!user || !organisation || password !== DEMO_PASSWORD) {
      return fail(401, 'Wrong organisation, username or password.');
    }
    return reply({ token: `mock-token-${user.id}`, user, organisation }, LATENCY_MS * 2);
  }

  listUsers() {
    const me = this.me();
    if (!me) return fail(401, 'Not logged in.');
    return reply(USERS.filter((u) => u.orgId === me.orgId));
  }

  // Claims

  listClaims() {
    const me = this.me();
    if (!me) return fail(401, 'Not logged in.');
    const mine = this.claims
      .filter((c) => c.orgId === me.orgId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return reply(mine);
  }

  getClaim(id: string) {
    const claim = this.orgClaim(id);
    return claim ? reply(claim) : fail(404, `Claim ${id} not found.`);
  }

  submitClaim(input: NewClaim) {
    const me = this.me();
    if (!me) return fail(401, 'Not logged in.');
    const nextId = Math.max(...this.claims.map((c) => Number(c.id.slice(4)))) + 1;
    const claim: Claim = {
      id: `CLM-${nextId}`,
      orgId: me.orgId,
      ...input,
      policyNumber: input.policyNumber.trim().toUpperCase(),
      ...runAgents(me.orgId, input),
      createdAt: new Date().toISOString(),
      createdById: me.id,
    };
    this.claims.push(claim);
    this.saveDb();
    return reply(claim, LATENCY_MS * 3);
  }

  listPolicies() {
    const me = this.me();
    if (!me) return fail(401, 'Not logged in.');
    return reply(POLICIES.filter((p) => p.orgId === me.orgId));
  }

  // Reviews

  assignReview(claimId: string, { assigneeId, note }: AssignInput) {
    const me = this.me();
    const claim = this.orgClaim(claimId);
    if (!me || me.role !== 'MANAGER') return fail(403, 'Only managers can assign reviews.');
    if (!claim) return fail(404, `Claim ${claimId} not found.`);
    if (claim.status !== 'NEEDS_REVIEW') return fail(409, 'This claim does not need a review.');
    if (!USERS.some((u) => u.id === assigneeId && u.orgId === me.orgId)) {
      return fail(400, 'Unknown employee.');
    }
    claim.assignment = { assigneeId, assignedById: me.id, assignedAt: new Date().toISOString(), note };
    this.saveDb();
    return reply(claim);
  }

  submitReview(claimId: string, { decision, comment }: ReviewInput) {
    const me = this.me();
    const claim = this.orgClaim(claimId);
    if (!me) return fail(401, 'Not logged in.');
    if (!claim) return fail(404, `Claim ${claimId} not found.`);
    if (claim.status !== 'NEEDS_REVIEW') return fail(409, 'This claim was already decided.');
    if (claim.assignment?.assigneeId !== me.id && me.role !== 'MANAGER') {
      return fail(403, 'This review is assigned to someone else.');
    }
    claim.status = decision;
    claim.review = {
      decision,
      reviewerId: me.id,
      reviewerName: me.name,
      comment,
      decidedAt: new Date().toISOString(),
    };
    this.saveDb();
    return reply(claim);
  }
}
