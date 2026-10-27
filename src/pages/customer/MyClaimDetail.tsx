import { Link, useParams } from 'react-router';
import { AddDocuments, DocumentList } from '../../components/Documents';
import { HistoryList } from '../../components/HistoryList';
import { Loading, PageHead, StatusBadge } from '../../components/bits';
import { api } from '../../core/client';
import { formatDate, formatMoney } from '../../core/format';
import { CLAIM_TYPE_LABEL, type ClaimStatus } from '../../core/models';
import { useAsync } from '../../core/use-async';

const WHAT_NEXT: Record<ClaimStatus, string> = {
  SUBMITTED: 'We received your claim and are checking it.',
  NEEDS_REVIEW: 'An employee is reviewing your claim. You can still add documents.',
  NEEDS_INFO: 'We need more documents before we can decide. Add them below.',
  APPROVED: 'Your claim was approved. The payment will follow.',
  REJECTED: 'Your claim was rejected. See the reason below.',
};

/** UC-3 and UC-4: the customer follows their claim and adds documents. */
export function MyClaimDetail() {
  const { id = '' } = useParams();
  const claim = useAsync(() => api.getClaim(id), [id]);
  const c = claim.data;

  return (
    <>
      <PageHead title={`Claim ${id}`}>
        <Link className="btn" to="/my/claims">
          Back to my claims
        </Link>
      </PageHead>

      {claim.loading && !c ? (
        <Loading />
      ) : claim.error || !c ? (
        <p className="error">Claim not found.</p>
      ) : (
        <div className="grid">
          <section className="card">
            <div className="step-head">
              <h2>Status</h2>
              <StatusBadge status={c.status} />
            </div>
            <p>{WHAT_NEXT[c.status]}</p>

            {c.status === 'NEEDS_INFO' && c.review?.comment && (
              <p className="notice">
                <strong>Message from {c.review.reviewerName}:</strong> {c.review.comment}
              </p>
            )}
            {(c.status === 'APPROVED' || c.status === 'REJECTED') && c.review?.comment && (
              <p className="note">“{c.review.comment}”</p>
            )}

            <h3>Details</h3>
            <dl>
              <dt>Policy</dt>
              <dd>{c.policyNumber}</dd>
              <dt>Type</dt>
              <dd>{CLAIM_TYPE_LABEL[c.type]}</dd>
              <dt>Incident date</dt>
              <dd>{formatDate(c.incidentDate)}</dd>
              <dt>Amount</dt>
              <dd>{formatMoney(c.amount)}</dd>
              <dt>Reported</dt>
              <dd>{formatDate(c.createdAt)}</dd>
            </dl>
            <h3>What happened</h3>
            <p>{c.description}</p>

            <h3>Documents</h3>
            <DocumentList claim={c} />
            {(c.status === 'NEEDS_INFO' || c.status === 'NEEDS_REVIEW') && (
              <AddDocuments claim={c} onAdded={() => claim.reload()} />
            )}
          </section>

          <section className="card">
            <h2>History</h2>
            <HistoryList events={c.history} showEvents={false} />
          </section>
        </div>
      )}
    </>
  );
}
