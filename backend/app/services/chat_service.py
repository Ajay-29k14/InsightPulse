from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from bson import ObjectId
import google.generativeai as genai
from app.database import get_db
from app.config import get_settings
from app.core.exceptions import RateLimitError
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, ChatHistoryItem, ChatHistoryResponse

settings = get_settings()

# Configure Gemini
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = """You are InsightPulse, a compassionate and knowledgeable mental health support assistant. 
You help users understand their DASS-21 assessment results and provide evidence-based coping strategies.

Guidelines:
- Be empathetic, non-judgmental, and supportive
- Provide practical, actionable advice for managing depression, anxiety, and stress
- Suggest evidence-based techniques like CBT, mindfulness, breathing exercises, and lifestyle changes
- Always encourage professional help for severe symptoms
- Never diagnose or replace professional mental health care
- Keep responses concise but thorough (under 200 words when possible)
- If a user expresses suicidal ideation, immediately provide crisis resources and encourage emergency help

You are not a replacement for professional mental health care. Always include a disclaimer when appropriate."""

# Rate limiting: max 50 messages per hour per user
RATE_LIMIT_MAX = 50
RATE_LIMIT_WINDOW = 3600  # 1 hour in seconds


class ChatService:
    @staticmethod
    async def check_rate_limit(user_id: str) -> bool:
        db = get_db()
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=RATE_LIMIT_WINDOW)
        
        count = await db.chat_messages.count_documents({
            "user_id": ObjectId(user_id),
            "role": "user",
            "created_at": {"$gte": cutoff}
        })
        
        return count < RATE_LIMIT_MAX
    
    @staticmethod
    async def send_message(user_id: str, data: ChatMessageRequest) -> ChatMessageResponse:
        db = get_db()
        
        # Check rate limit
        if not await ChatService.check_rate_limit(user_id):
            raise RateLimitError(f"Chat limit exceeded. Max {RATE_LIMIT_MAX} messages per hour.")
        
        # Store user message
        user_msg_doc = {
            "user_id": ObjectId(user_id),
            "role": "user",
            "content": data.message,
            "created_at": datetime.now(timezone.utc)
        }
        await db.chat_messages.insert_one(user_msg_doc)
        
        # Get conversation history (last 10 messages for context)
        history_cursor = db.chat_messages.find(
            {"user_id": ObjectId(user_id)}
        ).sort("created_at", -1).limit(10)
        
        history = []
        async for doc in history_cursor:
            history.append({
                "role": doc["role"],
                "content": doc["content"]
            })
        history.reverse()  # Oldest first
        
        # Generate response with Gemini
        response_text = await ChatService._generate_gemini_response(data.message, history)
        
        # Store assistant message
        assistant_msg_doc = {
            "user_id": ObjectId(user_id),
            "role": "assistant",
            "content": response_text,
            "created_at": datetime.now(timezone.utc)
        }
        await db.chat_messages.insert_one(assistant_msg_doc)
        
        return ChatMessageResponse(
            response=response_text,
            timestamp=assistant_msg_doc["created_at"]
        )
    
    @staticmethod
    async def _generate_gemini_response(message: str, history: List[Dict[str, str]]) -> str:
        if not settings.gemini_api_key:
            return "I'm sorry, but the chatbot is not configured with an API key. Please contact the administrator."
        
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            # Build conversation context
            chat = model.start_chat(history=[])
            
            # Add system context as first message
            context_msg = SYSTEM_PROMPT + "\n\nPrevious conversation:\n"
            for h in history[:-1]:  # Exclude the current message
                context_msg += f"{h['role']}: {h['content']}\n"
            
            context_msg += f"\nUser's current message: {message}"
            
            response = chat.send_message(context_msg)
            return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")
            # Fallback response
            return "I apologize, but I'm having trouble connecting to my knowledge base right now. For immediate support with anxiety or stress, try deep breathing: inhale for 4 counts, hold for 4, exhale for 6. If you're in crisis, please contact a mental health professional or emergency services."
    
    @staticmethod
    async def get_history(user_id: str) -> ChatHistoryResponse:
        db = get_db()
        
        cursor = db.chat_messages.find(
            {"user_id": ObjectId(user_id)}
        ).sort("created_at", 1)
        
        messages = []
        async for doc in cursor:
            messages.append(ChatHistoryItem(
                role=doc["role"],
                content=doc["content"],
                created_at=doc["created_at"]
            ))
        
        return ChatHistoryResponse(messages=messages)
    
    @staticmethod
    async def clear_history(user_id: str) -> bool:
        db = get_db()
        result = await db.chat_messages.delete_many({"user_id": ObjectId(user_id)})
        return result.deleted_count > 0
