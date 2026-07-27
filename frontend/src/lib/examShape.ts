import type { ExamType } from './types';

const SMALL_NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

function numberWord(n: number): string {
  return n >= 0 && n < SMALL_NUMBER_WORDS.length ? SMALL_NUMBER_WORDS[n] : String(n);
}

// Composes a natural-language description of an exam's shape from its structural
// fields, rather than storing hand-written copy — stays correct automatically if
// question_count/scenarios_drawn/scenarios_total/domain_count ever change, and
// degrades gracefully (drops a clause) for exam types missing some of them.
export function describeExamShape(type: ExamType): string {
  let sentence = `A ${type.questionCount}-question timed paper`;

  const hasScenarioDraw = type.scenariosDrawn != null && type.scenariosTotal != null;
  if (hasScenarioDraw) {
    sentence += ` drawn from ${type.scenariosDrawn} of ${type.scenariosTotal} official scenarios`;
  }

  if (type.domainCount != null) {
    const domainClause = `weighted across all ${numberWord(type.domainCount)} domain${type.domainCount === 1 ? '' : 's'}`;
    sentence += hasScenarioDraw ? `, ${domainClause}` : ` ${domainClause}`;
  }

  return `${sentence}.`;
}
