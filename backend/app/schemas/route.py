from typing import List, Optional
from pydantic import BaseModel, Field


class RouteStep(BaseModel):
    step_number: int
    mode: str  # "walk", "bus", "metro", "train", "auto", "cab", "bike"
    instruction: str
    instruction_kn: Optional[str] = None
    instruction_hi: Optional[str] = None
    distance_meters: float
    duration_minutes: int
    from_name: str
    to_name: str
    line_number: Optional[str] = None
    frequency_notes: Optional[str] = None
    is_general_recommendation: bool = False


class RouteOption(BaseModel):
    id: str
    mode: str  # "transit_bus", "transit_metro", "transit_rail", "auto", "cab", "bike", "walk", "multimodal"
    title: str
    subtitle: str
    estimated_duration_min: int
    distance_km: float
    walking_distance_m: float
    transfers: int
    estimated_fare_inr: Optional[float] = None
    fare_label: str  # e.g. "₹25 - ₹35 (Stage Fare)"
    is_fare_estimated: bool = True
    fare_breakdown: Optional[str] = None
    ranking_score: float = 0.0
    ranking_badge: Optional[str] = None  # e.g. "Cheapest", "Fastest", "Recommended"
    data_source: str
    limitations: List[str] = []
    coordinates: List[List[float]] = []  # [[lat, lon], ...]
    steps: List[RouteStep] = []


class RouteCompareRequest(BaseModel):
    origin_name: str
    origin_lat: float
    origin_lon: float
    destination_name: str
    destination_lat: float
    destination_lon: float
    priority: str = "lowest_cost"  # "lowest_cost", "shortest_time", "less_walking", "fewer_transfers"
    budget_limit_inr: Optional[float] = None


class RouteCompareResponse(BaseModel):
    origin: dict
    destination: dict
    recommended_option_id: str
    options: List[RouteOption]
    note: str
