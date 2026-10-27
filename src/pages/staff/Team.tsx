import { Link, useParams } from 'react-router';
import { Loading, PageHead, StatusBadge, Tile } from '../../components/bits';
import { api } from '../../core/client';
import { formatDate, formatMoney, formatRisk } from '../../core/format';
import { decidedBy, openReviewsOf, workload } from '../../core/stats';
import { useAsync } from '../../core/use-async';

/** Manager: all staff and their review counts. */
export function Team() {
  const staff = useAsync(() => api.listStaff());
  const claims = useAsync(() => api.listClaims());
  const rows = workload(claims.data ?? [], staff.data ?? []).sort(
    (a, b) => a.user.role.localeCompare(b.user.role) || a.user.name.localeCompare(b.user.name),
  );

  return (
    <>
      <PageHead title="Team" sub="Claims staff at Zavarovalnica Horica" />
      {staff.loading || claims.loading ? (
        <Loading />
      ) : staff.error || claims.error ? (
        <p className="error">Could not load the team.</p>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Username</th>
                <th>Role</th>
                <th className="num">Open reviews</th>
                <th className="num">Approved</th>
                <th className="num">Rejected</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.user.id}>
                  <td>
                    <Link to={`/team/${w.user.id}`}>{w.user.name}</Link>
                  </td>
                  <td>{w.user.title}</td>
                  <td className="muted">{w.user.username}</td>
                  <td>
                    <span className={`badge ${w.user.role === 'MANAGER' ? 'badge-neutral' : 'badge-good'}`}>
                      {w.user.role === 'MANAGER' ? 'Manager' : 'Employee'}
                    </span>
                  </td>
                  <td className="num">{w.open}</td>
                  <td className="num">{w.approved}</td>
                  <td className="num">{w.rejected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/** Manager: one employee's open and finished reviews. */
export function EmployeeDetail() {
  const { id = '' } = useParams();
  const staff = useAsync(() => api.listStaff());
  const claims = useAsync(() => api.listClaims());
  const user = staff.data?.find((u) => u.id === id);
  const open = openReviewsOf(claims.data ?? [], id);
  const done = decidedBy(claims.data ?? [], id);
  const approved = done.filter((c) => c.status === 'APPROVED').length;

  return (
    <>
      <PageHead title={user?.name ?? 'Employee'} sub={user && `${user.title} · ${user.username}`}>
        <Link className="btn" to="/team">
          Back to team
        </Link>
      </PageHead>

      {staff.loading || claims.loading ? (
        <Loading />
      ) : !user ? (
        <p className="error">Employee not found.</p>
      ) : (
        <>
          <div className="tiles">
            <Tile label="Open reviews" value={open.length} tone="warn" />
            <Tile label="Decided" value={done.length} />
            <Tile label="Approved" value={approved} />
            <Tile label="Rejected" value={done.length - approved} />
          </div>

          <section className="card table-wrap">
            <h2 className="table-title">Assigned reviews</h2>
            <table>
              <thead>
                <tr>
                  <th>Claim</th>
                  <th>Customer</th>
                  <th className="num">Amount</th>
                  <th className="num">Risk</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {open.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/claims/${c.id}`}>{c.id}</Link>
                    </td>
                    <td>{c.claimant}</td>
                    <td className="num">{formatMoney(c.amount)}</td>
                    <td className="num">{formatRisk(c.risk.score)}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>{c.assignment && formatDate(c.assignment.assignedAt)}</td>
                    <td className="muted">{c.assignment?.note || '–'}</td>
                  </tr>
                ))}
                {!open.length && (
                  <tr>
                    <td colSpan={7} className="muted">
                      No open reviews.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="card table-wrap">
            <h2 className="table-title">Decided reviews</h2>
            <table>
              <thead>
                <tr>
                  <th>Claim</th>
                  <th>Customer</th>
                  <th>Decision</th>
                  <th>Date</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {done.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/claims/${c.id}`}>{c.id}</Link>
                    </td>
                    <td>{c.claimant}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>{c.review && formatDate(c.review.decidedAt)}</td>
                    <td className="muted">{c.review?.comment || '–'}</td>
                  </tr>
                ))}
                {!done.length && (
                  <tr>
                    <td colSpan={5} className="muted">
                      No decisions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </>
  );
}
