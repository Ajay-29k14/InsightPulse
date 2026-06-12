from fastapi import APIRouter, Depends
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, ChatHistoryResponse
from app.services.chat_service import ChatService
from app.deps import get_current_user_id

router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post("/", response_model=ChatMessageResponse)
async def send_message(
    data: ChatMessageRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Send a message to the Gemini-powered mental health chatbot."""
    return await ChatService.send_message(user_id, data)


@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(user_id: str = Depends(get_current_user_id)):
    """Get chat history for the current user."""
    return await ChatService.get_history(user_id)


@router.delete("/history")
async def clear_chat_history(user_id: str = Depends(get_current_user_id)):
    """Clear chat history for the current user."""
    deleted = await ChatService.clear_history(user_id)
    return {"success": deleted, "message": "Chat history cleared" if deleted else "No history to clear"}
