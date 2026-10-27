import { useState } from 'react';
import { Link } from 'react-router';
import { Loading, PageHead } from '../../components/bits';
import { api } from '../../core/client';
import { formatDateTime } from '../../core/format';
import { useAsync } from '../../core/use-async';

/** UC-8: every decision and change on every claim, newest first. */
export function AuditLog() {
  const history = useAsync(() => api.listHistory());
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const rows = (history.data ?? []).filter(
    (h) =>
      !q ||
      h.claimId.toLowerCase().includes(q) ||
      h.actor.toLowerCase().includes(q) ||
      h.event.toLowerCase().includes(q) ||
      h.text.toLowerCase().includes(q),
  );

  return (
    <>
      <PageHead title="History" sub="Every step and decision, so you can see how each claim reached its state." />
      <label className="search">
        Search
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Claim, person, event or text, e.g. review.completed"
        />
      </label>

      {history.loading ? (
        <Loading />
      ) : history.error ? (
        <p className="error">Could not load the history.</p>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Claim</th>
                <th>By</th>
                <th>Event</th>
                <th>What happened</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 200).map((h, i) => (
                <tr key={i}>
                  <td>{formatDateTime(h.at)}</td>
                  <td>
                    <Link to={`/claims/${h.claimId}`}>{h.claimId}</Link>
                  </td>
                  <td>{h.actor}</td>
                  <td>
                    <code className="event">{h.event}</code>
                  </td>
                  <td className="wrap">{h.text}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="muted">
                    Nothing found.
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
