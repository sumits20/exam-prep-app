export const SCENARIOS = [
  'Customer Support Resolution Agent',
  'Code Generation with Claude Code',
  'Multi-Agent Research System',
  'Developer Productivity',
  'Claude Code for CI',
  'Structured Data Extraction',
] as const;

export const SCENARIOS_PER_PAPER = 4;
export const TOTAL_QUESTIONS = 60;

// Domain 1: 27%, Domain 2: 18%, Domain 3: 20%, Domain 4: 20%, Domain 5: 15% of 60 — sums to 60.
export const DOMAIN_TARGETS: Record<number, number> = { 1: 16, 2: 11, 3: 12, 4: 12, 5: 9 };

// exam_answers only snapshots the numeric `domain`, not `domain_name` — this mirrors the
// stable domain_name values from the `questions` table so review/summary views can label them
// without an extra join.
export const DOMAIN_NAMES: Record<number, string> = {
  1: 'Agentic Architecture & Orchestration',
  2: 'Tool Design & MCP Integration',
  3: 'Claude Code Configuration & Workflows',
  4: 'Prompt Engineering & Structured Output',
  5: 'Context Management & Reliability',
};

// No pass/fail threshold is defined anywhere in the schema — 72% is a product decision,
// centralized here so every response that reports pass/fail uses the same number.
export const PASSING_THRESHOLD_PCT = 72;

// Caps how many in_progress sessions a user can accumulate per exam type, so
// abandoned/forgotten sessions don't pile up indefinitely.
export const MAX_IN_PROGRESS_PER_EXAM_TYPE = 5;
