from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime


class AdminStatsResponse(BaseModel):
    total_users: int
    total_assessments: int
    assessments_today: int
    average_depression_score: float
    average_anxiety_score: float
    average_stress_score: float
    active_users_today: int


class RiskDistributionResponse(BaseModel):
    depression: Dict[str, int]
    anxiety: Dict[str, int]
    stress: Dict[str, int]


class UserListItem(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: Optional[datetime] = None
    assessment_count: int = 0


class UserListResponse(BaseModel):
    users: List[UserListItem]
    total: int


class AssessmentListItem(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_name: str
    depression_score: int
    anxiety_score: int
    stress_score: int
    depression_severity: str
    anxiety_severity: str
    stress_severity: str
    created_at: datetime


class AssessmentListResponse(BaseModel):
    assessments: List[AssessmentListItem]
    total: int
