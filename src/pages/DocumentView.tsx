import { Link, useParams, useSearchParams } from 'react-router';
import { Loading, PageHead } from '../components/bits';
import { PhotoScene } from '../components/PhotoScene';
import { api } from '../core/client';
import { formatMoney } from '../core/format';
import { isStaff } from '../core/models';
import { mockDocument } from '../core/mock/mock-documents';
import { useSession } from '../core/session';
import { useAsync } from '../core/use-async';

/**
 * Shows a claim's document. Mock mode only: real files come from DocumentService (Azure Blob Storage).
 * The file name is in ?file=, because URLs ending in .pdf or .jpg are treated as static files.
 */
export function DocumentView() {
  const { claimId = '' } = useParams();
  const [params] = useSearchParams();
  const file = params.get('file') ?? '';
  const staff = isStaff(useSession()?.user);
  const claim = useAsync(() => api.getClaim(claimId), [claimId]);
  const doc = claim.data ? mockDocument(claim.data, file) : null;

  const net = (doc?.lines ?? []).reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
  const vat = Math.round(net * (doc?.vatRate ?? 0) * 100) / 100;

  return (
    <>
      <PageHead title={file} sub={`Document of claim ${claimId}`}>
        <Link className="btn" to={staff ? `/claims/${claimId}` : `/my/claims/${claimId}`}>
          Back to claim
        </Link>
      </PageHead>

      {claim.loading ? (
        <Loading />
      ) : claim.error ? (
        <p className="error">Claim not found.</p>
      ) : !doc ? (
        <div className="card">
          <p>No preview for this file.</p>
          <p className="muted">
            In the prototype, uploaded files only keep their name. In the real system DocumentService stores the file
            itself.
          </p>
        </div>
      ) : (
        <article className="paper">
          <div className="paper-ribbon">Fictional sample document</div>
          <header className="paper-head">
            <div>
              {doc.issuer.map((line, i) => (
                <div key={i} className={i === 0 ? 'paper-issuer' : undefined}>
                  {line}
                </div>
              ))}
            </div>
            <h2>{doc.title}</h2>
          </header>

          {doc.photo && (
            <figure className="photo">
              <PhotoScene scene={doc.photo.scene} caption={doc.photo.caption} />
              <figcaption>{doc.photo.caption}</figcaption>
            </figure>
          )}

          <dl className="paper-fields">
            {doc.fields.map(([k, v]) => (
              <Pair key={k} k={k} v={v} />
            ))}
          </dl>

          {doc.sections?.map((s) => (
            <section key={s.heading} className="paper-section">
              <h3>{s.heading}</h3>
              {s.rows && (
                <dl className="paper-fields">
                  {s.rows.map(([k, v]) => (
                    <Pair key={k} k={k} v={v} />
                  ))}
                </dl>
              )}
              {s.text && <p>{s.text}</p>}
            </section>
          ))}

          {doc.lines && (
            <section className="paper-section">
              <h3>{doc.linesHeading ?? 'Items'}</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="num">Qty</th>
                      <th className="num">Unit price</th>
                      <th className="num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.lines.map((l) => (
                      <tr key={l.item}>
                        <td>{l.item}</td>
                        <td className="num">
                          {l.qty} {l.unit}
                        </td>
                        <td className="num">{formatMoney(l.unitPrice)}</td>
                        <td className="num">{formatMoney(l.qty * l.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {doc.vatRate ? (
                      <>
                        <tr>
                          <td colSpan={3}>Subtotal</td>
                          <td className="num">{formatMoney(net)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3}>VAT {doc.vatRate * 100} %</td>
                          <td className="num">{formatMoney(vat)}</td>
                        </tr>
                      </>
                    ) : null}
                    <tr className="paper-total">
                      <td colSpan={3}>Total</td>
                      <td className="num">{formatMoney(net + vat)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {doc.note && <p className="muted small">{doc.note}</p>}

          {doc.signatures && (
            <div className="paper-signatures">
              {doc.signatures.map((s) => (
                <div key={s} className="signature">
                  {s}
                </div>
              ))}
            </div>
          )}
        </article>
      )}
    </>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </>
  );
}
