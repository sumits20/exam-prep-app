# Exam Prep App — Project Context

## What this is
A practice-exam simulation app for Anthropic's Claude certification exams
(starting with "Claude Certified Architect – Foundations", later adding
"Claude Certified Architect – Professional"). Users log in with Google,
select an exam type, take a 60-question timed practice exam, and review
past sessions in full detail. An admin console allows question bank
management, AI model selection, and per-user performance review. After
every 5 completed sessions, an AI-generated evaluation summarizes
performance by domain and scenario and suggests study topics.

## Stack
- **Frontend**: React + Vite, hosted on Cloudflare Pages. Static assets
  via Cloudflare R2.
- **Backend**: Node.js/Express, hosted on Render (free tier). All
  privileged operations (writes bypassing RLS, admin actions, AI calls)
  happen here using the Supabase secret key — never in the frontend.
- **Auth + DB**: Supabase. Google OAuth for login. Postgres for all
  persistent data, including the question bank itself (not a static
  JSON file — see Data model). Row Level Security scoped per user;
  admin/settings tables have no client-facing RLS policies at all and
  are reachable only via the backend's secret key.
- **AI evaluation**: Anthropic API only (no multi-provider fallback).
  Default model: `claude-haiku-4-5-20251001`, admin-configurable via
  `app_settings`.
- **Animation**: Framer Motion for transitions and micro-interactions.

## Design mandate — READ THIS BEFORE WRITING ANY UI CODE
Do not default to generic AI-generated aesthetics: no default Inter font,
no purple/blue gradient backgrounds, no generic rounded white cards with
soft shadows, no default browser icon sets. Pick a deliberate aesthetic
direction (typography pairing, color palette, motion language) before
writing any component, and state that direction in a short comment at the
top of the first component you create in a session. Use Framer Motion for
intentional, purposeful animation — not decoration for its own sake.
Consult the installed frontend-design and distinctive-frontend skills
before starting any new page or major component.

## Data model (Supabase / Postgres)

The question bank lives in the database (`questions` table), not a
static JSON file — this is deliberate, for scalability (adding the
Professional bank is just new rows, not a new file to manage) and
queryability (filter by domain/scenario at the DB level rather than
loading everything into memory). The original `foundations_questions.json`
in `/data` is the one-time import source, imported via a migration
script — not read at runtime by the app.

- `exam_types` — id, slug, name, question_count, is_active (lets an exam
  type exist but stay hidden — e.g. Professional until its bank is ready)
- `questions` — id, exam_type_id, domain, domain_name, task_statement,
  scenario, question_text, option_a–d, correct_answer, rationale,
  is_active (soft-retire, never hard-delete, so old sessions stay
  reviewable even if a question is later pulled)
- `profiles` — extends auth.users; id, display_name, avatar_url, role
  ('user' | 'admin'), first_login_at, last_login_at. Auto-created via a
  trigger on auth.users insert.
- `user_login_history` — id, user_id, logged_in_at, user_agent. One row
  per successful login. Backend-written only (right after OAuth
  callback succeeds), never client-written.
- `exam_sessions` — id, user_id, exam_type_id, status (in_progress |
  completed | abandoned), started_at, completed_at, scenario_selection
  (jsonb — the 4 of 6 scenarios drawn), question_ids (jsonb array),
  score, domain_breakdown (jsonb)
- `exam_answers` — id, session_id, question_id, selected_option,
  is_correct, answered_at, **plus a denormalized snapshot**
  (question_text, options, correct_answer, rationale, domain, scenario)
  captured at paper-generation time. The snapshot exists so review pages
  never break or silently change if a question is later edited — a
  user's historical review always shows exactly what they actually saw.
- `ai_evaluations` — id, user_id, generated_at, sessions_analyzed (jsonb
  array of session ids), domain_analysis, scenario_analysis,
  study_recommendations
- `app_settings` — key/value store, currently holds
  `ai_evaluation_config` ({provider, model}). No client RLS access at
  all — backend-only, admin-editable via the admin console.
- `admin_audit_log` — id, admin_user_id, action, target_table,
  target_id, changes, created_at. Backend-only. Write a row on every
  admin action (question edit/create, settings change).

## Row Level Security summary
- `exam_types`, `questions`: public read (not sensitive).
- `profiles`, `user_login_history`, `exam_sessions`, `exam_answers`,
  `ai_evaluations`: users can only see their own rows. No client insert
  policy on `user_login_history` or `ai_evaluations` — those are
  backend-written only.
- `app_settings`, `admin_audit_log`: zero client policies. Reachable
  only via the backend's Supabase secret key, which bypasses RLS
  entirely. Admin-gating happens in backend middleware (checking
  `profiles.role`), not in the database layer.

## Admin console
Gated by `profiles.role = 'admin'`, checked in backend middleware on
every `/admin/*` route. No user can self-promote — the first admin is
set manually via SQL after their first login. Capabilities:
- **Question management**: create/edit/soft-retire rows in `questions`.
- **AI model selection**: view/update `app_settings.ai_evaluation_config`.
  Simple dropdown, no dynamic model list fetching — hardcode the current
  Anthropic lineup (`claude-haiku-4-5-20251001`, `claude-sonnet-5`,
  `claude-opus-4-8`) in the frontend. No fallback logic; if the selected
  model's API call fails, surface the error rather than silently
  retrying with a different model.
- **User-wise performance filtering**: query `exam_sessions` +
  `exam_answers`, filtered by `user_id`, joined against `profiles` for
  display — backend-only query using the secret key, no RLS restriction
  needed since it's already gated by the admin role check.
- Every admin write action should log a row to `admin_audit_log`.

## Session rules — important business logic
- A session is `in_progress` from creation until explicitly completed.
- If a user abandons a session (closes browser, walks away), do NOT rely
  on client-side detection (beforeunload is unreliable). Instead, a
  scheduled sweep (Render cron or Supabase pg_cron, running via the
  secret key so it can see all users' sessions, not just one) marks any
  `in_progress` session older than 3 hours as `abandoned`, and scores
  every unanswered question in it as incorrect (0 marks) when computing
  the final score.
- Paper generation: randomly select 4 of the 6 official scenarios
  (Customer Support Resolution Agent, Code Generation with Claude Code,
  Multi-Agent Research System, Developer Productivity with Claude,
  Claude Code for Continuous Integration, Structured Data Extraction),
  query `questions` filtered to those scenarios + the active exam type,
  then sample 60, weighted approximately by the official domain
  weightings (Domain 1: 27%, Domain 2: 18%, Domain 3: 20%, Domain 4:
  20%, Domain 5: 15%). At session creation, snapshot each drawn
  question's content onto its future `exam_answers` row (see Data
  model) — don't wait until answer time to capture the snapshot.
- Every question is single-correct-answer, 4 options, no partial credit,
  no per-question weighting — every question counts equally.

## AI evaluation feature
Triggered automatically after every 5th completed session. Backend
reads `app_settings.ai_evaluation_config` for the current model, calls
the Anthropic API with the last 5 sessions' aggregated answer data
(grouped by `domain` and `scenario`), and asks for a study-recommendation
summary. Store the result in `ai_evaluations`; surface it in the UI on a
dedicated review page. No automatic provider/model fallback — if the
call fails, log it and let the user/admin know generation didn't
complete this cycle, rather than silently retrying with a different
model.

## Login tracking
On every successful Google OAuth login (backend-handled callback):
1. Insert a row into `user_login_history` (user_id, logged_in_at,
   user_agent).
2. Update `profiles.last_login_at` for that user.
`profiles.first_login_at` is set once, automatically, by the
`handle_new_user` trigger on first signup — never updated after that.

## Conventions
- TypeScript throughout (frontend and backend).
- Commit after every completed subtask, not just at the end of a
  session.
- No secrets (Supabase secret key, Anthropic/OpenAI API keys, Google
  OAuth client secret) ever committed — use `.env` files, already
  covered by `.gitignore`. Frontend and backend each have their own
  `.env`; frontend only ever holds client-safe values (Supabase URL,
  Supabase **publishable** key, Google client ID) — never the Supabase
  secret key, OAuth client secret, or any LLM API key.
