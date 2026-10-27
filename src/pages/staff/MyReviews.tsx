import { Link } from 'react-router';
import { Loading, OutcomeBadge, PageHead, RiskPill, StatusBadge } from '../../components/bits';
import { ReviewForm } from '../../components/ReviewControls';
import { api } from '../../core/client';
import { formatDate, formatDateTime, formatMoney } from '../../core/format';
import { CLAIM_TYPE_LABEL } from '../../core/models';
import { useSession } from '../../core/session';
import { decidedBy, nameOf, needsReview, openReviewsOf } from '../../core/stats';
import { useAsync } from '../../core/use-async';

/** UC-6: claims assigned to me that need a human decision. */
export function MyReviews() {
  const me = useSession()!.user;
  const claims = useAsync(() => api.listClaims());
  const staff = useAsync(() => api.listStaff());
  const all = claims.data ?? [];

  const mine = openReviewsOf(all, me.id);
  const toDecide = mine.filter(needsReview);
  const waiting = mine.filter((c) => c.status === 'NEEDS_INFO');
  const unassigned = all.filter((c) => needsReview(c) && !c.assignment).length;
  const recent = decidedBy(all, me.id)
    .sort((a, b) => (b.review?.decidedAt ?? '').localeCompare(a.review?.decidedAt ?? ''))
    .slice(0, 5);

  return (
    <>
      <PageHead
        title="My reviews"
        sub="Claims the agents could not approve on their own. You make the final decision."
      />

      {me.role === 'MANAGER' && unassigned > 0 && (
        <p className="notice">
          {unassigned} review(s) have no assignee. <Link to="/dashboard">Assign them on the dashboard</Link>
        </p>
      )}

      {claims.loading && !claims.data ? (
        <Loading />
      ) : claims.error ? (
        <p className="error">Could not load your reviews.</p>
      ) : (
        <>
          {toDecide.map((c) => (
            <article key={c.id} className="card review">
              <div className="step-head">
                <h2>
                  <Link to={`/claims/${c.id}`}>{c.id}</Link> · {c.claimant}
                </h2>
                <RiskPill score={c.risk.score} />
              </div>
              <p>
                {CLAIM_TYPE_LABEL[c.type]} · {formatMoney(c.amount)} · incident {formatDate(c.incidentDate)}
              </p>
              <p>{c.description}</p>
              {c.assignment && (
                <p className="muted small">
                  Assigned by {nameOf(staff.data, c.assignment.assignedById)} on{' '}
                  {formatDate(c.assignment.assignedAt)}
                </p>
              )}
              {c.assignment?.note && <p className="note">“{c.assignment.note}”</p>}

              <ul className="flags">
                {c.agents.map((a) => (
                  <li key={a.agent}>
                    <OutcomeBadge outcome={a.outcome} /> {a.agent}: {a.note}
                  </li>
                ))}
                {c.risk.reasons.map((r) => (
                  <li key={r} className="muted">
                    · {r}
                  </li>
                ))}
              </ul>
              <p className="small">
                Documents: {c.documents.length ? c.documents.map((d) => d.name).join(', ') : 'none'} ·{' '}
                <Link to={`/claims/${c.id}`}>Open claim</Link>
              </p>

              <ReviewForm claim={c} onDecided={() => claims.reload()} />
            </article>
          ))}
          {!toDecide.length && (
            <div className="card">
              <p className="muted">Nothing to decide right now.</p>
            </div>
          )}

          {waiting.length > 0 && (
            <section className="card table-wrap">
              <h2 className="table-title">Waiting for the customer</h2>
              <table>
                <tbody>
                  {waiting.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/claims/${c.id}`}>{c.id}</Link>
                      </td>
                      <td>{c.claimant}</td>
                      <td className="muted">{c.review?.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {recent.length > 0 && (
            <section className="card table-wrap">
              <h2 className="table-title">Recently decided by you</h2>
              <table>
                <tbody>
                  {recent.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/claims/${c.id}`}>{c.id}</Link>
                      </td>
                      <td>{c.claimant}</td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td>{c.review && formatDateTime(c.review.decidedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </>
  );
}
