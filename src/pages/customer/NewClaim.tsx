import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Loading, PageHead } from '../../components/bits';
import { api } from '../../core/client';
import { formatMoney } from '../../core/format';
import { AUTO_APPROVE } from '../../core/models';
import { errorText, useAsync } from '../../core/use-async';

/** UC-2 and UC-3: report a loss and attach documents. */
export function NewClaim() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const today = new Date().toISOString().slice(0, 10);
  const policies = useAsync(() => api.listPolicies());
  const valid = (policies.data ?? []).filter((p) => p.validFrom <= today && today <= p.validTo);

  const [policyNumber, setPolicyNumber] = useState(params.get('policy') ?? '');
  const [incidentDate, setIncidentDate] = useState(today);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const chosen = valid.find((p) => p.number === policyNumber);
  const amountNum = Number(amount);
  const canSubmit = chosen && amountNum > 0 && description.trim().length >= 10 && incidentDate;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      const claim = await api.submitClaim({
        policyNumber,
        incidentDate,
        amount: amountNum,
        description: description.trim(),
        documents: files,
      });
      navigate(`/my/claims/${claim.id}`);
    } catch (err) {
      setError(errorText(err, 'Could not submit the claim.'));
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title="Report a claim" sub="Tell us what happened. You can add more documents later.">
        <Link className="btn" to="/my/claims">
          Cancel
        </Link>
      </PageHead>

      {policies.loading ? (
        <Loading />
      ) : !valid.length ? (
        <div className="card">
          <p className="muted">You have no valid policy to report a claim on.</p>
        </div>
      ) : (
        <form className="card form" onSubmit={submit}>
          <label>
            Policy
            <select value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} required>
              <option value="">Choose a policy…</option>
              {valid.map((p) => (
                <option key={p.number} value={p.number}>
                  {p.number} · {p.product}
                </option>
              ))}
            </select>
            {chosen && (
              <span className="hint">
                Covers: {chosen.coverage.join(', ')}. Limit {formatMoney(chosen.limit)}, deductible{' '}
                {formatMoney(chosen.deductible)}.
              </span>
            )}
          </label>

          <div className="row">
            <label>
              Date of the incident
              <input
                type="date"
                value={incidentDate}
                max={today}
                onChange={(e) => setIncidentDate(e.target.value)}
                required
              />
            </label>
            <label>
              Amount claimed (€)
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
          </div>

          <label>
            What happened?
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Where and when it happened, what was damaged, who else was involved."
              required
              minLength={10}
            />
          </label>

          <label>
            Documents
            <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? [], (f) => f.name))} />
            <span className="hint">
              Photos of the damage, receipts, invoices or reports. Claims up to {formatMoney(AUTO_APPROVE.maxAmount)} with
              documents can be approved straight away. Prototype: only file names are kept.
            </span>
          </label>
          {files.length > 0 && (
            <ul className="files">
              {files.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}

          {error && <p className="error">{error}</p>}
          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={!canSubmit || busy}>
              {busy ? 'Submitting…' : 'Submit claim'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
