// Mirrors backend/src/lib/examConstants.ts DOMAIN_NAMES — exam_answers only snapshots the
// numeric domain, so display names are looked up client-side too.
export const DOMAIN_NAMES: Record<number, string> = {
  1: 'Agentic Architecture & Orchestration',
  2: 'Tool Design & MCP Integration',
  3: 'Claude Code Configuration & Workflows',
  4: 'Prompt Engineering & Structured Output',
  5: 'Context Management & Reliability',
};

export const DOMAIN_NUMBERS = [1, 2, 3, 4, 5] as const;

// Mirrors backend/src/lib/examConstants.ts MAX_IN_PROGRESS_PER_EXAM_TYPE — used only for
// proactive UI messaging; the cap itself is enforced server-side in POST /exam-sessions.
export const MAX_IN_PROGRESS_PER_EXAM_TYPE = 5;

export function domainColorVar(domain: number): string {
  return `var(--domain-${domain})`;
}
