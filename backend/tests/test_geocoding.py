import asyncio
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.geocoding_service import GeocodingService

client = TestClient(app)


def test_geocoding_popular_hub_bengaluru():
    results = asyncio.run(GeocodingService.search_locations("Majestic", limit=5))
    assert len(results) > 0
    top = results[0]
    assert "Majestic" in top.name or "Bengaluru" in top.name or "KSR" in top.name
    assert top.lat > 12.0 and top.lon > 77.0


def test_geocoding_popular_hub_all_india():
    for city in ["New Delhi", "Mumbai", "Secunderabad", "Sarjapur"]:
        results = asyncio.run(GeocodingService.search_locations(city, limit=3))
        assert len(results) > 0, f"No results for {city}"


def test_locations_search_api():
    response = client.get("/api/locations/search?q=Sarjapur")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) > 0
    assert "Sarjapur" in data["results"][0]["name"] or "Sarjapur" in data["results"][0].get("display_name", "")
