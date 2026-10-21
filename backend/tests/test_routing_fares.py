import pytest
from app.services.transit_service import TransitService
from app.services.routing_service import haversine_distance_km


def test_haversine_distance():
    # Majestic to Sarjapur Road (~22-24 km)
    dist = haversine_distance_km(12.9781, 77.5696, 12.9081, 77.6974)
    assert 15.0 < dist < 30.0


def test_fare_calculations():
    # Auto fare for 10 km: base 30 (2km) + 8*15 = 150
    auto_fare, label, breakdown = TransitService.calculate_transit_fare(10.0, "auto")
    assert auto_fare == 150.0
    assert "Meter" in label

    # Bus ordinary for 15 km: should be around ₹20
    bus_fare, bus_label, _ = TransitService.calculate_transit_fare(15.0, "bus_ordinary")
    assert bus_fare == 20.0

    # Metro for 10 km: should be ₹30
    metro_fare, _, _ = TransitService.calculate_transit_fare(10.0, "metro")
    assert metro_fare == 30.0

    # Bike taxi for 5 km: base 25 (2km) + 3*8 = 49
    bike_fare, _, _ = TransitService.calculate_transit_fare(5.0, "bike")
    assert bike_fare == 49.0
