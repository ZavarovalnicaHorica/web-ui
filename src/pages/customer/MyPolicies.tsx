import { Link } from 'react-router';
import { Loading, PageHead } from '../../components/bits';
import { api } from '../../core/client';
import { formatDate, formatMoney } from '../../core/format';
import { CLAIM_TYPE_LABEL } from '../../core/models';
import { useAsync } from '../../core/use-async';

/** UC-1: the customer checks whether their insurance is valid and what it covers. */
export function MyPolicies() {
  const policies = useAsync(() => api.listPolicies());
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHead title="My policies" sub="What you are insured for and until when." />
      {policies.loading ? (
        <Loading />
      ) : policies.error ? (
        <p className="error">Could not load your policies.</p>
      ) : (
        <div className="grid">
          {policies.data?.map((p) => {
            const valid = p.validFrom <= today && today <= p.validTo;
            return (
              <article key={p.number} className="card policy">
                <div className="step-head">
                  <h2>{p.product}</h2>
                  <span className={`badge ${valid ? 'badge-good' : 'badge-bad'}`}>{valid ? 'Valid' : 'Expired'}</span>
                </div>
                <dl>
                  <dt>Policy number</dt>
                  <dd>{p.number}</dd>
                  <dt>Type</dt>
                  <dd>{CLAIM_TYPE_LABEL[p.type]}</dd>
                  <dt>Valid</dt>
                  <dd>
                    {formatDate(p.validFrom)} – {formatDate(p.validTo)}
                  </dd>
                  <dt>Limit per claim</dt>
                  <dd>{formatMoney(p.limit)}</dd>
                  <dt>Deductible</dt>
                  <dd>{p.deductible ? formatMoney(p.deductible) : 'None'}</dd>
                </dl>
                <h3>Covers</h3>
                <ul className="checks">
                  {p.coverage.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                {valid && (
                  <div className="actions">
                    <Link className="btn" to={`/my/claims/new?policy=${p.number}`}>
                      Report a claim
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
