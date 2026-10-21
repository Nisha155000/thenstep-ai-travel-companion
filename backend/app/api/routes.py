from fastapi import APIRouter, HTTPException
from app.schemas.route import RouteCompareRequest, RouteCompareResponse
from app.schemas.journey import JourneyPlanRequest
from app.services.planner_service import PlannerService

router = APIRouter(prefix="/routes", tags=["Routes"])


@router.post("/compare", response_model=RouteCompareResponse)
async def compare_routes(req: RouteCompareRequest):
    try:
        # Wrap into standard JourneyPlanRequest to compute multi-modal options
        plan_req = JourneyPlanRequest(
            origin_name=req.origin_name,
            origin_lat=req.origin_lat,
            origin_lon=req.origin_lon,
            destination_name=req.destination_name,
            destination_lat=req.destination_lat,
            destination_lon=req.destination_lon,
            purpose="travel",
            arrival_time="10:00 AM",
            priority=req.priority,
            budget_limit_inr=req.budget_limit_inr,
        )
        plan = await PlannerService.plan_journey(plan_req)

        return RouteCompareResponse(
            origin={"name": req.origin_name, "lat": req.origin_lat, "lon": req.origin_lon},
            destination={"name": req.destination_name, "lat": req.destination_lat, "lon": req.destination_lon},
            recommended_option_id=plan.selected_route.id,
            options=plan.ranked_routes,
            note=plan.honest_disclaimer,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compare routes: {str(e)}")
