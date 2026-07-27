import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthSession } from '../lib/AuthContext';
import { getSessionReview } from '../lib/api';
import { formatDate } from '../lib/format';
import { ScoreBadge } from '../components/ScoreBadge';
import { QuestionResponseList } from '../components/QuestionResponseList';
import type { SessionReviewResponse } from '../lib/types';
import './SessionReview.css';

export function SessionReview() {
  const { sessionId } = useParams();
  const session = useAuthSession();
  const [data, setData] = useState<SessionReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<number | null>(null);

  useEffect(() => {
    getSessionReview(session.access_token, sessionId!)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load session review'));
  }, [sessionId, session.access_token]);

  const domainsInSession = useMemo(() => {
    if (!data) return [];
    const seen = new Map<number, string>();
    for (const item of data.items) seen.set(item.domain, item.domainName);
    return [...seen.entries()].sort(([a], [b]) => a - b);
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return domainFilter === null ? data.items : data.items.filter((i) => i.domain === domainFilter);
  }, [data, domainFilter]);

  if (error) {
    return (
      <p className="session-review__error" role="alert">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className="session-review__loading">Loading session review…</p>;
  }

  return (
    <div className="session-review">
      <Link to="/history" className="session-review__back">
        ← Back to history
      </Link>

      <div className="session-review__headline-row">
        <div>
          <p className="eyebrow">Session review</p>
          <h1 className="session-review__headline">{formatDate(data.session.startedAt)}</h1>
        </div>
        <ScoreBadge score={data.session.score ?? 0} passed={!!data.session.passed} />
      </div>

      <div className="session-review__filters">
        <button
          type="button"
          className={`session-review__filter${domainFilter === null ? ' session-review__filter--active' : ''}`}
          onClick={() => setDomainFilter(null)}
        >
          All domains
        </button>
        {domainsInSession.map(([domain, name]) => (
          <button
            key={domain}
            type="button"
            className={`session-review__filter${domainFilter === domain ? ' session-review__filter--active' : ''}`}
            onClick={() => setDomainFilter(domain)}
          >
            {name}
          </button>
        ))}
      </div>

      <QuestionResponseList mode="session" items={filteredItems} />

      <div className="session-review__footer">
        <Link to="/weak-areas" className="session-review__footer-link">
          View weak-area summary →
        </Link>
      </div>
    </div>
  );
}
