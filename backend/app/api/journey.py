from fastapi import APIRouter, HTTPException
from app.schemas.journey import JourneyPlanRequest, JourneyPlanResponse
from app.services.planner_service import PlannerService

router = APIRouter(prefix="/journey", tags=["Journey"])


@router.post("/plan", response_model=JourneyPlanResponse)
async def plan_journey(req: JourneyPlanRequest):
    try:
        plan = await PlannerService.plan_journey(req)
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Journey planning error: {str(e)}")
