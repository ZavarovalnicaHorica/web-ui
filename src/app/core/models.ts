export const APP_NAME = 'ClaimDesk';

// Organisations and users

export interface Organisation {
  id: string;
  name: string;
}

/** EMPLOYEE handles claims and reviews. MANAGER also sees the team and assigns reviews. */
export type Role = 'EMPLOYEE' | 'MANAGER';

export interface User {
  id: string;
  orgId: string;
  username: string;
  name: string;
  title: string;
  role: Role;
}

export interface Session {
  token: string;
  user: User;
  organisation: Organisation;
}

export interface LoginInput {
  orgId: string;
  username: string;
  password: string;
}

// Claims

export type ClaimType = 'CAR' | 'HOME' | 'TRAVEL' | 'HEALTH';

export type ClaimStatus = 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';

export type AgentName = 'Coverage' | 'Evidence' | 'Decision';

/** PASS = ok, FLAG = needs a human, FAIL = blocks the claim. */
export type AgentOutcome = 'PASS' | 'FLAG' | 'FAIL';

export interface AgentResult {
  agent: AgentName;
  outcome: AgentOutcome;
  note: string;
}

export interface Policy {
  orgId: string;
  number: string;
  holder: string;
  type: ClaimType;
  coverageLimit: number;
  active: boolean;
}

export type ReviewDecision = 'APPROVED' | 'REJECTED';

export interface Review {
  decision: ReviewDecision;
  reviewerId: string;
  reviewerName: string;
  comment: string;
  decidedAt: string;
}

/** A review task given to an employee by a manager. */
export interface Assignment {
  assigneeId: string;
  assignedById: string;
  assignedAt: string;
  note: string;
}

export interface Claim {
  id: string;
  orgId: string;
  policyNumber: string;
  claimant: string;
  type: ClaimType;
  incidentDate: string;
  amount: number;
  description: string;
  documents: string[];
  status: ClaimStatus;
  /** 0-100, from risk-service. */
  riskScore: number | null;
  agents: AgentResult[];
  createdAt: string;
  createdById: string;
  assignment?: Assignment;
  review?: Review;
}

export type NewClaim = Pick<
  Claim,
  'policyNumber' | 'claimant' | 'type' | 'incidentDate' | 'amount' | 'description' | 'documents'
>;

export interface ReviewInput {
  decision: ReviewDecision;
  comment: string;
}

export interface AssignInput {
  assigneeId: string;
  note: string;
}

export const CLAIM_TYPES: { value: ClaimType; label: string }[] = [
  { value: 'CAR', label: 'Car' },
  { value: 'HOME', label: 'Home' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'HEALTH', label: 'Health' },
];
