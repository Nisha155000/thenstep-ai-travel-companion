from typing import Optional
from pydantic import BaseModel, Field


class LocationPoint(BaseModel):
    name: str
    lat: float
    lon: float
    display_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    category: Optional[str] = None


class LocationSearchResponse(BaseModel):
    query: str
    results: list[LocationPoint]
    source: str = "Nominatim OpenStreetMap"
