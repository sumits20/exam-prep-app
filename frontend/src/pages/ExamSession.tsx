import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthSession } from '../lib/AuthContext';
import { answerQuestion, completeExamSession, getExamSession } from '../lib/api';
import type { GetSessionResponse, Option } from '../lib/types';
import { DomainChip } from '../components/DomainChip';
import { SegmentedProgressBar } from '../components/SegmentedProgressBar';
import './ExamSession.css';

const OPTION_KEYS: Option[] = ['A', 'B', 'C', 'D'];

export function ExamSession() {
  const { sessionId } = useParams();
  const session = useAuthSession();
  const navigate = useNavigate();
  const [data, setData] = useState<GetSessionResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getExamSession(session.access_token, sessionId!)
      .then((res) => {
        if (cancelled) return;
        if (res.session.status !== 'in_progress') {
          navigate(`/exam/${sessionId}/summary`, { replace: true });
          return;
        }
        setData(res);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load exam session'));
    return () => {
      cancelled = true;
    };
  }, [sessionId, session.access_token, navigate]);

  async function selectOption(examAnswerId: string, option: Option) {
    setData((prev) =>
      prev
        ? { ...prev, questions: prev.questions.map((q) => (q.examAnswerId === examAnswerId ? { ...q, selectedOption: option } : q)) }
        : prev
    );
    try {
      await answerQuestion(session.access_token, sessionId!, examAnswerId, option);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save answer');
    }
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await completeExamSession(session.access_token, sessionId!);
      navigate(`/exam/${sessionId}/summary`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit exam');
      setSubmitting(false);
    }
  }

  if (error && !data) {
    return (
      <p className="exam-session__error" role="alert">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className="exam-session__loading">Loading exam…</p>;
  }

  const questions = data.questions;
  const q = questions[index];
  const answeredCount = questions.filter((qq) => qq.selectedOption).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="exam-session">
      <div className="exam-session__topline">
        <DomainChip domain={q.domain} label={q.domainName} />
        <span className="exam-session__counter">
          Question {index + 1} of {questions.length}
        </span>
      </div>

      <SegmentedProgressBar segments={questions.map((qq) => ({ domain: qq.domain, answered: !!qq.selectedOption }))} />

      <div className="card--raised exam-session__question">
        <p className="exam-session__scenario">{q.scenario}</p>
        <p className="exam-session__stem">{q.questionText}</p>
        <div className="exam-session__options">
          {OPTION_KEYS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`exam-session__option${q.selectedOption === opt ? ' exam-session__option--selected' : ''}`}
              onClick={() => selectOption(q.examAnswerId, opt)}
            >
              <span className="exam-session__option-key">{opt}</span>
              <span className="exam-session__option-text">{q.options[opt]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="exam-session__error" role="alert">
          {error}
        </p>
      )}

      <div className="exam-session__nav">
        <button type="button" className="btn btn--ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          Previous
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={index === questions.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          Next
        </button>
        <span className="exam-session__answered">
          {answeredCount} of {questions.length} answered
        </span>
        <button type="button" className="btn btn--primary" disabled={submitting} onClick={handleSubmit}>
          {submitting
            ? 'Submitting…'
            : unansweredCount > 0
              ? `Submit exam (${unansweredCount} unanswered)`
              : 'Submit exam'}
        </button>
      </div>
    </div>
  );
}
