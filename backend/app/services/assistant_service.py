import json
import re
from typing import Dict, List, Optional
import httpx
from app.config import settings
from app.schemas.assistant import ChatRequest, ChatResponse, ExtractedJourneySlots
from app.services.geocoding_service import GeocodingService
from app.services.planner_service import PlannerService
from app.schemas.journey import JourneyPlanRequest


class AssistantService:
    @staticmethod
    def extract_slots_rule_based(message: str) -> ExtractedJourneySlots:
        text = message.strip()
        lower = text.lower()

        origin = None
        destination = None
        arrival_time = None
        budget = None
        purpose = "interview" if "interview" in lower else ("exam" if "exam" in lower else ("appointment" if "appointment" in lower else "travel"))
        needs_breakfast = any(w in lower for w in ["breakfast", "tiffin", "food", "eat", "dosa", "idli", "tea", "coffee"])
        needs_freshen_up = any(w in lower for w in ["freshen", "washroom", "toilet", "restroom", "bath"])
        needs_waiting = any(w in lower for w in ["wait", "lounge", "park", "early", "rest"])

        # Extract Origin patterns: "starting from X", "from X", "leaving X", "origin X"
        from_match = re.search(r'(?:starting\s+from|from|leaving|start\s+at)\s+([a-zA-Z0-9\s,\.\(\)]+?)(?:\s+(?:to|at|by|reach|in|for|with)|\.|\,|$)', text, re.IGNORECASE)
        if from_match:
            cand = from_match.group(1).strip()
            if len(cand) > 2 and cand.lower() not in ["here", "my place", "home"]:
                origin = cand

        # Extract Destination patterns: "interview in/at Y", "to Y", "destination Y", "going to Y", "reach Y"
        to_match = re.search(r'(?:to|destination|going\s+to|reach|interview\s+(?:in|at)|exam\s+(?:in|at))\s+([a-zA-Z0-9\s,\.\(\)]+?)(?:\s+(?:from|at|by|starting|with|and|\d)|\.|\,|$)', text, re.IGNORECASE)
        if to_match:
            cand = to_match.group(1).strip()
            if len(cand) > 2:
                destination = cand

        # Extract Time: "at 10 AM", "by 10:30 AM", "at 9:00", "10am", "reach by 10"
        time_match = re.search(r'(?:at|by|before|around)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)', text, re.IGNORECASE)
        if time_match:
            raw_time = time_match.group(1).strip()
            if not re.search(r'(?:am|pm)', raw_time, re.IGNORECASE):
                # Default morning if reasonable
                val = int(raw_time.split(":")[0])
                if 1 <= val <= 11:
                    raw_time += " AM"
                elif val == 12:
                    raw_time += " PM"
            arrival_time = raw_time

        # Extract Budget: "limited", "cheap", "lowest", "under ₹500", "₹100"
        if any(w in lower for w in ["limited", "low", "cheap", "student", "economical", "lowest cost"]):
            budget = "low"
        elif any(w in lower for w in ["cab", "taxi", "luxury", "fast", "no budget"]):
            budget = "flexible"
        else:
            budget = "moderate"

        # Check missing fields
        missing = []
        if not origin:
            missing.append("origin (where are you starting from?)")
        if not destination:
            missing.append("destination (where are you going?)")
        if not arrival_time:
            missing.append("arrival time (what time do you need to reach?)")

        is_complete = len(missing) == 0

        return ExtractedJourneySlots(
            origin=origin,
            destination=destination,
            arrival_time=arrival_time,
            budget=budget,
            purpose=purpose,
            needs_breakfast=needs_breakfast,
            needs_freshen_up=needs_freshen_up,
            needs_waiting_place=needs_waiting,
            is_complete=is_complete,
            missing_fields=missing,
        )

    @staticmethod
    async def chat(req: ChatRequest) -> ChatResponse:
        message = req.message
        lang = req.language or "en"
        slots = AssistantService.extract_slots_rule_based(message)

        # Attempt Ollama LLM if reachable
        ollama_data = None
        try:
            prompt = (
                f"You are ThenStep AI, an intelligent smart travel assistant for India. "
                f"The user says: '{message}'. "
                f"Extract travel parameters: origin, destination, arrival_time, budget, purpose, needs_breakfast. "
                f"Reply concisely in {lang}. Do not hallucinate fake bus numbers or unreal fares."
            )
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={"model": settings.OLLAMA_MODEL, "prompt": prompt, "stream": False},
                )
                if res.status_code == 200:
                    ollama_data = res.json().get("response")
        except Exception:
            ollama_data = None

        engine = "ollama_llm" if ollama_data else "rule_based"

        # If essential information is missing, ask clearly in the user's selected language
        if not slots.is_complete:
            if lang == "kn":
                reply = f"ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಪ್ರಯಾಣವನ್ನು ಯೋಜಿಸಲು ಈ ವಿವರಗಳನ್ನು ನೀಡಿ: {', '.join(slots.missing_fields)}."
            elif lang == "hi":
                reply = f"धन्यवाद! आपकी यात्रा की योजना बनाने के लिए कृपया ये विवरण दें: {', '.join(slots.missing_fields)}."
            else:
                reply = (
                    f"I can certainly help you plan this! To generate your verified journey plan, please share: "
                    f"{', '.join(slots.missing_fields)}."
                )

            return ChatResponse(
                reply=reply,
                reply_language=lang,
                extracted_slots=slots,
                suggested_action="ask_slots",
                engine=engine,
            )

        # All essential slots are present! Let's resolve real coordinates via Geocoding
        origin_pts = await GeocodingService.search_locations(slots.origin or "", limit=1)
        dest_pts = await GeocodingService.search_locations(slots.destination or "", limit=1)

        if not origin_pts or not dest_pts:
            msg = (
                f"I understood that you want to travel from '{slots.origin}' to '{slots.destination}', "
                f"but I couldn't locate one of these on OpenStreetMap. Could you clarify the landmark or city?"
            )
            return ChatResponse(
                reply=msg,
                reply_language=lang,
                extracted_slots=slots,
                suggested_action="clarify_location",
                engine=engine,
            )

        o_pt = origin_pts[0]
        d_pt = dest_pts[0]

        # Generate a real, verified journey plan
        plan_req = JourneyPlanRequest(
            origin_name=o_pt.name,
            origin_lat=o_pt.lat,
            origin_lon=o_pt.lon,
            destination_name=d_pt.name,
            destination_lat=d_pt.lat,
            destination_lon=d_pt.lon,
            purpose=slots.purpose or "interview",
            arrival_time=slots.arrival_time or "10:00 AM",
            budget_level=slots.budget or "moderate",
            priority="lowest_cost" if slots.budget == "low" else "shortest_time",
            needs_breakfast=slots.needs_breakfast,
            needs_freshen_up=slots.needs_freshen_up,
            needs_waiting_place=slots.needs_waiting_place,
        )

        plan = await PlannerService.plan_journey(plan_req)
        best_route = plan.selected_route
        calc = plan.arrival_calculator

        if lang == "kn":
            reply = (
                f"✅ ನಿಮ್ಮ ಪ್ರಯಾಣದ ಯೋಜನೆ ಸಿದ್ಧವಾಗಿದೆ! "
                f"{o_pt.name} ನಿಂದ {d_pt.name} ಗೆ {slots.arrival_time} ಕ್ಕೆ ತಲುಪಲು, "
                f"ಸುರಕ್ಷಿತ ನಿರ್ಗಮನ ಸಮಯ: **{calc.suggested_departure_time}** "
                f"({calc.safety_buffer_min} ನಿಮಿಷಗಳ ಬಫರ್ ಸಹಿತ). "
                f"ಶಿಫಾರಸು ಮಾಡಲಾದ ಮಾರ್ಗ: **{best_route.title}** ({best_route.fare_label}, ~{best_route.estimated_duration_min} ನಿಮಿಷಗಳು)."
            )
        elif lang == "hi":
            reply = (
                f"✅ आपकी यात्रा की योजना तैयार है! "
                f"{o_pt.name} से {d_pt.name} तक {slots.arrival_time} तक पहुंचने के लिए, "
                f"सुझाया गया प्रस्थान समय: **{calc.suggested_departure_time}** "
                f"({calc.safety_buffer_min} मिनट के सुरक्षा बफर के साथ)। "
                f"अनुशंसित विकल्प: **{best_route.title}** ({best_route.fare_label}, लगभग {best_route.estimated_duration_min} मिनट)।"
            )
        else:
            reply = (
                f"✅ Here is your smart plan from **{o_pt.name}** to **{d_pt.name}** for your {slots.purpose.title()}! \n\n"
                f"• **Target Arrival**: {calc.required_arrival_time}\n"
                f"• **Suggested Departure Time**: **{calc.suggested_departure_time}** (includes a {calc.safety_buffer_min}-min safety buffer)\n"
                f"• **Recommended Option**: **{best_route.title}** ({best_route.fare_label}, ~{best_route.estimated_duration_min} mins)\n"
            )
            if calc.traffic_peak_warning:
                reply += f"\n{calc.traffic_peak_warning}\n"
            if slots.needs_breakfast:
                reply += "\n🍳 I've also flagged nearby tiffin & breakfast options at your destination in the Nearby Places tab."

        return ChatResponse(
            reply=reply,
            reply_language=lang,
            extracted_slots=slots,
            suggested_action="load_plan",
            plan_data=plan.model_dump(),
            engine=engine,
        )
