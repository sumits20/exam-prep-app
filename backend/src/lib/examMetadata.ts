import { supabase } from './supabase.js';

export interface ExamDomain {
  domainNumber: number;
  name: string;
  weightPct: number;
}

export async function getStandardDrawScenarios(examTypeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('exam_scenarios')
    .select('name')
    .eq('exam_type_id', examTypeId)
    .eq('include_in_standard_draw', true);

  if (error) {
    throw new Error(`Failed to fetch exam_scenarios for exam type ${examTypeId}: ${error.message}`);
  }

  return (data ?? []).map((row) => row.name as string);
}

export async function getExamDomains(examTypeId: string): Promise<ExamDomain[]> {
  const { data, error } = await supabase
    .from('exam_domains')
    .select('domain_number, name, weight_pct')
    .eq('exam_type_id', examTypeId)
    .order('domain_number', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch exam_domains for exam type ${examTypeId}: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    domainNumber: row.domain_number as number,
    name: row.name as string,
    weightPct: Number(row.weight_pct),
  }));
}

export async function getDomainNameMap(examTypeId: string): Promise<Record<number, string>> {
  const domains = await getExamDomains(examTypeId);
  const map: Record<number, string> = {};
  for (const d of domains) {
    map[d.domainNumber] = d.name;
  }
  return map;
}

// Converts each domain's weight_pct into an integer question count for a paper of
// `totalQuestions` size. Flooring each domain's exact share can undershoot the total
// by a few questions (e.g. 16.2 -> 16), so the largest fractional remainders get the
// leftover seats — this is the standard largest-remainder apportionment method, and
// guarantees the targets always sum to exactly totalQuestions.
export function computeDomainTargets(domains: ExamDomain[], totalQuestions: number): Record<number, number> {
  const shares = domains.map((d) => ({
    domainNumber: d.domainNumber,
    exact: (d.weightPct / 100) * totalQuestions,
  }));

  const targets: Record<number, number> = {};
  let allocated = 0;
  for (const { domainNumber, exact } of shares) {
    targets[domainNumber] = Math.floor(exact);
    allocated += targets[domainNumber];
  }

  const remainder = totalQuestions - allocated;
  const byRemainderDesc = [...shares].sort(
    (a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact))
  );
  for (let i = 0; i < remainder; i++) {
    targets[byRemainderDesc[i].domainNumber] += 1;
  }

  return targets;
}
