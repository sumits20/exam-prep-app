import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthSession } from '../lib/AuthContext';
import { createExamSession, getExamHistory, getExamTypes } from '../lib/api';
import { MAX_IN_PROGRESS_PER_EXAM_TYPE } from '../lib/constants';
import { describeExamShape } from '../lib/examShape';
import { formatDate } from '../lib/format';
import type { ExamType, HistorySession } from '../lib/types';
import './ExamPicker.css';

export function ExamPicker() {
  const session = useAuthSession();
  const navigate = useNavigate();
  const [examTypes, setExamTypes] = useState<ExamType[] | null>(null);
  const [inProgress, setInProgress] = useState<HistorySession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([getExamTypes(session.access_token), getExamHistory(session.access_token, { status: 'in_progress' })])
      .then(([typesRes, historyRes]) => {
        setExamTypes(typesRes.examTypes);
        setInProgress(historyRes.sessions);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load exam types'));
  }, [session.access_token]);

  async function handleStart(slug: string) {
    setError(null);
    setStarting(true);
    try {
      const res = await createExamSession(session.access_token, { examTypeSlug: slug });
      navigate(`/exam/${res.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start exam');
      setStarting(false);
    }
  }

  return (
    <div className="exam-picker">
      <p className="eyebrow">Practice exam</p>
      <h1 className="exam-picker__headline">Take an exam</h1>
      <p className="exam-picker__subhead">Choose an exam type to start a new paper, or pick up where you left off.</p>

      {error && (
        <p className="exam-picker__error" role="alert">
          {error}
        </p>
      )}

      {!examTypes && !error && <p className="exam-picker__loading">Loading exam types…</p>}

      <div className="exam-picker__list">
        {examTypes?.map((type) => {
          const inProgressForType = (inProgress ?? []).filter((s) => s.examTypeSlug === type.slug);
          const mostRecent = inProgressForType[0];
          const atCap = inProgressForType.length >= MAX_IN_PROGRESS_PER_EXAM_TYPE;

          return (
            <div key={type.id} className="card--raised exam-picker__card">
              <h2 className="exam-picker__card-name">{type.name}</h2>
              <p className="exam-picker__card-meta">{describeExamShape(type)}</p>

              <div className="exam-picker__card-actions">
                {mostRecent && (
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={starting}
                    onClick={() => navigate(`/exam/${mostRecent.id}`)}
                  >
                    Continue last exam
                  </button>
                )}
                <button
                  type="button"
                  className={mostRecent ? 'btn btn--ghost' : 'btn btn--primary'}
                  disabled={starting || atCap}
                  onClick={() => handleStart(type.slug)}
                >
                  {starting ? 'Starting…' : 'Start new exam'}
                </button>
              </div>

              {mostRecent && (
                <p className="exam-picker__in-progress-note">
                  Last opened {formatDate(mostRecent.startedAt)} · {inProgressForType.length} in progress
                  {atCap && ` — at the limit of ${MAX_IN_PROGRESS_PER_EXAM_TYPE}, finish or delete one on the `}
                  {atCap && (
                    <Link to="/history" className="exam-picker__history-link">
                      history page
                    </Link>
                  )}
                  {atCap && ' to start another'}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
