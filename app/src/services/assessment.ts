import api from './api';

export interface AssessmentSubmit {
  answers: number[];
}

export interface AssessmentResult {
  assessment_id: string;
  depression_score: number;
  anxiety_score: number;
  stress_score: number;
  depression_severity: string;
  anxiety_severity: string;
  stress_severity: string;
  ml_depression_severity: string | null;
  ml_anxiety_severity: string | null;
  ml_stress_severity: string | null;
  created_at: string;
}

export interface AssessmentHistoryItem {
  id: string;
  depression_score: number;
  anxiety_score: number;
  stress_score: number;
  depression_severity: string;
  anxiety_severity: string;
  stress_severity: string;
  created_at: string;
}

export interface AssessmentHistoryResponse {
  assessments: AssessmentHistoryItem[];
  total: number;
}

export const assessmentApi = {
  submit: (data: AssessmentSubmit) =>
    api.post<AssessmentResult>('/assessment/', data),

  getHistory: () =>
    api.get<AssessmentHistoryResponse>('/assessment/history'),

  getLatest: () =>
    api.get<AssessmentResult>('/assessment/latest'),
};
