from fastapi import APIRouter, Depends, Query
from app.schemas.admin import (
    AdminStatsResponse, RiskDistributionResponse,
    UserListResponse, AssessmentListResponse
)
from app.services.admin_service import AdminService
from app.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(admin=Depends(get_current_admin)):
    """Get platform-wide statistics. Admin only."""
    return await AdminService.get_stats()


@router.get("/risk-distribution", response_model=RiskDistributionResponse)
async def get_risk_distribution(admin=Depends(get_current_admin)):
    """Get risk distribution across all assessments. Admin only."""
    return await AdminService.get_risk_distribution()


@router.get("/users", response_model=UserListResponse)
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin=Depends(get_current_admin)
):
    """List all users. Admin only."""
    return await AdminService.get_users(skip=skip, limit=limit)


@router.get("/assessments", response_model=AssessmentListResponse)
async def get_all_assessments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    admin=Depends(get_current_admin)
):
    """List all assessments. Admin only."""
    return await AdminService.get_all_assessments(skip=skip, limit=limit)
