import { supabase } from './supabase.js';
import { computeDomainTargets, getExamDomains, getStandardDrawScenarios } from './examMetadata.js';

export interface QuestionRow {
  id: number;
  exam_type_id: string;
  domain: number;
  domain_name: string;
  task_statement: string;
  scenario: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  rationale: string;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function groupByDomain(rows: QuestionRow[]): Map<number, QuestionRow[]> {
  const byDomain = new Map<number, QuestionRow[]>();
  for (const row of rows) {
    const list = byDomain.get(row.domain) ?? [];
    list.push(row);
    byDomain.set(row.domain, list);
  }
  return byDomain;
}

export function drawScenarios(scenarios: string[], count: number): string[] {
  return shuffle(scenarios).slice(0, count);
}

async function fetchActiveQuestions(examTypeId: string): Promise<QuestionRow[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_type_id', examTypeId)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to fetch questions for paper generation: ${error.message}`);
  }

  return (data ?? []) as QuestionRow[];
}

// Not every 4-of-6 scenario draw has enough questions in every domain to hit the exact
// weighted targets (some scenarios are domain-heavy) — this tries an exact weighted sample
// against a scenario draw, returning null if that specific draw can't satisfy every domain.
function tryExactWeightedSample(
  pool: QuestionRow[],
  scenarios: string[],
  domainTargets: Record<number, number>
): QuestionRow[] | null {
  const scenarioFiltered = pool.filter((q) => scenarios.includes(q.scenario));
  const byDomain = groupByDomain(scenarioFiltered);

  for (const [domainStr, target] of Object.entries(domainTargets)) {
    if ((byDomain.get(Number(domainStr))?.length ?? 0) < target) {
      return null;
    }
  }

  const selected: QuestionRow[] = [];
  for (const [domainStr, target] of Object.entries(domainTargets)) {
    const pool = byDomain.get(Number(domainStr))!;
    selected.push(...shuffle(pool).slice(0, target));
  }

  return shuffle(selected);
}

// Last-resort fallback for the rare case no scenario draw hits the exact weighting after many
// tries: take everything available per domain (capped at its target) and redistribute the
// shortfall across domains with spare capacity, so the paper still totals totalQuestions.
function fallbackWeightedSample(
  pool: QuestionRow[],
  scenarios: string[],
  domainTargets: Record<number, number>,
  totalQuestions: number
): QuestionRow[] {
  const scenarioFiltered = pool.filter((q) => scenarios.includes(q.scenario));
  const byDomain = groupByDomain(scenarioFiltered);

  const allocation: Record<number, number> = {};
  let shortfall = 0;

  for (const [domainStr, target] of Object.entries(domainTargets)) {
    const domain = Number(domainStr);
    const available = byDomain.get(domain)?.length ?? 0;
    const take = Math.min(available, target);
    allocation[domain] = take;
    shortfall += target - take;
  }

  while (shortfall > 0) {
    let bestDomain: number | null = null;
    let bestSpare = 0;
    for (const domainStr of Object.keys(domainTargets)) {
      const domain = Number(domainStr);
      const spare = (byDomain.get(domain)?.length ?? 0) - allocation[domain];
      if (spare > bestSpare) {
        bestSpare = spare;
        bestDomain = domain;
      }
    }
    if (bestDomain === null) {
      throw new Error(
        `Not enough active questions across scenarios [${scenarios.join(', ')}] to build a ` +
          `${totalQuestions}-question paper (short by ${shortfall})`
      );
    }
    allocation[bestDomain] += 1;
    shortfall -= 1;
  }

  const selected: QuestionRow[] = [];
  for (const [domainStr, count] of Object.entries(allocation)) {
    selected.push(...shuffle(byDomain.get(Number(domainStr)) ?? []).slice(0, count));
  }

  return shuffle(selected);
}

export async function generateStandardPaper(
  examTypeId: string
): Promise<{ scenarios: string[]; questions: QuestionRow[] }> {
  const [pool, standardScenarios, domains, examType] = await Promise.all([
    fetchActiveQuestions(examTypeId),
    getStandardDrawScenarios(examTypeId),
    getExamDomains(examTypeId),
    fetchExamTypeShape(examTypeId),
  ]);

  const totalQuestions = examType.questionCount;
  const scenariosPerPaper = examType.scenariosDrawn;
  const domainTargets = computeDomainTargets(domains, totalQuestions);

  const MAX_ATTEMPTS = 40;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const scenarios = drawScenarios(standardScenarios, scenariosPerPaper);
    const questions = tryExactWeightedSample(pool, scenarios, domainTargets);
    if (questions) {
      return { scenarios, questions };
    }
  }

  const scenarios = drawScenarios(standardScenarios, scenariosPerPaper);
  return { scenarios, questions: fallbackWeightedSample(pool, scenarios, domainTargets, totalQuestions) };
}

async function fetchExamTypeShape(examTypeId: string): Promise<{ questionCount: number; scenariosDrawn: number }> {
  const { data, error } = await supabase
    .from('exam_types')
    .select('question_count, scenarios_drawn')
    .eq('id', examTypeId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to fetch exam_types row for ${examTypeId}: ${error?.message ?? 'not found'}`);
  }

  return { questionCount: data.question_count, scenariosDrawn: data.scenarios_drawn };
}

export async function sampleDomainQuestions(examTypeId: string, domain: number): Promise<QuestionRow[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_type_id', examTypeId)
    .eq('is_active', true)
    .eq('domain', domain);

  if (error) {
    throw new Error(`Failed to fetch questions for domain practice: ${error.message}`);
  }

  const rows = (data ?? []) as QuestionRow[];
  if (rows.length === 0) {
    throw new Error(`No active questions found for domain ${domain}`);
  }

  // Cap a domain-practice session at the same size as a standard paper for this exam type,
  // rather than a hardcoded 60 — mirrors the exam type's own question_count.
  const { questionCount } = await fetchExamTypeShape(examTypeId);
  return shuffle(rows).slice(0, Math.min(questionCount, rows.length));
}
