from fastapi import Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_access_token
from app.core.exceptions import AuthError, PermissionError
from app.schemas.auth import TokenPayload
from app.services.auth_service import AuthService

security = HTTPBearer(auto_error=False)


async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if not credentials:
        raise AuthError("Authentication required. Please provide a valid token.")
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise AuthError("Invalid or expired token. Please login again.")
    
    user_id = payload.get("sub")
    if not user_id:
        raise AuthError("Invalid token payload.")
    
    return user_id


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise AuthError("Authentication required. Please provide a valid token.")
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise AuthError("Invalid or expired token. Please login again.")
    
    user_id = payload.get("sub")
    if not user_id:
        raise AuthError("Invalid token payload.")
    
    user = await AuthService.get_current_user(user_id)
    return user


async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise AuthError("Authentication required. Please provide a valid token.")
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise AuthError("Invalid or expired token. Please login again.")
    
    user_id = payload.get("sub")
    role = payload.get("role", "user")
    
    if not user_id:
        raise AuthError("Invalid token payload.")
    
    if role != "admin":
        raise PermissionError("Admin access required.")
    
    user = await AuthService.get_current_user(user_id)
    return user
