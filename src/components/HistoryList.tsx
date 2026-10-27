import { formatDateTime } from '../core/format';
import type { HistoryEvent } from '../core/models';

/** Claim history, oldest first. Staff also see the technical event name. */
export function HistoryList({ events, showEvents }: { events: HistoryEvent[]; showEvents: boolean }) {
  if (!events.length) return <p className="muted">No history yet.</p>;
  return (
    <ol className="timeline">
      {events.map((e, i) => (
        <li key={i}>
          <div className="timeline-head">
            <strong>{e.actor}</strong>
            <span className="muted small">{formatDateTime(e.at)}</span>
          </div>
          <p>{e.text}</p>
          {showEvents && <code className="event">{e.event}</code>}
        </li>
      ))}
    </ol>
  );
}
