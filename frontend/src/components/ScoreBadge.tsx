export function ScoreBadge({ score, passed }: { score: number; passed: boolean }) {
  return (
    <span className={`score-badge ${passed ? 'score-badge--pass' : 'score-badge--fail'}`}>
      <span className="score-badge__value">{score}%</span>
      <span className="score-badge__label">{passed ? 'Pass' : 'Fail'}</span>
    </span>
  );
}
