from typing import List, Optional
from pydantic import BaseModel


class NearbyPlace(BaseModel):
    id: str
    name: str
    category: str  # "breakfast", "restaurant", "toilets", "freshen_up", "waiting_place", "transit_stop"
    category_label: str
    lat: float
    lon: float
    distance_meters: int
    access_type: str  # "verified_public", "commercial_customer_only", "unconfirmed"
    access_label: str  # e.g., "Verified Public Facility", "Customer Access (Purchase Required)"
    address: Optional[str] = None
    opening_hours: Optional[str] = None
    cuisine: Optional[str] = None
    confirmation_note: str
    osm_type: Optional[str] = None
    osm_id: Optional[int] = None


class NearbyPlacesResponse(BaseModel):
    center_lat: float
    center_lon: float
    category: str
    radius_meters: int
    total_found: int
    places: List[NearbyPlace]
    data_source: str = "OpenStreetMap Overpass API"
    limitation_note: str
