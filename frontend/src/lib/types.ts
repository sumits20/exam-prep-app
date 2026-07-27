export type Option = 'A' | 'B' | 'C' | 'D';
export type OptionSet = { A: string; B: string; C: string; D: string };

export interface ExamType {
  id: string;
  slug: string;
  name: string;
  questionCount: number;
  scenariosDrawn: number | null;
  scenariosTotal: number | null;
  domainCount: number | null;
}

export interface SessionMeta {
  id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string | null;
  score?: number | null;
  passed?: boolean | null;
  passingThresholdPct?: number;
  scenarioSelection?: string[];
  domainBreakdown?: DomainBreakdown | null;
}

export interface TakingQuestion {
  examAnswerId: string;
  questionId: number;
  domain: number;
  domainName: string;
  taskStatement?: string;
  scenario: string;
  questionText: string;
  options: OptionSet;
  selectedOption?: Option | null;
  correctAnswer?: Option;
  isCorrect?: boolean | null;
  rationale?: string;
}

export interface CreateSessionResponse {
  session: SessionMeta;
  questions: TakingQuestion[];
}

export interface GetSessionResponse {
  session: SessionMeta;
  questions: TakingQuestion[];
}

export interface AnswerResponse {
  examAnswerId: string;
  selectedOption: Option;
  answeredCount?: number;
  totalQuestions: number;
}

export interface DomainBreakdown {
  [domain: string]: { correct: number; total: number };
}

export interface CompleteSessionResponse {
  session: SessionMeta;
  passed: boolean;
  passingThresholdPct: number;
  domainBreakdown: DomainBreakdown;
}

export interface HistorySession {
  id: string;
  examTypeName: string | null;
  examTypeSlug: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  score: number | null;
  passed: boolean | null;
  passingThresholdPct: number;
  domainBreakdown: DomainBreakdown | null;
}

export interface QuestionHistory {
  attempts: number;
  correct: number;
}

export interface DomainHistory extends QuestionHistory {
  accuracyPct: number | null;
}

export interface ReviewItem {
  examAnswerId: string;
  questionId: number;
  domain: number;
  domainName: string;
  scenario: string;
  questionText: string;
  options: OptionSet;
  selectedOption: Option | null;
  correctAnswer: Option;
  isCorrect: boolean | null;
  rationale: string;
  questionHistory: QuestionHistory;
  domainHistory: DomainHistory;
}

export interface SessionReviewResponse {
  session: SessionMeta;
  items: ReviewItem[];
}

export interface DomainTrendPoint {
  sessionId: string;
  completedAt: string;
  accuracyPct: number;
}

export interface DomainSummaryEntry {
  domain: number;
  domainName: string;
  totalAttempted: number;
  totalCorrect: number;
  accuracyPct: number | null;
  trend: DomainTrendPoint[];
}

export interface DomainSummaryResponse {
  domains: DomainSummaryEntry[];
}

export interface DomainQuestionItem {
  examAnswerId: string;
  sessionId: string;
  questionId: number;
  domain: number;
  domainName: string;
  scenario: string;
  questionText: string;
  options: OptionSet;
  selectedOption: Option | null;
  correctAnswer: Option;
  isCorrect: boolean | null;
  rationale: string;
  answeredAt: string;
}

export interface DomainQuestionsResponse {
  domain: number;
  domainName: string;
  items: DomainQuestionItem[];
}
