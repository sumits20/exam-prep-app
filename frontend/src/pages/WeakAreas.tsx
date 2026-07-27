import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthSession } from '../lib/AuthContext';
import { getDomainSummary, startDomainPractice } from '../lib/api';
import { domainColorVar } from '../lib/constants';
import type { DomainSummaryEntry } from '../lib/types';
import './WeakAreas.css';

export function WeakAreas() {
  const session = useAuthSession();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<DomainSummaryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [practicing, setPracticing] = useState<number | null>(null);

  useEffect(() => {
    getDomainSummary(session.access_token)
      .then((res) => setDomains(res.domains))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load weak-area summary'));
  }, [session.access_token]);

  async function handlePractice(domain: number) {
    setError(null);
    setPracticing(domain);
    try {
      const res = await startDomainPractice(session.access_token, domain);
      navigate(`/exam/${res.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start domain practice');
      setPracticing(null);
    }
  }

  if (error && !domains) {
    return (
      <p className="weak-areas__error" role="alert">
        {error}
      </p>
    );
  }

  if (!domains) {
    return <p className="weak-areas__loading">Loading weak-area summary…</p>;
  }

  return (
    <div className="weak-areas">
      <p className="eyebrow">Study focus</p>
      <h1 className="weak-areas__headline">Weak areas</h1>
      <p className="weak-areas__subhead">
        Accuracy across every completed session, weakest domain first. Practice a domain directly, or
        drill into exactly which questions you've missed.
      </p>

      {error && (
        <p className="weak-areas__error" role="alert">
          {error}
        </p>
      )}

      <div className="weak-areas__list">
        {domains.map((d) => (
          <div key={d.domain} className="card--raised weak-areas__card">
            <div className="weak-areas__card-head">
              <span className="weak-areas__domain-name" style={{ color: domainColorVar(d.domain) }}>
                {d.domainName}
              </span>
              <span className="weak-areas__accuracy">
                {d.accuracyPct === null ? 'Not attempted yet' : `${d.accuracyPct}%`}
              </span>
            </div>

            <p className="weak-areas__meta">
              {d.totalAttempted} question{d.totalAttempted === 1 ? '' : 's'} attempted
              {d.trend.length > 0 && ` across ${d.trend.length} session${d.trend.length === 1 ? '' : 's'}`}
            </p>

            {d.trend.length >= 2 && (
              <div className="weak-areas__trend" aria-hidden="true">
                {d.trend.map((point, i) => (
                  <span
                    key={i}
                    className="weak-areas__trend-bar"
                    style={{ height: `${Math.max(8, point.accuracyPct)}%`, background: domainColorVar(d.domain) }}
                    title={`${point.accuracyPct}%`}
                  />
                ))}
              </div>
            )}

            <div className="weak-areas__actions">
              <Link to={`/weak-areas/${d.domain}`} className="btn btn--ghost">
                Review questions
              </Link>
              <button
                type="button"
                className="btn btn--primary"
                disabled={practicing !== null}
                onClick={() => handlePractice(d.domain)}
              >
                {practicing === d.domain ? 'Starting…' : 'Practice this domain'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
