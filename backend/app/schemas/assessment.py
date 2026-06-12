from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime


class AssessmentSubmit(BaseModel):
    answers: List[int] = Field(
        ...,
        min_length=21,
        max_length=21,
        description="Array of 21 integers (0-3) representing DASS-21 answers"
    )

    @field_validator("answers")
    @classmethod
    def validate_answers(cls, v):
        if len(v) != 21:
            raise ValueError("Must provide exactly 21 answers")
        if not all(0 <= x <= 3 for x in v):
            raise ValueError("All answers must be between 0 and 3")
        return v


class AssessmentResult(BaseModel):
    assessment_id: str
    depression_score: int
    anxiety_score: int
    stress_score: int
    depression_severity: str
    anxiety_severity: str
    stress_severity: str
    ml_depression_severity: Optional[str] = None
    ml_anxiety_severity: Optional[str] = None
    ml_stress_severity: Optional[str] = None
    created_at: datetime


class AssessmentHistoryItem(BaseModel):
    id: str
    depression_score: int
    anxiety_score: int
    stress_score: int
    depression_severity: str
    anxiety_severity: str
    stress_severity: str
    created_at: datetime


class AssessmentHistoryResponse(BaseModel):
    assessments: List[AssessmentHistoryItem]
    total: int
