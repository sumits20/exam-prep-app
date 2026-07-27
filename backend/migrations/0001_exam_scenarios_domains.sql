-- Introduces per-exam-type scenario and domain data, replacing the hardcoded
-- SCENARIOS/DOMAIN_TARGETS/DOMAIN_NAMES constants in backend/src/lib/examConstants.ts
-- so a second exam type is just new rows here, consistent with `questions`.
-- Run this by hand in the Supabase SQL editor (this repo has no migration runner yet).

create table exam_scenarios (
  id uuid primary key default gen_random_uuid(),
  exam_type_id uuid not null references exam_types(id) on delete cascade,
  name text not null,
  include_in_standard_draw boolean not null default true,
  unique (exam_type_id, name)
);

create table exam_domains (
  id uuid primary key default gen_random_uuid(),
  exam_type_id uuid not null references exam_types(id) on delete cascade,
  domain_number int not null,
  name text not null,
  weight_pct numeric(5,2) not null,
  unique (exam_type_id, domain_number)
);

alter table exam_scenarios enable row level security;
alter table exam_domains enable row level security;

create policy "exam_scenarios public read" on exam_scenarios for select using (true);
create policy "exam_domains public read" on exam_domains for select using (true);

-- Migrate existing Foundations data: the 6 official scenarios (standard draw pool)
-- plus General Knowledge, which stays excluded from the standard 4-of-6 draw and is
-- only reachable via domain-practice mode (see CLAUDE.md Data model section).
insert into exam_scenarios (exam_type_id, name, include_in_standard_draw)
select id, s.name, s.standard
from exam_types,
  (values
    ('Customer Support Resolution Agent', true),
    ('Code Generation with Claude Code', true),
    ('Multi-Agent Research System', true),
    ('Developer Productivity', true),
    ('Claude Code for CI', true),
    ('Structured Data Extraction', true),
    ('General Knowledge', false)
  ) as s(name, standard)
where exam_types.slug = 'architect-foundations';

-- Migrate the existing 5 domains with their official weightings (27/18/20/20/15%,
-- summing to 100) — absolute per-paper counts are now computed at generation time
-- from weight_pct * exam_types.question_count instead of being hardcoded.
insert into exam_domains (exam_type_id, domain_number, name, weight_pct)
select id, d.num, d.name, d.pct
from exam_types,
  (values
    (1, 'Agentic Architecture & Orchestration', 27.00),
    (2, 'Tool Design & MCP Integration', 18.00),
    (3, 'Claude Code Configuration & Workflows', 20.00),
    (4, 'Prompt Engineering & Structured Output', 20.00),
    (5, 'Context Management & Reliability', 15.00)
  ) as d(num, name, pct)
where exam_types.slug = 'architect-foundations';
