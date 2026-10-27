import { ApiError, type Api } from '../api';
import type { AssignInput, AuditEntry, Claim, NewClaim, ReviewInput, Session, User } from '../models';
import { isStaff } from '../models';
import { getSession } from '../session';
import { addDocuments, assignReview, createClaim, decideReview } from './engine';
import { DEMO_PASSWORD, POLICIES, USERS } from './mock-data';
import { seedClaims } from './seed';

const LATENCY_MS = 250;
const DB_KEY = 'horica.mock-db.v1';

/** History entries a customer may see. The rest is internal. */
const CUSTOMER_EVENTS = new Set([
  'claim.submitted.v1',
  'document.added.v1',
  'review.requested.v1',
  'review.completed.v1',
  'claim.status.changed',
  'claim.reanalysis.started',
]);

function wait<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
}

function fail(status: number, message: string): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new ApiError(status, message)), LATENCY_MS));
}

/**
 * In-browser fake backend, so the UI works before the services exist.
 * Changes are kept in sessionStorage, so they survive a page reload in the same tab.
 */
export class MockApi implements Api {
  private claims: Claim[] = this.load();

  private load(): Claim[] {
    try {
      const raw = sessionStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw) as Claim[];
    } catch {
      // fall back to seed data
    }
    return seedClaims();
  }

  private save() {
    try {
      sessionStorage.setItem(DB_KEY, JSON.stringify(this.claims));
    } catch {
      // Storage blocked: changes last until reload.
    }
  }

  private me(): User | null {
    return getSession()?.user ?? null;
  }

  /** The claim if this user may see it. */
  private find(id: string): Claim | undefined {
    const me = this.me();
    const claim = this.claims.find((c) => c.id === id);
    if (!me || !claim) return undefined;
    return isStaff(me) || claim.customerId === me.id ? claim : undefined;
  }

  /** What a customer gets back: no internal notes or staff-only history. */
  private view(claim: Claim): Claim {
    if (isStaff(this.me())) return claim;
    const copy: Claim = { ...claim, history: claim.history.filter((h) => CUSTOMER_EVENTS.has(h.event)) };
    delete copy.assignment;
    return copy;
  }

  private user(id: string) {
    return USERS.find((u) => u.id === id);
  }

  async login(username: string, password: string): Promise<Session> {
    const user = USERS.find((u) => u.username === username.trim().toLowerCase());
    if (!user || password !== DEMO_PASSWORD) return fail(401, 'Wrong username or password.');
    return wait({ token: `mock-token-${user.id}`, user }, LATENCY_MS * 2);
  }

  async listPolicies() {
    const me = this.me();
    if (!me) return fail(401, 'Not signed in.');
    return wait(isStaff(me) ? POLICIES : POLICIES.filter((p) => p.holderId === me.id));
  }

  async listClaims() {
    const me = this.me();
    if (!me) return fail(401, 'Not signed in.');
    const visible = isStaff(me) ? this.claims : this.claims.filter((c) => c.customerId === me.id);
    return wait([...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((c) => this.view(c)));
  }

  async getClaim(id: string) {
    const claim = this.find(id);
    return claim ? wait(this.view(claim)) : fail(404, `Claim ${id} not found.`);
  }

  async submitClaim(input: NewClaim) {
    const me = this.me();
    if (!me || me.role !== 'CUSTOMER') return fail(403, 'Only customers can submit claims.');
    const policy = POLICIES.find((p) => p.number === input.policyNumber && p.holderId === me.id);
    if (!policy) return fail(400, 'Choose one of your policies.');
    const nextId = Math.max(...this.claims.map((c) => Number(c.id.slice(4)))) + 1;
    const claim = createClaim(`CLM-${nextId}`, me, policy, input, POLICIES, this.claims, new Date().toISOString());
    this.claims.push(claim);
    this.save();
    return wait(this.view(claim), LATENCY_MS * 3);
  }

  async addDocuments(claimId: string, names: string[]) {
    const me = this.me();
    const claim = this.find(claimId);
    if (!me) return fail(401, 'Not signed in.');
    if (!claim) return fail(404, `Claim ${claimId} not found.`);
    if (claim.status === 'APPROVED' || claim.status === 'REJECTED') {
      return fail(409, 'This claim is already closed.');
    }
    addDocuments(claim, me, names, POLICIES, this.claims, new Date().toISOString());
    this.save();
    return wait(this.view(claim), LATENCY_MS * 3);
  }

  async listStaff() {
    if (!isStaff(this.me())) return fail(403, 'Staff only.');
    return wait(USERS.filter((u) => isStaff(u)));
  }

  async assignReview(claimId: string, { assigneeId, note }: AssignInput) {
    const me = this.me();
    const claim = this.find(claimId);
    const assignee = this.user(assigneeId);
    if (!me || me.role !== 'MANAGER') return fail(403, 'Only managers can assign reviews.');
    if (!claim) return fail(404, `Claim ${claimId} not found.`);
    if (claim.status !== 'NEEDS_REVIEW' && claim.status !== 'NEEDS_INFO') {
      return fail(409, 'This claim does not need a review.');
    }
    if (!assignee || !isStaff(assignee)) return fail(400, 'Unknown employee.');
    assignReview(claim, me, assignee, note, new Date().toISOString());
    this.save();
    return wait(claim);
  }

  async submitReview(claimId: string, input: ReviewInput) {
    const me = this.me();
    const claim = this.find(claimId);
    if (!me || !isStaff(me)) return fail(403, 'Staff only.');
    if (!claim) return fail(404, `Claim ${claimId} not found.`);
    if (claim.status !== 'NEEDS_REVIEW') return fail(409, 'This claim is not waiting for a review.');
    if (claim.assignment?.assigneeId !== me.id && me.role !== 'MANAGER') {
      return fail(403, 'This review is assigned to someone else.');
    }
    decideReview(claim, me, input, new Date().toISOString());
    this.save();
    return wait(claim);
  }

  async listHistory() {
    if (this.me()?.role !== 'MANAGER') return fail(403, 'Managers only.');
    const all: AuditEntry[] = this.claims.flatMap((c) => c.history.map((h) => ({ ...h, claimId: c.id })));
    return wait(all.sort((a, b) => b.at.localeCompare(a.at)));
  }
}
