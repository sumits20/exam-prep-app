// One-time import: /data/architect-foundations_questions.json -> `questions` table.
// Run once after the `exam_types` row for 'architect-foundations' exists.
// Safe to re-run: existing question ids are skipped via upsert(..., { ignoreDuplicates: true }).

import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadEnv({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set in backend/.env');
}

// Secret key bypasses RLS — required since `questions` writes aren't client-facing.
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const EXAM_TYPE_SLUG = 'architect-foundations';
const QUESTION_BANK_PATH = path.resolve(
  __dirname,
  '../../data/architect-foundations_questions.json'
);
const BATCH_SIZE = 50;

interface SourceQuestion {
  id: number;
  domain: number;
  domain_name: string;
  task_statement: string;
  scenario: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  rationale: string;
}

interface QuestionBankFile {
  metadata: unknown;
  questions: SourceQuestion[];
}

async function main() {
  const raw = readFileSync(QUESTION_BANK_PATH, 'utf-8');
  const bank: QuestionBankFile = JSON.parse(raw);
  const questions = bank.questions;
  console.log(`Loaded ${questions.length} questions from ${QUESTION_BANK_PATH}`);

  const { data: examType, error: examTypeError } = await supabase
    .from('exam_types')
    .select('id')
    .eq('slug', EXAM_TYPE_SLUG)
    .single();

  if (examTypeError || !examType) {
    throw new Error(
      `Could not find exam_types row with slug='${EXAM_TYPE_SLUG}': ${
        examTypeError?.message ?? 'no matching row'
      }`
    );
  }

  const examTypeId = examType.id;
  console.log(`Resolved exam_type_id=${examTypeId} for slug='${EXAM_TYPE_SLUG}'`);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  let processed = 0;

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);

    const rows = batch.map((q) => ({
      id: q.id,
      exam_type_id: examTypeId,
      domain: q.domain,
      domain_name: q.domain_name,
      task_statement: q.task_statement,
      scenario: q.scenario,
      question_text: q.question,
      option_a: q.options.A,
      option_b: q.options.B,
      option_c: q.options.C,
      option_d: q.options.D,
      correct_answer: q.correct_answer,
      rationale: q.rationale,
    }));

    // ignoreDuplicates: true -> ON CONFLICT (id) DO NOTHING, so re-running is a no-op
    // for questions that already exist. Only newly inserted rows come back in `data`.
    const { data, error } = await supabase
      .from('questions')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');

    processed += batch.length;

    if (error) {
      failed += batch.length;
      console.error(`Batch starting at question id=${batch[0].id} failed: ${error.message}`);
    } else {
      const insertedIds = new Set((data ?? []).map((r) => r.id));
      inserted += insertedIds.size;
      skipped += batch.length - insertedIds.size;
    }

    if (processed % BATCH_SIZE === 0 || processed === questions.length) {
      console.log(
        `Progress: ${processed}/${questions.length} processed ` +
          `(inserted=${inserted}, skipped=${skipped}, failed=${failed})`
      );
    }
  }

  console.log('---');
  console.log(
    `Import complete: ${inserted} inserted, ${skipped} skipped (already existed), ${failed} failed.`
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Import script failed:', err);
  process.exitCode = 1;
});
