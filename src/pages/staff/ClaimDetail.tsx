import { Link, useParams } from 'react-router';
import { AddDocuments, DocumentList } from '../../components/Documents';
import { HistoryList } from '../../components/HistoryList';
import { AssignReview, ReviewForm } from '../../components/ReviewControls';
import { DecisionBadge, Loading, OutcomeBadge, PageHead, RiskMeter, StatusBadge } from '../../components/bits';
import { api } from '../../core/client';
import { formatDate, formatDateTime, formatMoney } from '../../core/format';
import { CLAIM_TYPE_LABEL } from '../../core/models';
import { useSession } from '../../core/session';
import { nameOf } from '../../core/stats';
import { useAsync } from '../../core/use-async';

/** Everything about one claim for staff: agents, risk, documents, review and full history (UC-6, UC-8). */
export function ClaimDetail() {
  const { id = '' } = useParams();
  const me = useSession()!.user;
  const claim = useAsync(() => api.getClaim(id), [id]);
  const staff = useAsync(() => api.listStaff());
  const policies = useAsync(() => api.listPolicies());
  const c = claim.data;
  const policy = policies.data?.find((p) => p.number === c?.policyNumber);
  const name = (uid?: string) => nameOf(staff.data, uid);

  const open = c?.status === 'NEEDS_REVIEW';
  const canDecide = open && (c?.assignment?.assigneeId === me.id || me.role === 'MANAGER');
  const canAssign = me.role === 'MANAGER' && (c?.status === 'NEEDS_REVIEW' || c?.status === 'NEEDS_INFO');

  return (
    <>
      <PageHead title={`Claim ${id}`}>
        <Link className="btn" to="/claims">
          All claims
        </Link>
      </PageHead>

      {claim.loading && !c ? (
        <Loading />
      ) : claim.error || !c ? (
        <p className="error">Claim not found.</p>
      ) : (
        <>
          <div className="grid">
            <section className="card">
              <div className="step-head">
                <h2>Details</h2>
                <StatusBadge status={c.status} />
              </div>
              <dl>
                <dt>Customer</dt>
                <dd>{c.claimant}</dd>
                <dt>Policy</dt>
                <dd>
                  {c.policyNumber}
                  {policy && (
                    <span className="muted">
                      {' '}
                      · {policy.product}, limit {formatMoney(policy.limit)}, valid {formatDate(policy.validFrom)} –{' '}
                      {formatDate(policy.validTo)}
                    </span>
                  )}
                </dd>
                <dt>Type</dt>
                <dd>{CLAIM_TYPE_LABEL[c.type]}</dd>
                <dt>Incident date</dt>
                <dd>{formatDate(c.incidentDate)}</dd>
                <dt>Amount</dt>
                <dd>{formatMoney(c.amount)}</dd>
                <dt>Reported</dt>
                <dd>{formatDateTime(c.createdAt)}</dd>
              </dl>
              <h3>Description</h3>
              <p>{c.description}</p>
              <h3>Documents</h3>
              <DocumentList claim={c} />
            </section>

            <section className="card">
              <h2>Automated processing</h2>
              <RiskMeter score={c.risk.score} />
              {c.risk.reasons.length > 0 && (
                <ul className="reasons">
                  {c.risk.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
              <ol className="steps">
                {c.agents.map((a) => (
                  <li key={a.agent}>
                    <div className="step-head">
                      <strong>{a.agent}</strong>
                      <OutcomeBadge outcome={a.outcome} />
                    </div>
                    <p className="muted">{a.note}</p>
                  </li>
                ))}
              </ol>

              {(c.assignment || c.review || open || c.status === 'NEEDS_INFO') && <h3>Human review</h3>}

              {c.assignment && (
                <p>
                  Assigned to <strong>{name(c.assignment.assigneeId)}</strong> by {name(c.assignment.assignedById)},{' '}
                  {formatDate(c.assignment.assignedAt)}
                </p>
              )}
              {c.assignment?.note && <p className="note">“{c.assignment.note}”</p>}

              {c.review && (
                <p>
                  <DecisionBadge decision={c.review.decision} /> by {c.review.reviewerName},{' '}
                  {formatDateTime(c.review.decidedAt)}
                  {c.review.comment && <span className="muted"> · “{c.review.comment}”</span>}
                </p>
              )}

              {open && !c.assignment && <p className="notice">Waiting for a manager to assign this review.</p>}
              {canAssign && staff.data && (
                <AssignReview claim={c} staff={staff.data} onAssigned={() => claim.reload()} />
              )}
              {canDecide && <ReviewForm claim={c} onDecided={() => claim.reload()} />}
              {c.status === 'NEEDS_INFO' && (
                <>
                  <p className="muted small">
                    Waiting for the customer. When they add documents the agents check the claim again.
                  </p>
                  <AddDocuments claim={c} onAdded={() => claim.reload()} />
                </>
              )}
            </section>
          </div>

          <section className="card history-card">
            <h2>History</h2>
            <p className="muted small">Every step and decision on this claim, with the event behind it.</p>
            <HistoryList events={c.history} showEvents />
          </section>
        </>
      )}
    </>
  );
}
