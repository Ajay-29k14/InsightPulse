from fastapi import APIRouter, Depends
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse
from app.services.auth_service import AuthService
from app.deps import get_current_user_id, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister):
    """Register a new user account."""
    return await AuthService.register(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """Login and receive JWT access token."""
    return await AuthService.login(data)


@router.get("/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    """Get current authenticated user information."""
    return user
