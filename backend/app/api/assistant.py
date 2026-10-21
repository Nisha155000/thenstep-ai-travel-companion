from fastapi import APIRouter, HTTPException
from app.schemas.assistant import ChatRequest, ChatResponse
from app.services.assistant_service import AssistantService

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(req: ChatRequest):
    try:
        response = await AssistantService.chat(req)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant error: {str(e)}")
