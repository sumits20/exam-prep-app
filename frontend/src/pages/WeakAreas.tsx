import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthSession } from '../lib/AuthContext';
import { getDomainSummary, getExamHistory, getExamTypes, startDomainPractice } from '../lib/api';
import { domainColorVar } from '../lib/constants';
import type { DomainSummaryEntry, ExamType } from '../lib/types';
import './WeakAreas.css';

export function WeakAreas() {
  const session = useAuthSession();
  const navigate = useNavigate();
  const [examTypes, setExamTypes] = useState<ExamType[] | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [domains, setDomains] = useState<DomainSummaryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [practicing, setPracticing] = useState<number | null>(null);

  // Domain numbers aren't comparable across exam types, so the summary is always scoped
  // to one exam type — default to the first one with completed history, only surfacing
  // tabs at all once there's more than one type to choose between.
  useEffect(() => {
    Promise.all([getExamTypes(session.access_token), getExamHistory(session.access_token, { status: 'completed' })])
      .then(([typesRes, historyRes]) => {
        const slugsWithHistory = new Set(historyRes.sessions.map((s) => s.examTypeSlug).filter(Boolean));
        const withHistory = typesRes.examTypes.filter((t) => slugsWithHistory.has(t.slug));
        setExamTypes(typesRes.examTypes);
        setSelectedSlug((withHistory[0] ?? typesRes.examTypes[0])?.slug ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load exam types'));
  }, [session.access_token]);

  useEffect(() => {
    if (!selectedSlug) return;
    setDomains(null);
    getDomainSummary(session.access_token, selectedSlug)
      .then((res) => setDomains(res.domains))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load weak-area summary'));
  }, [session.access_token, selectedSlug]);

  async function handlePractice(domain: number) {
    if (!selectedSlug) return;
    setError(null);
    setPracticing(domain);
    try {
      const res = await startDomainPractice(session.access_token, selectedSlug, domain);
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

  if (!examTypes || !selectedSlug || !domains) {
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

      {examTypes.length > 1 && (
        <div className="weak-areas__tabs">
          {examTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              className={`weak-areas__tab${type.slug === selectedSlug ? ' weak-areas__tab--active' : ''}`}
              onClick={() => setSelectedSlug(type.slug)}
            >
              {type.name}
            </button>
          ))}
        </div>
      )}

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
              <Link to={`/weak-areas/${selectedSlug}/${d.domain}`} className="btn btn--ghost">
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
