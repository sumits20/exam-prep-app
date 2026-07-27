import { domainColorVar } from '../lib/constants';

export function DomainChip({ domain, label }: { domain: number; label: string }) {
  return (
    <span className="domain-chip" style={{ color: domainColorVar(domain) }}>
      <span className="domain-chip__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
