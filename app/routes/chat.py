from fastapi import APIRouter, HTTPException
from app.models import ChatRequest, ChatResponse, HealthResponse
from app.services.doctor import doctor_service
from app.services.embeddings import embedding_service
from app.config import settings

router = APIRouter(prefix="/api", tags=["Chat"])

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint for AI Doctor
    
    - Accepts user message and conversation history
    - Returns doctor's response with medical context
    - Supports follow-up questions through conversation history
    """
    try:
        # Convert Pydantic models to dicts for service layer
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]
        
        # Get doctor's response
        reply, context_used = doctor_service.get_response(
            user_message=request.message,
            conversation_history=conversation_history
        )
        
        return ChatResponse(
            reply=reply,
            context_used=context_used,
            session_id=request.session_id
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat request: {str(e)}"
        )

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    
    Returns:
        - Service status
        - Embeddings status
        - Document count
        - API version
    """
    try:
        embeddings_loaded = embedding_service.is_ready()
        total_docs = embedding_service.get_document_count()
        
        status = "healthy" if embeddings_loaded else "degraded"
        
        return HealthResponse(
            status=status,
            embeddings_loaded=embeddings_loaded,
            total_documents=total_docs,
            version=settings.API_VERSION
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        )
