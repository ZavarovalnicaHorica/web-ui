import { Link } from 'react-router';
import { Loading, PageHead, StatusBadge } from '../../components/bits';
import { api } from '../../core/client';
import { formatDate, formatMoney } from '../../core/format';
import { CLAIM_TYPE_LABEL } from '../../core/models';
import { useAsync } from '../../core/use-async';

/** UC-4: the customer's claims and where each one stands. */
export function MyClaims() {
  const claims = useAsync(() => api.listClaims());
  const waiting = claims.data?.filter((c) => c.status === 'NEEDS_INFO') ?? [];

  return (
    <>
      <PageHead title="My claims">
        <Link className="btn btn-primary" to="/my/claims/new">
          Report a claim
        </Link>
      </PageHead>

      {waiting.map((c) => (
        <p key={c.id} className="notice">
          We need more documents for claim <Link to={`/my/claims/${c.id}`}>{c.id}</Link>.
        </p>
      ))}

      {claims.loading ? (
        <Loading />
      ) : claims.error ? (
        <p className="error">Could not load your claims.</p>
      ) : !claims.data?.length ? (
        <div className="card">
          <p className="muted">You have not reported any claims yet.</p>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Type</th>
                <th>Incident</th>
                <th className="num">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {claims.data.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/my/claims/${c.id}`}>{c.id}</Link>
                  </td>
                  <td>{CLAIM_TYPE_LABEL[c.type]}</td>
                  <td>{formatDate(c.incidentDate)}</td>
                  <td className="num">{formatMoney(c.amount)}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
