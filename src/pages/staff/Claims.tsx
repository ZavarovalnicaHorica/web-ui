import { Link, useSearchParams } from 'react-router';
import { Loading, PageHead, StatusBadge } from '../../components/bits';
import { api } from '../../core/client';
import { formatDate, formatMoney, formatRisk, STATUS_LABEL } from '../../core/format';
import { CLAIM_TYPE_LABEL, type ClaimStatus } from '../../core/models';
import { nameOf } from '../../core/stats';
import { useAsync } from '../../core/use-async';

type Filter = 'ALL' | ClaimStatus;
const FILTERS: Filter[] = ['ALL', 'NEEDS_REVIEW', 'NEEDS_INFO', 'APPROVED', 'REJECTED'];

export function Claims() {
  const [params, setParams] = useSearchParams();
  const param = params.get('status') as Filter | null;
  const filter: Filter = param && FILTERS.includes(param) ? param : 'ALL';

  const claims = useAsync(() => api.listClaims());
  const staff = useAsync(() => api.listStaff());
  const visible = (claims.data ?? []).filter((c) => filter === 'ALL' || c.status === filter);

  return (
    <>
      <PageHead title="All claims" />
      <div className="filters" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`chip${filter === f ? ' chip-active' : ''}`}
            onClick={() => setParams(f === 'ALL' ? {} : { status: f })}
          >
            {f === 'ALL' ? 'All' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {claims.loading ? (
        <Loading />
      ) : claims.error ? (
        <p className="error">Could not load claims.</p>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Customer</th>
                <th>Type</th>
                <th className="num">Amount</th>
                <th className="num">Risk</th>
                <th>Status</th>
                <th>Decided by</th>
                <th>Reported</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/claims/${c.id}`}>{c.id}</Link>
                  </td>
                  <td>{c.claimant}</td>
                  <td>{CLAIM_TYPE_LABEL[c.type]}</td>
                  <td className="num">{formatMoney(c.amount)}</td>
                  <td className="num">{formatRisk(c.risk.score)}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>
                    {c.status === 'APPROVED' && c.recommendation.automatic && !c.review ? (
                      <span className="muted">Automatic</span>
                    ) : c.assignment ? (
                      nameOf(staff.data, c.assignment.assigneeId)
                    ) : c.status === 'NEEDS_REVIEW' ? (
                      <span className="muted">Unassigned</span>
                    ) : (
                      c.review?.reviewerName ?? '–'
                    )}
                  </td>
                  <td>{formatDate(c.createdAt)}</td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={8} className="muted">
                    No claims.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
