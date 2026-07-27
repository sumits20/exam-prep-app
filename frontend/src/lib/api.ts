import type {
  AnswerResponse,
  CompleteSessionResponse,
  CreateSessionResponse,
  DomainQuestionsResponse,
  DomainSummaryResponse,
  ExamType,
  GetSessionResponse,
  HistorySession,
  Option,
  SessionReviewResponse,
} from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function authedFetch<T>(path: string, accessToken: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `${options.method ?? 'GET'} ${path} failed: ${res.status}`);
  }

  return res.json();
}

export async function recordLogin(accessToken: string) {
  const res = await fetch(`${API_URL}/auth/record-login`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`record-login failed: ${res.status}`);
  }

  return res.json();
}

export function getExamTypes(accessToken: string) {
  return authedFetch<{ examTypes: ExamType[] }>('/exam-types', accessToken);
}

export function createExamSession(
  accessToken: string,
  params: { examTypeSlug: string; mode?: 'standard' | 'domain-practice'; domain?: number }
) {
  return authedFetch<CreateSessionResponse>('/exam-sessions', accessToken, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function getExamSession(accessToken: string, sessionId: string) {
  return authedFetch<GetSessionResponse>(`/exam-sessions/${sessionId}`, accessToken);
}

export function answerQuestion(accessToken: string, sessionId: string, examAnswerId: string, selectedOption: Option) {
  return authedFetch<AnswerResponse>(`/exam-sessions/${sessionId}/answers/${examAnswerId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ selectedOption }),
  });
}

export function completeExamSession(accessToken: string, sessionId: string) {
  return authedFetch<CompleteSessionResponse>(`/exam-sessions/${sessionId}/complete`, accessToken, {
    method: 'POST',
  });
}

export function getExamHistory(
  accessToken: string,
  params: {
    examType?: string;
    passFail?: 'pass' | 'fail';
    from?: string;
    to?: string;
    sort?: string;
    status?: 'in_progress' | 'completed' | 'abandoned';
  } = {}
) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString();
  return authedFetch<{ sessions: HistorySession[] }>(`/exam-sessions${query ? `?${query}` : ''}`, accessToken);
}

export function deleteExamSession(accessToken: string, sessionId: string) {
  return authedFetch<{ deleted: true }>(`/exam-sessions/${sessionId}`, accessToken, {
    method: 'DELETE',
  });
}

export function getSessionReview(accessToken: string, sessionId: string) {
  return authedFetch<SessionReviewResponse>(`/exam-sessions/${sessionId}/review`, accessToken);
}

// Domain numbers aren't comparable across exam types, so the summary/drilldown are
// always scoped to one exam type's slug.
export function getDomainSummary(accessToken: string, examTypeSlug: string) {
  return authedFetch<DomainSummaryResponse>(
    `/domain-summary?examType=${encodeURIComponent(examTypeSlug)}`,
    accessToken
  );
}

export function getDomainQuestions(accessToken: string, examTypeSlug: string, domain: number) {
  return authedFetch<DomainQuestionsResponse>(
    `/domain-summary/${domain}/questions?examType=${encodeURIComponent(examTypeSlug)}`,
    accessToken
  );
}

export function startDomainPractice(accessToken: string, examTypeSlug: string, domain: number) {
  return createExamSession(accessToken, { examTypeSlug, mode: 'domain-practice', domain });
}
