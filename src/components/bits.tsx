import type { ReactNode } from 'react';
import { DECISION_LABEL, formatRisk, STATUS_LABEL, STATUS_TONE } from '../core/format';
import type { ClaimStatus, Outcome, ReviewDecision } from '../core/models';
import { AUTO_APPROVE } from '../core/models';

const OUTCOME_LABEL: Record<Outcome, string> = { PASS: 'Pass', FLAG: 'Flag', FAIL: 'Fail' };

export function StatusBadge({ status }: { status: ClaimStatus }) {
  return <span className={`badge badge-${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return <span className={`badge badge-${STATUS_TONE[outcome]}`}>{OUTCOME_LABEL[outcome]}</span>;
}

export function DecisionBadge({ decision }: { decision: ReviewDecision }) {
  return <span className={`badge badge-${STATUS_TONE[decision]}`}>{DECISION_LABEL[decision]}</span>;
}

export function RiskPill({ score }: { score: number }) {
  return (
    <span className={`risk-pill${score > AUTO_APPROVE.maxRisk ? ' risk-pill-high' : ''}`}>
      Risk {formatRisk(score)}
    </span>
  );
}

/** Horizontal bar, 0 to 1, with a mark at the auto-approval limit. */
export function RiskMeter({ score }: { score: number }) {
  return (
    <div className="risk">
      <span>Risk score</span>
      <strong>{formatRisk(score)}</strong>
      <div className="meter" aria-hidden="true">
        <div
          className={`meter-fill${score > AUTO_APPROVE.maxRisk ? ' meter-high' : ''}`}
          style={{ width: `${Math.max(2, score * 100)}%` }}
        />
        <div className="meter-mark" style={{ left: `${AUTO_APPROVE.maxRisk * 100}%` }} />
      </div>
      <span className="muted small">Auto-approval up to {formatRisk(AUTO_APPROVE.maxRisk)}</span>
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Loading() {
  return <p className="muted">Loading…</p>;
}

export function Tile({ label, value, tone }: { label: string; value: number; tone?: 'warn' | 'bad' | 'info' }) {
  return (
    <div className={`tile${tone ? ` tile-${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
