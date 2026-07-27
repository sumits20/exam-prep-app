import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthSession } from '../lib/AuthContext';
import { getExamSession } from '../lib/api';
import { DOMAIN_NAMES, DOMAIN_NUMBERS, domainColorVar } from '../lib/constants';
import { formatDate } from '../lib/format';
import type { SessionMeta } from '../lib/types';
import { ScoreBadge } from '../components/ScoreBadge';
import './ExamSummary.css';

export function ExamSummary() {
  const { sessionId } = useParams();
  const session = useAuthSession();
  const navigate = useNavigate();
  const [meta, setMeta] = useState<SessionMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getExamSession(session.access_token, sessionId!)
      .then((res) => {
        if (cancelled) return;
        if (res.session.status === 'in_progress') {
          navigate(`/exam/${sessionId}`, { replace: true });
          return;
        }
        setMeta(res.session);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load summary'));
    return () => {
      cancelled = true;
    };
  }, [sessionId, session.access_token, navigate]);

  if (error) {
    return (
      <p className="exam-summary__error" role="alert">
        {error}
      </p>
    );
  }

  if (!meta) {
    return <p className="exam-summary__loading">Loading summary…</p>;
  }

  const breakdown = meta.domainBreakdown ?? {};

  return (
    <div className="exam-summary">
      <p className="eyebrow">Result</p>
      <div className="exam-summary__headline-row">
        <h1 className="exam-summary__headline">Exam complete</h1>
        <ScoreBadge score={meta.score ?? 0} passed={!!meta.passed} />
      </div>
      <p className="exam-summary__threshold">
        {formatDate(meta.startedAt)} · Passing threshold {meta.passingThresholdPct}%
      </p>

      <div className="card--raised exam-summary__domains">
        <h2 className="exam-summary__section-title">Accuracy by domain</h2>
        {DOMAIN_NUMBERS.map((domain) => {
          const stats = breakdown[String(domain)];
          const pct = stats && stats.total > 0 ? Math.round((100 * stats.correct) / stats.total) : null;
          return (
            <div key={domain} className="exam-summary__domain-row">
              <span className="exam-summary__domain-name" style={{ color: domainColorVar(domain) }}>
                {DOMAIN_NAMES[domain]}
              </span>
              <span className="exam-summary__domain-stat">
                {stats ? `${stats.correct}/${stats.total}` : '—'} {pct !== null ? `(${pct}%)` : ''}
              </span>
            </div>
          );
        })}
      </div>

      <div className="exam-summary__actions">
        <Link to={`/history/${meta.id}`} className="btn btn--primary">
          Review answers
        </Link>
        <Link to="/exam" className="btn btn--ghost">
          Take another exam
        </Link>
        <Link to="/weak-areas" className="btn btn--ghost">
          View weak areas
        </Link>
      </div>
    </div>
  );
}
