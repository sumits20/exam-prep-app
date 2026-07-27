import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { getDomainNameMap, getExamDomains } from '../lib/examMetadata.js';

export const domainSummaryRouter = Router();

// Domain numbers aren't comparable across exam types (domain 1 in one exam type's
// weighting has nothing to do with domain 1 in another's), so every summary/drilldown
// query is scoped to a single exam type resolved from this required slug param.
async function resolveExamType(
  examTypeSlug: string | undefined
): Promise<{ id: string; domainCount: number } | { error: number; message: string }> {
  if (!examTypeSlug) {
    return { error: 400, message: 'examType query param is required' };
  }

  const { data, error } = await supabase
    .from('exam_types')
    .select('id, domain_count')
    .eq('slug', examTypeSlug)
    .maybeSingle();

  if (error || !data) {
    return { error: 404, message: `Unknown exam type: ${examTypeSlug}` };
  }

  return { id: data.id, domainCount: data.domain_count };
}

domainSummaryRouter.get('/', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { examType: examTypeSlug } = req.query as Record<string, string | undefined>;

  const examType = await resolveExamType(examTypeSlug);
  if ('error' in examType) {
    res.status(examType.error).json({ error: examType.message });
    return;
  }

  const { data: sessions, error } = await supabase
    .from('exam_sessions')
    .select('id, completed_at, domain_breakdown')
    .eq('user_id', userId)
    .eq('exam_type_id', examType.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch sessions for domain summary:', error.message);
    res.status(500).json({ error: 'Failed to fetch domain summary' });
    return;
  }

  const totals = new Map<number, { correct: number; total: number }>();
  const trends = new Map<number, { sessionId: string; completedAt: string; accuracyPct: number }[]>();

  for (const session of sessions ?? []) {
    const breakdown = (session.domain_breakdown ?? {}) as Record<string, { correct: number; total: number }>;
    for (const [domainStr, stats] of Object.entries(breakdown)) {
      const domain = Number(domainStr);
      const acc = totals.get(domain) ?? { correct: 0, total: 0 };
      acc.correct += stats.correct;
      acc.total += stats.total;
      totals.set(domain, acc);

      const trend = trends.get(domain) ?? [];
      trend.push({
        sessionId: session.id,
        completedAt: session.completed_at,
        accuracyPct: stats.total === 0 ? 0 : Math.round((100 * stats.correct) / stats.total),
      });
      trends.set(domain, trend);
    }
  }

  const examDomains = await getExamDomains(examType.id);

  const domains = examDomains.map(({ domainNumber, name }) => {
    const t = totals.get(domainNumber) ?? { correct: 0, total: 0 };
    return {
      domain: domainNumber,
      domainName: name,
      totalAttempted: t.total,
      totalCorrect: t.correct,
      accuracyPct: t.total === 0 ? null : Math.round((100 * t.correct) / t.total),
      trend: trends.get(domainNumber) ?? [],
    };
  });

  // Weakest-first: domains with no attempts yet sort last (nothing to be "weak" at).
  domains.sort((a, b) => {
    if (a.accuracyPct === null && b.accuracyPct === null) return 0;
    if (a.accuracyPct === null) return 1;
    if (b.accuracyPct === null) return -1;
    return a.accuracyPct - b.accuracyPct;
  });

  res.json({ domains });
});

domainSummaryRouter.get('/:domain/questions', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { examType: examTypeSlug } = req.query as Record<string, string | undefined>;
  const domain = Number(req.params.domain);

  const examType = await resolveExamType(examTypeSlug);
  if ('error' in examType) {
    res.status(examType.error).json({ error: examType.message });
    return;
  }

  if (!domain || domain < 1 || domain > examType.domainCount) {
    res.status(400).json({ error: `domain must be between 1 and ${examType.domainCount}` });
    return;
  }

  const domainNames = await getDomainNameMap(examType.id);

  const { data: sessions, error: sessionsError } = await supabase
    .from('exam_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('exam_type_id', examType.id)
    .eq('status', 'completed');

  if (sessionsError) {
    console.error('Failed to fetch sessions for domain drilldown:', sessionsError.message);
    res.status(500).json({ error: 'Failed to fetch domain questions' });
    return;
  }

  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) {
    res.json({ domain, domainName: domainNames[domain], items: [] });
    return;
  }

  const { data: answers, error: answersError } = await supabase
    .from('exam_answers')
    .select('*')
    .in('session_id', sessionIds)
    .eq('domain', domain)
    .not('answered_at', 'is', null)
    .order('answered_at', { ascending: false });

  if (answersError) {
    console.error('Failed to fetch exam_answers for domain drilldown:', answersError.message);
    res.status(500).json({ error: 'Failed to fetch domain questions' });
    return;
  }

  res.json({
    domain,
    domainName: domainNames[domain],
    items: (answers ?? []).map((a) => ({
      examAnswerId: a.id,
      sessionId: a.session_id,
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
      answeredAt: a.answered_at,
    })),
  });
});
