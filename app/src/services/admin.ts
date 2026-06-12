import api from './api';

export interface AdminStats {
  total_users: number;
  total_assessments: number;
  assessments_today: number;
  average_depression_score: number;
  average_anxiety_score: number;
  average_stress_score: number;
  active_users_today: number;
}

export interface RiskDistribution {
  depression: Record<string, number>;
  anxiety: Record<string, number>;
  stress: Record<string, number>;
}

export interface UserListItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  assessment_count: number;
}

export interface AssessmentListItem {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  depression_score: number;
  anxiety_score: number;
  stress_score: number;
  depression_severity: string;
  anxiety_severity: string;
  stress_severity: string;
  created_at: string;
}

export const adminApi = {
  getStats: () =>
    api.get<AdminStats>('/admin/stats'),

  getRiskDistribution: () =>
    api.get<RiskDistribution>('/admin/risk-distribution'),

  getUsers: (skip = 0, limit = 50) =>
    api.get<{ users: UserListItem[]; total: number }>(`/admin/users?skip=${skip}&limit=${limit}`),

  getAssessments: (skip = 0, limit = 100) =>
    api.get<{ assessments: AssessmentListItem[]; total: number }>(`/admin/assessments?skip=${skip}&limit=${limit}`),
};
