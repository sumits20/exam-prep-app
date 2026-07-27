import { domainColorVar } from '../lib/constants';

export interface ProgressSegment {
  domain: number;
  answered: boolean;
}

export function SegmentedProgressBar({ segments }: { segments: ProgressSegment[] }) {
  return (
    <div className="progress-segments" role="progressbar" aria-label="Question coverage by domain">
      {segments.map((seg, i) => (
        <span
          key={i}
          className="progress-segments__seg"
          style={seg.answered ? { background: domainColorVar(seg.domain) } : undefined}
        />
      ))}
    </div>
  );
}
