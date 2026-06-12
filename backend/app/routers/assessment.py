from fastapi import APIRouter, Depends
from app.schemas.assessment import (
    AssessmentSubmit, AssessmentResult, 
    AssessmentHistoryResponse
)
from app.services.assessment_service import AssessmentService
from app.deps import get_current_user_id

router = APIRouter(prefix="/assessment", tags=["Assessment"])


@router.post("/", response_model=AssessmentResult)
async def submit_assessment(
    data: AssessmentSubmit,
    user_id: str = Depends(get_current_user_id)
):
    """Submit DASS-21 assessment answers and get scored results."""
    return await AssessmentService.submit_assessment(user_id, data)


@router.get("/history", response_model=AssessmentHistoryResponse)
async def get_history(user_id: str = Depends(get_current_user_id)):
    """Get assessment history for the current user."""
    return await AssessmentService.get_history(user_id)


@router.get("/latest", response_model=AssessmentResult)
async def get_latest(user_id: str = Depends(get_current_user_id)):
    """Get the most recent assessment for the current user."""
    return await AssessmentService.get_latest(user_id)
