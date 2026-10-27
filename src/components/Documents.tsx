import { useState } from 'react';
import { Link } from 'react-router';
import { documentUrl } from '../core/api';
import { api } from '../core/client';
import { formatDate } from '../core/format';
import type { Claim } from '../core/models';
import { settings } from '../core/settings';
import { errorText } from '../core/use-async';

/** Links to a claim's documents. In mock mode they open the built-in viewer. */
export function DocumentList({ claim }: { claim: Claim }) {
  if (!claim.documents.length) return <p className="muted">No documents.</p>;
  return (
    <ul className="doc-list">
      {claim.documents.map((d) => (
        <li key={d.name}>
          {settings.useMockApi ? (
            <Link to={`/documents/${claim.id}?file=${encodeURIComponent(d.name)}`}>{d.name}</Link>
          ) : (
            <a href={documentUrl(claim.id, d.name)} target="_blank" rel="noopener">
              {d.name}
            </a>
          )}
          <span className="muted small"> · {formatDate(d.uploadedAt)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Pick files and attach them to the claim (UC-3). */
export function AddDocuments({ claim, onAdded }: { claim: Claim; onAdded: (c: Claim) => void }) {
  const [files, setFiles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [inputKey, setInputKey] = useState(0);

  async function upload() {
    setBusy(true);
    setError('');
    try {
      const updated = await api.addDocuments(claim.id, files);
      setFiles([]);
      setInputKey((k) => k + 1);
      onAdded(updated);
    } catch (e) {
      setError(errorText(e, 'Could not add the documents.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="add-docs">
      <label>
        Add documents
        <input
          key={inputKey}
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? [], (f) => f.name))}
        />
        <span className="hint">Photos, receipts, invoices, reports. Prototype: only file names are kept.</span>
      </label>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="btn btn-primary" type="button" disabled={!files.length || busy} onClick={upload}>
          {busy ? 'Uploading…' : `Upload${files.length ? ` ${files.length} file(s)` : ''}`}
        </button>
      </div>
    </div>
  );
}
