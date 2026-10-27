export const APP_NAME = 'Zavarovalnica Horica';

/** Auto-approval limits from the project plan. They may change during development. */
export const AUTO_APPROVE = { maxAmount: 300, maxRisk: 0.2 };

// Users

/** CUSTOMER files claims. EMPLOYEE reviews them. MANAGER also assigns reviews and sees the history. */
export type Role = 'CUSTOMER' | 'EMPLOYEE' | 'MANAGER';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  /** Job title, staff only. */
  title?: string;
}

export interface Session {
  token: string;
  user: User;
}

export const isStaff = (u: User | null | undefined) => u?.role === 'EMPLOYEE' || u?.role === 'MANAGER';

// Policies (PolicyService)

export type ClaimType = 'CAR' | 'HOME' | 'TRAVEL' | 'HEALTH';

export interface Policy {
  number: string;
  holderId: string;
  holderName: string;
  type: ClaimType;
  product: string;
  /** What the policy pays for. */
  coverage: string[];
  /** Highest amount paid per claim, in EUR. */
  limit: number;
  /** Part of each loss the customer pays, in EUR. */
  deductible: number;
  validFrom: string;
  validTo: string;
}

// Claims (ClaimsService)

export type ClaimStatus = 'SUBMITTED' | 'NEEDS_REVIEW' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED';

/** PASS = ok, FLAG = a person should look, FAIL = a condition is not met. */
export type Outcome = 'PASS' | 'FLAG' | 'FAIL';

export interface AgentStep {
  agent: 'Data agent' | 'Recommendation agent';
  outcome: Outcome;
  note: string;
}

/** From RiskService: 0 = no risk, 1 = highest risk. */
export interface RiskAssessment {
  score: number;
  reasons: string[];
}

export interface Recommendation {
  action: 'APPROVE' | 'REJECT' | 'REVIEW';
  summary: string;
  automatic: boolean;
}

export interface ClaimDocument {
  name: string;
  uploadedAt: string;
  uploadedById: string;
}

export interface Assignment {
  assigneeId: string;
  assignedById: string;
  assignedAt: string;
  note: string;
}

export type ReviewDecision = 'APPROVED' | 'REJECTED' | 'NEEDS_INFO';

export interface Review {
  decision: ReviewDecision;
  reviewerId: string;
  reviewerName: string;
  comment: string;
  decidedAt: string;
}

/** One entry of the claim history. `event` matches the Kafka event name where there is one. */
export interface HistoryEvent {
  at: string;
  event: string;
  actor: string;
  text: string;
}

export interface Claim {
  id: string;
  policyNumber: string;
  customerId: string;
  claimant: string;
  type: ClaimType;
  incidentDate: string;
  amount: number;
  description: string;
  documents: ClaimDocument[];
  status: ClaimStatus;
  risk: RiskAssessment;
  agents: AgentStep[];
  recommendation: Recommendation;
  createdAt: string;
  assignment?: Assignment;
  /** Latest decision. A NEEDS_INFO review is replaced once the claim is decided. */
  review?: Review;
  history: HistoryEvent[];
}

export interface NewClaim {
  policyNumber: string;
  incidentDate: string;
  amount: number;
  description: string;
  documents: string[];
}

export interface ReviewInput {
  decision: ReviewDecision;
  comment: string;
}

export interface AssignInput {
  assigneeId: string;
  note: string;
}

/** A history entry with the claim it belongs to, for the audit log. */
export interface AuditEntry extends HistoryEvent {
  claimId: string;
}

export const CLAIM_TYPE_LABEL: Record<ClaimType, string> = {
  CAR: 'Car',
  HOME: 'Home',
  TRAVEL: 'Travel',
  HEALTH: 'Health',
};
