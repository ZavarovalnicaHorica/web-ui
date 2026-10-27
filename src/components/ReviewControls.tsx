import { useState } from 'react';
import { api } from '../core/client';
import type { Claim, ReviewDecision, User } from '../core/models';
import { errorText } from '../core/use-async';

/** Manager control: give the review to an employee. */
export function AssignReview({
  claim,
  staff,
  onAssigned,
}: {
  claim: Claim;
  staff: User[];
  onAssigned: (c: Claim) => void;
}) {
  const [assigneeId, setAssigneeId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const employees = staff.filter((u) => u.role === 'EMPLOYEE');

  async function assign() {
    setBusy(true);
    setError('');
    try {
      const updated = await api.assignReview(claim.id, { assigneeId, note: note.trim() });
      setAssigneeId('');
      setNote('');
      onAssigned(updated);
    } catch (e) {
      setError(errorText(e, 'Could not assign the review.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="assign">
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          aria-label={`Assign ${claim.id} to`}
        >
          <option value="">Choose employee…</option>
          {employees.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note for the employee (optional)"
          aria-label="Note for the employee"
        />
        <button
          className="btn btn-primary"
          type="button"
          disabled={!assigneeId || assigneeId === claim.assignment?.assigneeId || busy}
          onClick={assign}
        >
          {claim.assignment ? 'Reassign' : 'Assign'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </>
  );
}

/** Employee decision: approve, reject, or ask the customer for more documents. */
export function ReviewForm({ claim, onDecided }: { claim: Claim; onDecided: (c: Claim) => void }) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function decide(decision: ReviewDecision) {
    if (decision !== 'APPROVED' && !comment.trim()) {
      setError(
        decision === 'NEEDS_INFO'
          ? 'Tell the customer which documents are missing.'
          : 'Write the reason for rejecting the claim.',
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      onDecided(await api.submitReview(claim.id, { decision, comment: comment.trim() }));
    } catch (e) {
      setError(errorText(e, 'Could not save the decision.'));
      setBusy(false);
    }
  }

  return (
    <div className="review-form">
      <textarea
        rows={2}
        placeholder="Reason or message for the customer (needed for reject and request)"
        aria-label="Reason or message"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="btn" type="button" disabled={busy} onClick={() => decide('NEEDS_INFO')}>
          Request documents
        </button>
        <button className="btn btn-danger" type="button" disabled={busy} onClick={() => decide('REJECTED')}>
          Reject
        </button>
        <button className="btn btn-primary" type="button" disabled={busy} onClick={() => decide('APPROVED')}>
          Approve
        </button>
      </div>
    </div>
  );
}
