import asyncio
import pytest
from app.services.places_service import PlacesService


def test_places_curated_fallback():
    # Sarjapur coordinates
    places = asyncio.run(PlacesService.get_nearby_places(12.9081, 77.6974, category="breakfast", limit=5))
    assert len(places) > 0
    p = places[0]
    assert p.category == "breakfast"
    assert p.distance_meters > 0
    assert p.access_type in ["verified_public", "commercial_customer_only", "unconfirmed"]


def test_places_toilets_access_type():
    places = asyncio.run(PlacesService.get_nearby_places(12.9781, 77.5696, category="toilets", limit=5))
    assert len(places) > 0
    assert any(p.access_type == "verified_public" for p in places)
