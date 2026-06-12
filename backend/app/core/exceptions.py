from fastapi import HTTPException, status


class InsightPulseException(HTTPException):
    def __init__(self, status_code: int, detail: str, error_type: str = "general_error"):
        super().__init__(status_code=status_code, detail=detail)
        self.error_type = error_type


class AuthError(InsightPulseException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_type="auth_error"
        )


class ValidationError(InsightPulseException):
    def __init__(self, detail: str = "Invalid input data"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_type="validation_error"
        )


class NotFoundError(InsightPulseException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_type="not_found_error"
        )


class PermissionError(InsightPulseException):
    def __init__(self, detail: str = "Admin access required"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_type="permission_error"
        )


class RateLimitError(InsightPulseException):
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            error_type="rate_limit_error"
        )
