# Exam Prep App — Project Context

## What this is
A practice-exam simulation app for Anthropic's Claude certification exams
(starting with "Claude Certified Architect – Foundations", later adding
"Claude Certified Architect – Professional"). Users log in with Google,
select an exam type, take a 60-question timed practice exam drawn from a
JSON question bank, and review past sessions. After every 5 completed
sessions, an AI-generated evaluation summarizes performance by domain and
scenario and suggests study topics.

## Stack
- **Frontend**: React + Vite, hosted on Cloudflare Pages. Static assets /
  exports via Cloudflare R2.
- **Backend**: Node.js/Express, hosted on Render (free tier). Thin
  orchestration layer only — question paper assembly, session lifecycle,
  AI evaluation trigger.
- **Auth + DB**: Supabase. Google OAuth for login. Postgres for all
  persistent data. Row-level security scoped per user.
- **Animation**: Framer Motion for transitions and micro-interactions.

## Design mandate — READ THIS BEFORE WRITING ANY UI CODE
Do not default to generic AI-generated aesthetics: no default Inter font,
no purple/blue gradient backgrounds, no generic rounded white cards with
soft shadows, no default browser icon sets. Pick a deliberate aesthetic
direction (typography pairing, color palette, motion language) before
writing any component, and state that direction in a short comment at the
top of the first component you create in a session. Use Framer Motion for
intentional, purposeful animation — not decoration for its own sake.
Consult the installed frontend-design skills before starting any new page
or major component.

## Data model (Supabase / Postgres)
- `exam_types` — id, name, question_bank_ref, question_count (60)
- `exam_sessions` — id, user_id, exam_type_id, status
  (in_progress | completed | abandoned), started_at, completed_at,
  scenario_selection (jsonb — the 4 of 6 scenarios drawn), question_ids
  (jsonb array), score, domain_breakdown (jsonb)
- `exam_answers` — id, session_id, question_id, selected_option
  (nullable), is_correct (nullable), answered_at
- `ai_evaluations` — id, user_id, generated_at, sessions_analyzed
  (jsonb array of session_ids), domain_analysis (jsonb),
  scenario_analysis (jsonb), study_recommendations (text)

Question bank source of truth lives in `/data/foundations_questions.json`
(250 questions, schema documented in its own `metadata.schema` field).
The Architect Professional question bank does not exist yet — do not
fabricate questions for it; that exam type should be visibly disabled/
"coming soon" in the UI until a real bank is added.

## Session rules — important business logic
- A session is `in_progress` from creation until explicitly completed.
- If a user abandons a session (closes browser, walks away), do NOT rely
  on client-side detection (beforeunload is unreliable). Instead, a
  scheduled sweep (Render cron or Supabase pg_cron) marks any
  `in_progress` session older than 3 hours as `abandoned`, and scores
  every unanswered question in it as incorrect (0 marks) when computing
  the final score.
- Paper generation: randomly select 4 of the 6 official scenarios
  (Customer Support Resolution Agent, Code Generation with Claude Code,
  Multi-Agent Research System, Developer Productivity with Claude,
  Claude Code for Continuous Integration, Structured Data Extraction),
  filter the question bank to those scenarios, then sample 60 questions,
  weighted approximately by the official domain weightings (Domain 1:
  27%, Domain 2: 18%, Domain 3: 20%, Domain 4: 20%, Domain 5: 15%).
- Every question is single-correct-answer, 4 options, no partial credit,
  no per-question weighting — every question counts equally.

## AI evaluation feature
Triggered automatically after every 5th completed session. Backend calls
the Claude API with the last 5 sessions' aggregated answer data, grouped
by `domain` and `scenario`, and asks for a study-recommendation summary.
Store the result in `ai_evaluations`; surface it in the UI on a dedicated
review page.

## Conventions
- TypeScript throughout (frontend and backend).
- Commit after every completed subtask, not just at the end of a session.
- No secrets (Supabase keys, Claude API keys) ever committed — use `.env`
  files, already covered by `.gitignore`.
