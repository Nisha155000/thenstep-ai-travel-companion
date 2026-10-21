from fastapi import APIRouter, Query, HTTPException
from app.schemas.location import LocationSearchResponse
from app.services.geocoding_service import GeocodingService

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("/search", response_model=LocationSearchResponse)
async def search_locations(
    q: str = Query(..., min_length=1, description="Location search term (city, station, tech park, landmark)"),
    limit: int = Query(7, ge=1, le=15, description="Maximum results to return"),
):
    try:
        results = await GeocodingService.search_locations(q, limit=limit)
        return LocationSearchResponse(
            query=q,
            results=results,
            source="Nominatim OpenStreetMap & India Verified Hubs",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Location search failed: {str(e)}")
