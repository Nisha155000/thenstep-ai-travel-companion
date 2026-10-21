from fastapi import APIRouter, Query, HTTPException
from app.schemas.place import NearbyPlacesResponse
from app.services.places_service import PlacesService

router = APIRouter(prefix="/places", tags=["Places"])


@router.get("/nearby", response_model=NearbyPlacesResponse)
async def get_nearby_places(
    lat: float = Query(..., description="Latitude of center coordinate"),
    lon: float = Query(..., description="Longitude of center coordinate"),
    category: str = Query("breakfast", description="Category: breakfast, restaurant, toilets, freshen_up, waiting_place, transit_stop"),
    radius: int = Query(1500, ge=300, le=5000, description="Search radius in meters"),
    limit: int = Query(12, ge=1, le=25, description="Max results"),
):
    try:
        places = await PlacesService.get_nearby_places(
            lat=lat,
            lon=lon,
            category=category,
            radius_meters=radius,
            limit=limit,
        )
        return NearbyPlacesResponse(
            center_lat=lat,
            center_lon=lon,
            category=category,
            radius_meters=radius,
            total_found=len(places),
            places=places,
            data_source="OpenStreetMap Overpass API & Public Facility Directory",
            limitation_note="Verified public facilities are marked. Commercial places require customer patronization.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch nearby places: {str(e)}")
