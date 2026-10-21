import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict


class SavedJourneyCreate(BaseModel):
    title: str
    origin_name: str
    origin_lat: float
    origin_lon: float
    destination_name: str
    destination_lat: float
    destination_lon: float
    purpose: str = "interview"
    arrival_time: str
    suggested_departure_time: Optional[str] = None
    buffer_minutes: int = 30
    selected_mode: str
    estimated_duration_min: int
    estimated_fare: Optional[str] = None
    itinerary_data: Any


class SavedJourneyResponse(BaseModel):
    id: int
    title: str
    origin_name: str
    origin_lat: float
    origin_lon: float
    destination_name: str
    destination_lat: float
    destination_lon: float
    purpose: str
    arrival_time: str
    suggested_departure_time: Optional[str] = None
    buffer_minutes: int
    selected_mode: str
    estimated_duration_min: int
    estimated_fare: Optional[str] = None
    itinerary_data: Any
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
