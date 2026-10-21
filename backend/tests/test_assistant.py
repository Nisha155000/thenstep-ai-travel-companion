import asyncio
import pytest
from app.services.assistant_service import AssistantService
from app.schemas.assistant import ChatRequest


def test_slot_extraction_interview_sarjapur():
    msg = "I have an interview in Sarjapur at 10 AM. I am starting from Majestic. My budget is limited. Help me find affordable breakfast."
    slots = AssistantService.extract_slots_rule_based(msg)

    assert slots.origin is not None
    assert "majestic" in slots.origin.lower()
    assert slots.destination is not None
    assert "sarjapur" in slots.destination.lower()
    assert slots.arrival_time is not None
    assert "10" in slots.arrival_time
    assert slots.budget == "low"
    assert slots.purpose == "interview"
    assert slots.needs_breakfast is True
    assert slots.is_complete is True


def test_slot_extraction_missing_fields():
    msg = "I need to go to Sarjapur for an interview."
    slots = AssistantService.extract_slots_rule_based(msg)
    assert slots.is_complete is False
    assert any("origin" in m for m in slots.missing_fields)
    assert any("arrival" in m for m in slots.missing_fields)


def test_assistant_chat_flow():
    req = ChatRequest(
        message="I have an interview in Sarjapur at 10 AM. Starting from Majestic. Budget is low.",
        language="en",
    )
    res = asyncio.run(AssistantService.chat(req))
    assert res.reply is not None
    assert len(res.reply) > 20
    assert "Sarjapur" in res.reply or "plan" in res.reply.lower()
