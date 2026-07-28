import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthSession } from '../lib/AuthContext';
import { answerQuestion, completeExamSession, getExamSession } from '../lib/api';
import type { GetSessionResponse, Option } from '../lib/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
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
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getExamSession(session.access_token, sessionId!)
      .then((res) => {
        if (cancelled) return;
        if (res.session.status !== 'in_progress') {
          navigate(`/exam/${sessionId}/summary`, { replace: true });
          return;
        }
        // Resume at the first unanswered question, not question 1. If every
        // question already has a selectedOption (answered but not yet
        // submitted), clamp to the last question rather than going out of bounds.
        const answeredCount = res.questions.filter((qq) => qq.selectedOption).length;
        const firstUnanswered = res.questions.findIndex((qq) => !qq.selectedOption);
        const resumeIndex = firstUnanswered === -1 ? res.questions.length - 1 : firstUnanswered;
        console.log(`[ExamSession] resume: ${answeredCount}/${res.questions.length} answered, starting at index ${resumeIndex}`);
        setIndex(resumeIndex);
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

  function handleSubmitClick() {
    // Always confirm — even with everything answered, submitting ends the
    // session and can't be undone, so it shouldn't go through on a single tap.
    setConfirmingSubmit(true);
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
  const isLastQuestion = index === questions.length - 1;
  const allAnswered = unansweredCount === 0;
  const submitIsPrimary = isLastQuestion || allAnswered;

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
        <div className="exam-session__nav-group">
          <button
            type="button"
            className="exam-session__nav-btn"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            &larr; Previous
          </button>
          <button
            type="button"
            className="exam-session__nav-btn"
            disabled={isLastQuestion}
            onClick={() => setIndex((i) => i + 1)}
          >
            Next &rarr;
          </button>
        </div>

        <div className="exam-session__submit-group">
          <span className="exam-session__answered">
            {answeredCount} of {questions.length} answered
          </span>
          <button
            type="button"
            className={`exam-session__submit-btn${submitIsPrimary ? ' exam-session__submit-btn--primary' : ' exam-session__submit-btn--muted'}`}
            disabled={submitting}
            onClick={handleSubmitClick}
          >
            {submitting ? 'Submitting…' : 'Submit exam'}
          </button>
        </div>
      </div>

      {confirmingSubmit && (
        <ConfirmDialog
          title={unansweredCount > 0 ? 'Submit with unanswered questions?' : 'Submit your exam?'}
          message={
            unansweredCount > 0
              ? `You have ${unansweredCount} unanswered question${unansweredCount === 1 ? '' : 's'}. ${unansweredCount === 1 ? 'It' : 'They'} will be scored as incorrect. Submit anyway?`
              : "You've answered every question. Submitting ends the session and can't be undone."
          }
          confirmLabel={unansweredCount > 0 ? 'Submit anyway' : 'Submit exam'}
          onConfirm={() => {
            setConfirmingSubmit(false);
            handleSubmit();
          }}
          onCancel={() => setConfirmingSubmit(false)}
        />
      )}
    </div>
  );
}
