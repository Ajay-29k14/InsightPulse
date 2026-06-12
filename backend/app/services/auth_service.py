from datetime import datetime, timezone
from typing import Optional, Dict, Any
from bson import ObjectId
from app.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.core.exceptions import AuthError, ValidationError, NotFoundError
from app.schemas.auth import UserRegister, UserLogin, UserResponse, TokenResponse


class AuthService:
    @staticmethod
    async def register(data: UserRegister) -> TokenResponse:
        db = get_db()
        
        # Check if user already exists
        existing = await db.users.find_one({"email": data.email})
        if existing:
            raise ValidationError("Email already registered")
        
        # Create user
        user_doc = {
            "email": data.email,
            "password_hash": hash_password(data.password),
            "full_name": data.full_name,
            "role": "user",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Create token
        token = create_access_token({"sub": user_id, "role": "user"})
        
        return TokenResponse(
            access_token=token,
            user=UserResponse(
                id=user_id,
                email=data.email,
                full_name=data.full_name,
                role="user",
                created_at=user_doc["created_at"]
            )
        )
    
    @staticmethod
    async def login(data: UserLogin) -> TokenResponse:
        db = get_db()
        
        user = await db.users.find_one({"email": data.email})
        if not user:
            raise AuthError("Invalid email or password")
        
        if not verify_password(data.password, user["password_hash"]):
            raise AuthError("Invalid email or password")
        
        user_id = str(user["_id"])
        token = create_access_token({"sub": user_id, "role": user.get("role", "user")})
        
        return TokenResponse(
            access_token=token,
            user=UserResponse(
                id=user_id,
                email=user["email"],
                full_name=user["full_name"],
                role=user.get("role", "user"),
                created_at=user.get("created_at")
            )
        )
    
    @staticmethod
    async def get_current_user(user_id: str) -> UserResponse:
        db = get_db()
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise NotFoundError("User not found")
        
        return UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            full_name=user["full_name"],
            role=user.get("role", "user"),
            created_at=user.get("created_at")
        )
