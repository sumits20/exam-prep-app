import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthSession } from '../lib/AuthContext';
import { deleteExamSession, getExamHistory } from '../lib/api';
import { formatDate, formatDuration } from '../lib/format';
import { ScoreBadge } from '../components/ScoreBadge';
import type { HistorySession } from '../lib/types';
import './History.css';

type PassFail = '' | 'pass' | 'fail';
type Sort = 'date_desc' | 'score_desc';

export function History() {
  const session = useAuthSession();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<HistorySession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passFail, setPassFail] = useState<PassFail>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<Sort>('date_desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getExamHistory(session.access_token, {
      passFail: passFail || undefined,
      from: from || undefined,
      to: to || undefined,
      sort,
    })
      .then((res) => setSessions(res.sessions))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load history'));
  }, [session.access_token, passFail, from, to, sort]);

  async function handleDelete(s: HistorySession) {
    const confirmed = window.confirm(
      `Delete this in-progress exam session from ${formatDate(s.startedAt)}? This cannot be undone.`
    );
    if (!confirmed) return;

    setError(null);
    setDeletingId(s.id);
    try {
      await deleteExamSession(session.access_token, s.id);
      setSessions((prev) => (prev ? prev.filter((row) => row.id !== s.id) : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exam session');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="history">
      <p className="eyebrow">Past attempts</p>
      <h1 className="history__headline">Exam history</h1>

      <div className="history__filters">
        <label className="history__filter">
          <span>Result</span>
          <select value={passFail} onChange={(e) => setPassFail(e.target.value as PassFail)}>
            <option value="">All</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
        </label>
        <label className="history__filter">
          <span>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="history__filter">
          <span>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="history__filter">
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="date_desc">Most recent</option>
            <option value="score_desc">Highest score</option>
          </select>
        </label>
      </div>

      {error && (
        <p className="history__error" role="alert">
          {error}
        </p>
      )}

      {!sessions && !error && <p className="history__loading">Loading history…</p>}

      {sessions && sessions.length === 0 && <p className="history__empty">No exam sessions yet.</p>}

      {sessions && sessions.length > 0 && (
        <div className="card--raised history__table-wrap">
          <table className="history__table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Exam type</th>
                <th>Score</th>
                <th>Duration</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const target = s.status === 'completed' ? `/history/${s.id}` : s.status === 'in_progress' ? `/exam/${s.id}` : null;
                return (
                  <tr
                    key={s.id}
                    className={`history__row${target ? ' history__row--clickable' : ''}`}
                    onClick={target ? () => navigate(target) : undefined}
                  >
                    <td>{formatDate(s.startedAt)}</td>
                    <td>{s.examTypeName ?? '—'}</td>
                    <td>{s.score !== null ? <ScoreBadge score={s.score} passed={!!s.passed} /> : '—'}</td>
                    <td>{formatDuration(s.durationSeconds)}</td>
                    <td className="history__status">{s.status.replace('_', ' ')}</td>
                    <td className="history__actions">
                      {s.status === 'in_progress' && (
                        <>
                          <button
                            type="button"
                            className="history__continue"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/exam/${s.id}`);
                            }}
                          >
                            Continue
                          </button>
                          <button
                            type="button"
                            className="history__delete"
                            disabled={deletingId === s.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(s);
                            }}
                          >
                            {deletingId === s.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
