import asyncio
import pytest
from app.services.planner_service import calculate_departure_time, parse_time_str, PlannerService
from app.schemas.journey import JourneyPlanRequest


def test_time_parser():
    t1 = parse_time_str("10:00 AM")
    assert t1 is not None
    assert t1.hour == 10
    assert t1.minute == 0

    t2 = parse_time_str("09:30")
    assert t2 is not None
    assert t2.hour == 9
    assert t2.minute == 30


def test_calculate_departure_time_with_buffer():
    # 10:00 AM arrival, 45 min journey, 30 min buffer -> total lead 75 min -> departure 8:45 AM
    dep, traffic_warn = calculate_departure_time("10:00 AM", 45, 30)
    assert dep == "8:45 AM"
    # 8:45 AM is in peak traffic window (8:30-10:30)
    assert traffic_warn is not None
    assert "Peak Traffic Alert" in traffic_warn


def test_full_journey_planning():
    # Majestic (12.9781, 77.5696) to Sarjapur (12.9081, 77.6974)
    req = JourneyPlanRequest(
        origin_name="Majestic Bus Station",
        origin_lat=12.9781,
        origin_lon=77.5696,
        destination_name="Sarjapur Road Tech Park",
        destination_lat=12.9081,
        destination_lon=77.6974,
        purpose="interview",
        arrival_time="10:00 AM",
        budget_level="low",
        priority="lowest_cost",
        needs_breakfast=True,
    )
    plan = asyncio.run(PlannerService.plan_journey(req))

    assert plan.plan_id is not None
    assert len(plan.ranked_routes) > 0
    # Selected route should be low cost (e.g., city bus)
    assert plan.selected_route.estimated_fare_inr is not None
    assert plan.arrival_calculator.suggested_departure_time is not None
    assert plan.arrival_calculator.safety_buffer_min >= 35
