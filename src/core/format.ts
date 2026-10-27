import type { ClaimStatus, Outcome, ReviewDecision } from './models';

const money = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR' });
const date = new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'numeric', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('sl-SI', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatMoney = (n: number) => money.format(n);
export const formatDate = (iso: string) => date.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatRisk = (score: number) => score.toFixed(2);

export const STATUS_LABEL: Record<ClaimStatus, string> = {
  SUBMITTED: 'Submitted',
  NEEDS_REVIEW: 'In review',
  NEEDS_INFO: 'Waiting for documents',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const DECISION_LABEL: Record<ReviewDecision, string> = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_INFO: 'More documents requested',
};

export type Tone = 'good' | 'warn' | 'bad' | 'neutral' | 'info';

export const STATUS_TONE: Record<ClaimStatus | Outcome | ReviewDecision, Tone> = {
  SUBMITTED: 'neutral',
  NEEDS_REVIEW: 'warn',
  NEEDS_INFO: 'info',
  APPROVED: 'good',
  REJECTED: 'bad',
  PASS: 'good',
  FLAG: 'warn',
  FAIL: 'bad',
};
