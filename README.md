# Exam Prep App

A practice-exam simulation app for Anthropic's Claude certification exams,
starting with **Claude Certified Architect – Foundations**. Log in with
Google, take a 60-question timed practice paper, review past sessions in
detail, and track weak domains across attempts.

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture, data model, and
business rules.

## Stack
- **Frontend**: React + Vite (`frontend/`)
- **Backend**: Node.js/Express (`backend/`)
- **Auth + DB**: Supabase (Google OAuth, Postgres)

## Local setup

Both `frontend/` and `backend/` need their own `.env` (see
`.env.example` at the repo root for the required keys — never commit
these files).

```bash
# backend
cd backend
npm install
npm run dev          # http://localhost:3001

# frontend (separate terminal)
cd frontend
npm install
npm run dev           # http://localhost:5173
```

## Question bank

The question bank lives in Supabase (`questions` table), not a static
file at runtime. `data/architect-foundations_questions.json` is the
import source — re-run the import after updating that file:

```bash
cd backend
npm run import:questions
```

The script upserts by question `id` and skips rows that already exist,
so it's safe to re-run after adding new questions to the file.
