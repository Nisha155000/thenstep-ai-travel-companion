from typing import List, Optional
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # "user", "assistant"
    content: str


class ExtractedJourneySlots(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    arrival_time: Optional[str] = None
    budget: Optional[str] = None
    purpose: Optional[str] = None
    needs_breakfast: bool = False
    needs_freshen_up: bool = False
    needs_waiting_place: bool = False
    is_complete: bool = False
    missing_fields: List[str] = []


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    language: str = "en"  # "en", "kn", "hi"


class ChatResponse(BaseModel):
    reply: str
    reply_language: str = "en"
    extracted_slots: Optional[ExtractedJourneySlots] = None
    suggested_action: Optional[str] = None  # e.g., "load_plan", "ask_destination", "view_facilities"
    plan_data: Optional[dict] = None
    engine: str = "rule_based"  # "ollama_llm" or "rule_based"
