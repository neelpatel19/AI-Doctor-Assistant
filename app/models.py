from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Message(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")

class ChatRequest(BaseModel):
    message: str = Field(..., description="User's message/symptoms")
    session_id: str = Field(..., description="Unique session identifier")
    conversation_history: Optional[List[Message]] = Field(
        default=[],
        description="Previous conversation for context"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "I have a headache and fever",
                "session_id": "user_123",
                "conversation_history": []
            }
        }

class ChatResponse(BaseModel):
    reply: str = Field(..., description="Doctor's response")
    context_used: List[str] = Field(..., description="Medical context retrieved")
    session_id: str = Field(..., description="Session identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "reply": "Based on your symptoms...",
                "context_used": ["Flu is associated with fever..."],
                "session_id": "user_123",
                "timestamp": "2025-11-30T10:00:00Z"
            }
        }

class HealthResponse(BaseModel):
    status: str
    embeddings_loaded: bool
    total_documents: int
    version: str
