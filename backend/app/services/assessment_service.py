from datetime import datetime, timezone
from typing import List, Dict, Any
from bson import ObjectId
from app.database import get_db
from app.core.exceptions import ValidationError, NotFoundError
from app.schemas.assessment import AssessmentSubmit, AssessmentResult, AssessmentHistoryItem, AssessmentHistoryResponse
from app.services.ml_service import MLService

# DASS-21 question mapping
DEPRESSION_QUESTIONS = [3, 5, 10, 13, 16, 17, 21]  # 1-indexed
ANXIETY_QUESTIONS = [2, 4, 7, 9, 15, 19, 20]  # 1-indexed
STRESS_QUESTIONS = [1, 6, 8, 11, 12, 14, 18]  # 1-indexed

SEVERITY_LEVELS = ["Normal", "Mild", "Moderate", "Severe", "Extremely Severe"]

# DASS-21 severity thresholds (scores after doubling)
DEPRESSION_THRESHOLDS = [9, 13, 20, 27]   # Normal: 0-9, Mild: 10-13, Moderate: 14-20, Severe: 21-27
ANXIETY_THRESHOLDS = [7, 9, 14, 19]       # Normal: 0-7, Mild: 8-9, Moderate: 10-14, Severe: 15-19
STRESS_THRESHOLDS = [14, 18, 25, 33]      # Normal: 0-14, Mild: 15-18, Moderate: 19-25, Severe: 26-33


class AssessmentService:
    @staticmethod
    def calculate_severity(score: int, thresholds: List[int]) -> str:
        for i, threshold in enumerate(thresholds):
            if score <= threshold:
                return SEVERITY_LEVELS[i]
        return SEVERITY_LEVELS[-1]
    
    @staticmethod
    def dass21_score(answers: List[int]) -> Dict[str, Any]:
        if len(answers) != 21:
            raise ValidationError("Must provide exactly 21 answers")
        if not all(0 <= a <= 3 for a in answers):
            raise ValidationError("All answers must be between 0 and 3")
        
        # Calculate raw scores (convert to 0-indexed)
        depression_raw = sum(answers[q - 1] for q in DEPRESSION_QUESTIONS)
        anxiety_raw = sum(answers[q - 1] for q in ANXIETY_QUESTIONS)
        stress_raw = sum(answers[q - 1] for q in STRESS_QUESTIONS)
        
        # Double the scores as per DASS-21 protocol
        depression_score = depression_raw * 2
        anxiety_score = anxiety_raw * 2
        stress_score = stress_raw * 2
        
        return {
            "depression_score": depression_score,
            "anxiety_score": anxiety_score,
            "stress_score": stress_score,
            "depression_severity": AssessmentService.calculate_severity(depression_score, DEPRESSION_THRESHOLDS),
            "anxiety_severity": AssessmentService.calculate_severity(anxiety_score, ANXIETY_THRESHOLDS),
            "stress_severity": AssessmentService.calculate_severity(stress_score, STRESS_THRESHOLDS)
        }
    
    @staticmethod
    async def submit_assessment(user_id: str, data: AssessmentSubmit) -> AssessmentResult:
        db = get_db()
        
        # Calculate DASS-21 scores
        scores = AssessmentService.dass21_score(data.answers)
        
        # Get ML predictions
        ml_predictions = MLService.predict_all(data.answers)
        
        # Store assessment
        assessment_doc = {
            "user_id": ObjectId(user_id),
            "answers": data.answers,
            "depression_score": scores["depression_score"],
            "anxiety_score": scores["anxiety_score"],
            "stress_score": scores["stress_score"],
            "depression_severity": scores["depression_severity"],
            "anxiety_severity": scores["anxiety_severity"],
            "stress_severity": scores["stress_severity"],
            "ml_depression_severity": ml_predictions.get("depression"),
            "ml_anxiety_severity": ml_predictions.get("anxiety"),
            "ml_stress_severity": ml_predictions.get("stress"),
            "created_at": datetime.now(timezone.utc)
        }
        
        result = await db.assessments.insert_one(assessment_doc)
        
        return AssessmentResult(
            assessment_id=str(result.inserted_id),
            depression_score=scores["depression_score"],
            anxiety_score=scores["anxiety_score"],
            stress_score=scores["stress_score"],
            depression_severity=scores["depression_severity"],
            anxiety_severity=scores["anxiety_severity"],
            stress_severity=scores["stress_severity"],
            ml_depression_severity=ml_predictions.get("depression"),
            ml_anxiety_severity=ml_predictions.get("anxiety"),
            ml_stress_severity=ml_predictions.get("stress"),
            created_at=assessment_doc["created_at"]
        )
    
    @staticmethod
    async def get_history(user_id: str) -> AssessmentHistoryResponse:
        db = get_db()
        
        cursor = db.assessments.find(
            {"user_id": ObjectId(user_id)}
        ).sort("created_at", -1)
        
        assessments = []
        async for doc in cursor:
            assessments.append(AssessmentHistoryItem(
                id=str(doc["_id"]),
                depression_score=doc["depression_score"],
                anxiety_score=doc["anxiety_score"],
                stress_score=doc["stress_score"],
                depression_severity=doc["depression_severity"],
                anxiety_severity=doc["anxiety_severity"],
                stress_severity=doc["stress_severity"],
                created_at=doc["created_at"]
            ))
        
        return AssessmentHistoryResponse(
            assessments=assessments,
            total=len(assessments)
        )
    
    @staticmethod
    async def get_latest(user_id: str) -> AssessmentResult:
        db = get_db()
        
        doc = await db.assessments.find_one(
            {"user_id": ObjectId(user_id)},
            sort=[("created_at", -1)]
        )
        
        if not doc:
            raise NotFoundError("No assessment found")
        
        return AssessmentResult(
            assessment_id=str(doc["_id"]),
            depression_score=doc["depression_score"],
            anxiety_score=doc["anxiety_score"],
            stress_score=doc["stress_score"],
            depression_severity=doc["depression_severity"],
            anxiety_severity=doc["anxiety_severity"],
            stress_severity=doc["stress_severity"],
            ml_depression_severity=doc.get("ml_depression_severity"),
            ml_anxiety_severity=doc.get("ml_anxiety_severity"),
            ml_stress_severity=doc.get("ml_stress_severity"),
            created_at=doc["created_at"]
        )
