from typing import List, Optional
from pydantic import BaseModel
from app.schemas.route import RouteOption


class JourneyPlanRequest(BaseModel):
    origin_name: str
    origin_lat: float
    origin_lon: float
    destination_name: str
    destination_lat: float
    destination_lon: float
    purpose: str = "interview"  # "interview", "exam", "appointment", "work", "other"
    arrival_time: str  # e.g., "10:00" or "10:00 AM" or "2026-10-18T10:00"
    budget_level: str = "moderate"  # "low", "moderate", "flexible"
    budget_limit_inr: Optional[float] = None
    priority: str = "lowest_cost"  # "lowest_cost", "shortest_time", "less_walking", "fewer_transfers"
    custom_buffer_minutes: Optional[int] = None
    needs_breakfast: bool = False
    needs_freshen_up: bool = False
    needs_waiting_place: bool = False


class InterviewBufferSummary(BaseModel):
    required_arrival_time: str
    suggested_departure_time: str
    estimated_journey_duration_min: int
    safety_buffer_min: int
    buffer_rationale: str
    traffic_peak_warning: Optional[str] = None
    data_limitation_warning: str


class JourneyPlanResponse(BaseModel):
    plan_id: str
    purpose: str
    arrival_calculator: InterviewBufferSummary
    ranked_routes: List[RouteOption]
    selected_route: RouteOption
    nearby_recommendations_summary: dict
    honest_disclaimer: str
