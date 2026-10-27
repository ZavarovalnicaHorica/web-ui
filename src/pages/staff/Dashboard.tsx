import { Link } from 'react-router';
import { Loading, PageHead, RiskPill, Tile } from '../../components/bits';
import { AssignReview } from '../../components/ReviewControls';
import { api } from '../../core/client';
import { formatDate, formatMoney } from '../../core/format';
import { CLAIM_TYPE_LABEL } from '../../core/models';
import { claimTotals, nameOf, needsReview, workload } from '../../core/stats';
import { useAsync } from '../../core/use-async';

/** Manager overview: counts, reviews to assign, and who is working on what. */
export function Dashboard() {
  const claims = useAsync(() => api.listClaims());
  const staff = useAsync(() => api.listStaff());
  const all = claims.data ?? [];
  const employees = (staff.data ?? []).filter((u) => u.role === 'EMPLOYEE');

  const totals = claimTotals(all);
  const unassigned = all.filter((c) => needsReview(c) && !c.assignment);
  const assigned = all.filter((c) => (needsReview(c) || c.status === 'NEEDS_INFO') && c.assignment);

  return (
    <>
      <PageHead title="Dashboard" sub="Claims handling at Zavarovalnica Horica">
        <Link className="btn" to="/team">
          View team
        </Link>
      </PageHead>

      {claims.loading && !claims.data ? (
        <Loading />
      ) : claims.error || staff.error ? (
        <p className="error">Could not load the dashboard.</p>
      ) : (
        <>
          <div className="tiles">
            <Link to="/claims">
              <Tile label="Claims" value={totals.total} />
            </Link>
            <Link to="/claims?status=NEEDS_REVIEW">
              <Tile label="In review" value={totals.inReview} tone="warn" />
            </Link>
            <Tile label="Not assigned yet" value={totals.unassigned} tone={totals.unassigned ? 'bad' : undefined} />
            <Link to="/claims?status=NEEDS_INFO">
              <Tile label="Waiting for customer" value={totals.waitingForCustomer} tone="info" />
            </Link>
            <Link to="/claims?status=APPROVED">
              <Tile label="Approved" value={totals.approved} />
            </Link>
            <Link to="/claims?status=REJECTED">
              <Tile label="Rejected" value={totals.rejected} />
            </Link>
            <Tile label="Approved automatically" value={totals.autoApproved} />
          </div>

          <section>
            <h2>Waiting for an assignee</h2>
            {unassigned.map((c) => (
              <article key={c.id} className="card row-card">
                <div className="row-card-main">
                  <Link to={`/claims/${c.id}`}>
                    <strong>{c.id}</strong>
                  </Link>{' '}
                  · {c.claimant} · {CLAIM_TYPE_LABEL[c.type]} · {formatMoney(c.amount)} <RiskPill score={c.risk.score} />
                  <p className="muted">{c.recommendation.summary}</p>
                </div>
                <AssignReview claim={c} staff={staff.data ?? []} onAssigned={() => claims.reload()} />
              </article>
            ))}
            {!unassigned.length && (
              <div className="card">
                <p className="muted">Every review has an assignee.</p>
              </div>
            )}
          </section>

          <div className="grid">
            <section className="card table-wrap">
              <h2 className="table-title">Team workload</h2>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th className="num">Open</th>
                    <th className="num">Approved</th>
                    <th className="num">Rejected</th>
                  </tr>
                </thead>
                <tbody>
                  {workload(all, employees).map((w) => (
                    <tr key={w.user.id}>
                      <td>
                        <Link to={`/team/${w.user.id}`}>{w.user.name}</Link>
                      </td>
                      <td className="num">{w.open}</td>
                      <td className="num">{w.approved}</td>
                      <td className="num">{w.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="card table-wrap">
              <h2 className="table-title">Assigned and open</h2>
              <table>
                <thead>
                  <tr>
                    <th>Claim</th>
                    <th>Assignee</th>
                    <th>Since</th>
                  </tr>
                </thead>
                <tbody>
                  {assigned.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/claims/${c.id}`}>{c.id}</Link>
                        {c.status === 'NEEDS_INFO' && <span className="muted small"> (customer)</span>}
                      </td>
                      <td>{nameOf(staff.data, c.assignment?.assigneeId)}</td>
                      <td>{c.assignment && formatDate(c.assignment.assignedAt)}</td>
                    </tr>
                  ))}
                  {!assigned.length && (
                    <tr>
                      <td colSpan={3} className="muted">
                        No open assigned reviews.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>
        </>
      )}
    </>
  );
}
