import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { MAX_IN_PROGRESS_PER_EXAM_TYPE, PASSING_THRESHOLD_PCT } from '../lib/examConstants.js';
import { getDomainNameMap } from '../lib/examMetadata.js';
import { generateStandardPaper, sampleDomainQuestions } from '../lib/paperGeneration.js';
import type { QuestionRow } from '../lib/paperGeneration.js';

export const examSessionsRouter = Router();

interface ExamAnswerRow {
  id: string;
  session_id: string;
  question_id: number;
  selected_option: 'A' | 'B' | 'C' | 'D' | null;
  is_correct: boolean | null;
  answered_at: string | null;
  question_text: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  rationale: string;
  domain: number;
  scenario: string;
}

interface ExamSessionRow {
  id: string;
  user_id: string;
  exam_type_id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at: string | null;
  scenario_selection: string[];
  question_ids: number[];
  score: number | null;
  domain_breakdown: Record<string, { correct: number; total: number }> | null;
}

async function loadOwnedSession(sessionId: string, userId: string): Promise<ExamSessionRow | null> {
  const { data, error } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch exam_sessions row: ${error.message}`);
  }

  return data as ExamSessionRow | null;
}

function durationSeconds(startedAt: string, completedAt: string | null): number | null {
  if (!completedAt) return null;
  return Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000);
}

examSessionsRouter.post('/', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { examTypeSlug, mode, domain } = req.body as {
    examTypeSlug?: string;
    mode?: 'standard' | 'domain-practice';
    domain?: number;
  };

  if (!examTypeSlug) {
    res.status(400).json({ error: 'examTypeSlug is required' });
    return;
  }

  const { data: examType, error: examTypeError } = await supabase
    .from('exam_types')
    .select('id, domain_count')
    .eq('slug', examTypeSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (examTypeError || !examType) {
    res.status(404).json({ error: `Unknown exam type: ${examTypeSlug}` });
    return;
  }

  if (mode === 'domain-practice' && (!domain || domain < 1 || domain > examType.domain_count)) {
    res.status(400).json({ error: `domain (1-${examType.domain_count}) is required for domain-practice mode` });
    return;
  }

  const { count: inProgressCount, error: countError } = await supabase
    .from('exam_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('exam_type_id', examType.id)
    .eq('status', 'in_progress');

  if (countError) {
    console.error('Failed to count in-progress sessions:', countError.message);
    res.status(500).json({ error: 'Failed to create exam session' });
    return;
  }

  if ((inProgressCount ?? 0) >= MAX_IN_PROGRESS_PER_EXAM_TYPE) {
    res.status(409).json({
      error:
        `You have ${MAX_IN_PROGRESS_PER_EXAM_TYPE} exams in progress for this exam type — ` +
        'finish or delete one to start another.',
    });
    return;
  }

  let questions: QuestionRow[];
  let scenarioSelection: string[];

  try {
    if (mode === 'domain-practice') {
      questions = await sampleDomainQuestions(examType.id, domain!);
      scenarioSelection = ['domain-practice'];
    } else {
      const paper = await generateStandardPaper(examType.id);
      scenarioSelection = paper.scenarios;
      questions = paper.questions;
    }
  } catch (err) {
    console.error('Paper generation failed:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Paper generation failed' });
    return;
  }

  const { data: session, error: sessionError } = await supabase
    .from('exam_sessions')
    .insert({
      user_id: userId,
      exam_type_id: examType.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      scenario_selection: scenarioSelection,
      question_ids: questions.map((q) => q.id),
    })
    .select('*')
    .single();

  if (sessionError || !session) {
    console.error('Failed to insert exam_sessions row:', sessionError?.message);
    res.status(500).json({ error: 'Failed to create exam session' });
    return;
  }

  const answerRows = questions.map((q) => ({
    session_id: session.id,
    question_id: q.id,
    question_text: q.question_text,
    options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
    correct_answer: q.correct_answer,
    rationale: q.rationale,
    domain: q.domain,
    scenario: q.scenario,
  }));

  const { data: insertedAnswers, error: answersError } = await supabase
    .from('exam_answers')
    .insert(answerRows)
    .select('id, question_id');

  if (answersError || !insertedAnswers) {
    console.error('Failed to insert exam_answers rows:', answersError?.message);
    // Best-effort cleanup so a failed paper generation doesn't leave an orphan in_progress session.
    await supabase.from('exam_sessions').delete().eq('id', session.id);
    res.status(500).json({ error: 'Failed to create exam session' });
    return;
  }

  const examAnswerIdByQuestionId = new Map(insertedAnswers.map((r) => [r.question_id, r.id]));

  res.status(201).json({
    session: {
      id: session.id,
      status: session.status,
      startedAt: session.started_at,
      scenarioSelection: session.scenario_selection,
    },
    questions: questions.map((q) => ({
      examAnswerId: examAnswerIdByQuestionId.get(q.id),
      questionId: q.id,
      domain: q.domain,
      domainName: q.domain_name,
      taskStatement: q.task_statement,
      scenario: q.scenario,
      questionText: q.question_text,
      options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
    })),
  });
});

examSessionsRouter.get('/', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { examType, passFail, from, to, sort, status } = req.query as Record<string, string | undefined>;

  // `!inner` is required for `.eq('exam_types.slug', ...)` to actually restrict rows —
  // on a plain left-joined embed, filtering on the embedded table is silently a no-op.
  // Only switch to the inner join when actually filtering, so an unfiltered request still
  // returns every session (there's no case today where exam_types would be missing, but no
  // reason to risk dropping rows via an inner join when nothing asked for it).
  const embed = examType ? 'exam_types!inner(slug, name)' : 'exam_types(slug, name)';
  let query = supabase
    .from('exam_sessions')
    .select(`id, status, started_at, completed_at, score, domain_breakdown, ${embed}`)
    .eq('user_id', userId);

  if (examType) {
    query = query.eq('exam_types.slug', examType);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (from) {
    query = query.gte('started_at', from);
  }
  if (to) {
    query = query.lte('started_at', to);
  }

  query =
    sort === 'score_desc'
      ? query.order('score', { ascending: false, nullsFirst: false })
      : query.order('started_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch exam_sessions list:', error.message);
    res.status(500).json({ error: 'Failed to fetch exam history' });
    return;
  }

  let sessions = (data ?? []).map((row: any) => ({
    id: row.id,
    examTypeName: row.exam_types?.name ?? null,
    examTypeSlug: row.exam_types?.slug ?? null,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationSeconds: durationSeconds(row.started_at, row.completed_at),
    score: row.score,
    passed: row.score === null ? null : row.score >= PASSING_THRESHOLD_PCT,
    passingThresholdPct: PASSING_THRESHOLD_PCT,
    domainBreakdown: row.domain_breakdown,
  }));

  if (passFail === 'pass') {
    sessions = sessions.filter((s) => s.passed === true);
  } else if (passFail === 'fail') {
    sessions = sessions.filter((s) => s.passed === false);
  }

  res.json({ sessions });
});

examSessionsRouter.delete('/:id', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const sessionId = req.params.id;

  const session = await loadOwnedSession(sessionId, userId).catch(() => undefined);
  if (session === undefined) {
    res.status(500).json({ error: 'Failed to delete exam session' });
    return;
  }
  if (!session) {
    res.status(404).json({ error: 'Exam session not found' });
    return;
  }

  // Server-side enforced regardless of what the frontend sends — only sessions
  // still in progress can be deleted, so completed history is never lost.
  if (session.status !== 'in_progress') {
    res.status(403).json({ error: 'Only in-progress sessions can be deleted.' });
    return;
  }

  const { error: answersDeleteError } = await supabase.from('exam_answers').delete().eq('session_id', sessionId);

  if (answersDeleteError) {
    console.error('Failed to delete exam_answers for session:', answersDeleteError.message);
    res.status(500).json({ error: 'Failed to delete exam session' });
    return;
  }

  const { error: sessionDeleteError } = await supabase.from('exam_sessions').delete().eq('id', sessionId);

  if (sessionDeleteError) {
    console.error('Failed to delete exam_sessions row:', sessionDeleteError.message);
    res.status(500).json({ error: 'Failed to delete exam session' });
    return;
  }

  res.json({ deleted: true });
});

examSessionsRouter.get('/:id', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const sessionId = req.params.id;

  const session = await loadOwnedSession(sessionId, userId).catch((err) => {
    console.error(err);
    return undefined;
  });

  if (session === undefined) {
    res.status(500).json({ error: 'Failed to fetch exam session' });
    return;
  }
  if (!session) {
    res.status(404).json({ error: 'Exam session not found' });
    return;
  }

  const { data: answers, error: answersError } = await supabase
    .from('exam_answers')
    .select('*')
    .eq('session_id', sessionId);

  if (answersError) {
    console.error('Failed to fetch exam_answers:', answersError.message);
    res.status(500).json({ error: 'Failed to fetch exam session' });
    return;
  }

  const domainNames = await getDomainNameMap(session.exam_type_id);
  const byQuestionId = new Map((answers as ExamAnswerRow[]).map((a) => [a.question_id, a]));
  const inProgress = session.status === 'in_progress';

  const questions = session.question_ids.map((qid) => {
    const a = byQuestionId.get(qid);
    if (!a) return null;
    return {
      examAnswerId: a.id,
      questionId: a.question_id,
      domain: a.domain,
      domainName: domainNames[a.domain],
      scenario: a.scenario,
      questionText: a.question_text,
      options: a.options,
      selectedOption: a.selected_option,
      ...(inProgress ? {} : { correctAnswer: a.correct_answer, isCorrect: a.is_correct, rationale: a.rationale }),
    };
  });

  res.json({
    session: {
      id: session.id,
      status: session.status,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      score: session.score,
      passed: session.score === null ? null : session.score >= PASSING_THRESHOLD_PCT,
      passingThresholdPct: PASSING_THRESHOLD_PCT,
      scenarioSelection: session.scenario_selection,
      domainBreakdown: session.domain_breakdown,
    },
    questions,
  });
});

examSessionsRouter.patch('/:id/answers/:examAnswerId', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const sessionId = req.params.id;
  const examAnswerId = req.params.examAnswerId;
  const { selectedOption } = req.body as { selectedOption?: 'A' | 'B' | 'C' | 'D' };

  if (!selectedOption || !['A', 'B', 'C', 'D'].includes(selectedOption)) {
    res.status(400).json({ error: 'selectedOption must be one of A, B, C, D' });
    return;
  }

  const session = await loadOwnedSession(sessionId, userId).catch(() => undefined);
  if (session === undefined) {
    res.status(500).json({ error: 'Failed to submit answer' });
    return;
  }
  if (!session) {
    res.status(404).json({ error: 'Exam session not found' });
    return;
  }
  if (session.status !== 'in_progress') {
    res.status(409).json({ error: 'Exam session is no longer in progress' });
    return;
  }

  const { data: answerRow, error: answerFetchError } = await supabase
    .from('exam_answers')
    .select('id, session_id, correct_answer')
    .eq('id', examAnswerId)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (answerFetchError || !answerRow) {
    res.status(404).json({ error: 'Answer row not found for this session' });
    return;
  }

  const { error: updateError } = await supabase
    .from('exam_answers')
    .update({
      selected_option: selectedOption,
      is_correct: selectedOption === answerRow.correct_answer,
      answered_at: new Date().toISOString(),
    })
    .eq('id', examAnswerId);

  if (updateError) {
    console.error('Failed to update exam_answers row:', updateError.message);
    res.status(500).json({ error: 'Failed to submit answer' });
    return;
  }

  const { count, error: countError } = await supabase
    .from('exam_answers')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .not('answered_at', 'is', null);

  if (countError) {
    console.error('Failed to count answered questions:', countError.message);
  }

  res.json({
    examAnswerId,
    selectedOption,
    answeredCount: count ?? undefined,
    totalQuestions: session.question_ids.length,
  });
});

examSessionsRouter.post('/:id/complete', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const sessionId = req.params.id;

  const session = await loadOwnedSession(sessionId, userId).catch(() => undefined);
  if (session === undefined) {
    res.status(500).json({ error: 'Failed to complete exam session' });
    return;
  }
  if (!session) {
    res.status(404).json({ error: 'Exam session not found' });
    return;
  }
  if (session.status !== 'in_progress') {
    res.status(409).json({ error: 'Exam session is no longer in progress' });
    return;
  }

  const { data: answers, error: answersError } = await supabase
    .from('exam_answers')
    .select('domain, is_correct')
    .eq('session_id', sessionId);

  if (answersError || !answers) {
    console.error('Failed to fetch exam_answers for scoring:', answersError?.message);
    res.status(500).json({ error: 'Failed to complete exam session' });
    return;
  }

  // Unanswered questions (selected_option/is_correct still null) score as incorrect —
  // early submit is allowed, so blanks count against the score rather than blocking submission.
  const domainBreakdown: Record<string, { correct: number; total: number }> = {};
  let correctCount = 0;

  for (const row of answers as { domain: number; is_correct: boolean | null }[]) {
    const key = String(row.domain);
    domainBreakdown[key] ??= { correct: 0, total: 0 };
    domainBreakdown[key].total += 1;
    if (row.is_correct) {
      domainBreakdown[key].correct += 1;
      correctCount += 1;
    }
  }

  const score = Math.round((100 * correctCount) / (answers.length || 1));
  const completedAt = new Date().toISOString();

  const { data: updatedSession, error: updateError } = await supabase
    .from('exam_sessions')
    .update({ status: 'completed', completed_at: completedAt, score, domain_breakdown: domainBreakdown })
    .eq('id', sessionId)
    .select('*')
    .single();

  if (updateError || !updatedSession) {
    console.error('Failed to update exam_sessions on complete:', updateError?.message);
    res.status(500).json({ error: 'Failed to complete exam session' });
    return;
  }

  const passed = score >= PASSING_THRESHOLD_PCT;

  res.json({
    session: {
      id: updatedSession.id,
      status: updatedSession.status,
      startedAt: updatedSession.started_at,
      completedAt: updatedSession.completed_at,
      score: updatedSession.score,
    },
    passed,
    passingThresholdPct: PASSING_THRESHOLD_PCT,
    domainBreakdown,
  });
});

examSessionsRouter.get('/:id/review', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const sessionId = req.params.id;

  const session = await loadOwnedSession(sessionId, userId).catch(() => undefined);
  if (session === undefined) {
    res.status(500).json({ error: 'Failed to fetch session review' });
    return;
  }
  if (!session) {
    res.status(404).json({ error: 'Exam session not found' });
    return;
  }
  if (session.status !== 'completed') {
    res.status(409).json({ error: 'Session review is only available once a session is completed' });
    return;
  }

  const { data: answers, error: answersError } = await supabase
    .from('exam_answers')
    .select('*')
    .eq('session_id', sessionId);

  if (answersError || !answers) {
    console.error('Failed to fetch exam_answers for review:', answersError?.message);
    res.status(500).json({ error: 'Failed to fetch session review' });
    return;
  }

  const { data: otherSessions, error: otherSessionsError } = await supabase
    .from('exam_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .neq('id', sessionId);

  if (otherSessionsError) {
    console.error('Failed to fetch other sessions:', otherSessionsError.message);
    res.status(500).json({ error: 'Failed to fetch session review' });
    return;
  }

  const otherSessionIds = (otherSessions ?? []).map((s) => s.id);

  const byQuestionId = new Map<number, { attempts: number; correct: number }>();
  const byDomain = new Map<number, { attempts: number; correct: number }>();

  if (otherSessionIds.length > 0) {
    const { data: pastAnswers, error: pastAnswersError } = await supabase
      .from('exam_answers')
      .select('question_id, domain, is_correct')
      .in('session_id', otherSessionIds)
      .not('answered_at', 'is', null);

    if (pastAnswersError) {
      console.error('Failed to fetch past answers for pattern data:', pastAnswersError.message);
      res.status(500).json({ error: 'Failed to fetch session review' });
      return;
    }

    for (const row of (pastAnswers ?? []) as { question_id: number; domain: number; is_correct: boolean | null }[]) {
      const q = byQuestionId.get(row.question_id) ?? { attempts: 0, correct: 0 };
      q.attempts += 1;
      if (row.is_correct) q.correct += 1;
      byQuestionId.set(row.question_id, q);

      const d = byDomain.get(row.domain) ?? { attempts: 0, correct: 0 };
      d.attempts += 1;
      if (row.is_correct) d.correct += 1;
      byDomain.set(row.domain, d);
    }
  }

  const domainNames = await getDomainNameMap(session.exam_type_id);
  const byQuestionIdCurrent = new Map((answers as ExamAnswerRow[]).map((a) => [a.question_id, a]));

  const items = session.question_ids.map((qid) => {
    const a = byQuestionIdCurrent.get(qid)!;
    const questionHistory = byQuestionId.get(qid) ?? { attempts: 0, correct: 0 };
    const domainHistoryRaw = byDomain.get(a.domain) ?? { attempts: 0, correct: 0 };

    return {
      examAnswerId: a.id,
      questionId: a.question_id,
      domain: a.domain,
      domainName: domainNames[a.domain],
      scenario: a.scenario,
      questionText: a.question_text,
      options: a.options,
      selectedOption: a.selected_option,
      correctAnswer: a.correct_answer,
      isCorrect: a.is_correct,
      rationale: a.rationale,
      questionHistory,
      domainHistory: {
        ...domainHistoryRaw,
        accuracyPct:
          domainHistoryRaw.attempts === 0 ? null : Math.round((100 * domainHistoryRaw.correct) / domainHistoryRaw.attempts),
      },
    };
  });

  res.json({
    session: {
      id: session.id,
      status: session.status,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      score: session.score,
      passed: session.score! >= PASSING_THRESHOLD_PCT,
      passingThresholdPct: PASSING_THRESHOLD_PCT,
    },
    items,
  });
});
