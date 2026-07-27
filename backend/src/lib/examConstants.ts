// No pass/fail threshold is defined anywhere in the schema — 72% is a product decision,
// centralized here so every response that reports pass/fail uses the same number.
export const PASSING_THRESHOLD_PCT = 72;

// Caps how many in_progress sessions a user can accumulate per exam type, so
// abandoned/forgotten sessions don't pile up indefinitely.
export const MAX_IN_PROGRESS_PER_EXAM_TYPE = 5;
