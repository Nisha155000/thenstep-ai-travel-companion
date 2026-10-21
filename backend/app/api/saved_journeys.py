import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.saved_journey import SavedJourney
from app.schemas.saved_journey import SavedJourneyCreate, SavedJourneyResponse

router = APIRouter(prefix="/journeys", tags=["Saved Journeys"])


@router.get("", response_model=List[SavedJourneyResponse])
async def list_saved_journeys(db: Session = Depends(get_db)):
    journeys = db.query(SavedJourney).order_by(SavedJourney.created_at.desc()).all()
    results = []
    for j in journeys:
        results.append(
            SavedJourneyResponse(
                id=j.id,
                title=j.title,
                origin_name=j.origin_name,
                origin_lat=j.origin_lat,
                origin_lon=j.origin_lon,
                destination_name=j.destination_name,
                destination_lat=j.destination_lat,
                destination_lon=j.destination_lon,
                purpose=j.purpose,
                arrival_time=j.arrival_time,
                suggested_departure_time=j.suggested_departure_time,
                buffer_minutes=j.buffer_minutes,
                selected_mode=j.selected_mode,
                estimated_duration_min=j.estimated_duration_min,
                estimated_fare=j.estimated_fare,
                itinerary_data=j.get_itinerary(),
                created_at=j.created_at,
            )
        )
    return results


@router.post("", response_model=SavedJourneyResponse)
async def create_saved_journey(data: SavedJourneyCreate, db: Session = Depends(get_db)):
    itinerary_str = json.dumps(data.itinerary_data) if not isinstance(data.itinerary_data, str) else data.itinerary_data
    journey = SavedJourney(
        title=data.title,
        origin_name=data.origin_name,
        origin_lat=data.origin_lat,
        origin_lon=data.origin_lon,
        destination_name=data.destination_name,
        destination_lat=data.destination_lat,
        destination_lon=data.destination_lon,
        purpose=data.purpose,
        arrival_time=data.arrival_time,
        suggested_departure_time=data.suggested_departure_time,
        buffer_minutes=data.buffer_minutes,
        selected_mode=data.selected_mode,
        estimated_duration_min=data.estimated_duration_min,
        estimated_fare=data.estimated_fare,
        itinerary_json=itinerary_str,
    )
    db.add(journey)
    db.commit()
    db.refresh(journey)

    return SavedJourneyResponse(
        id=journey.id,
        title=journey.title,
        origin_name=journey.origin_name,
        origin_lat=journey.origin_lat,
        origin_lon=journey.origin_lon,
        destination_name=journey.destination_name,
        destination_lat=journey.destination_lat,
        destination_lon=journey.destination_lon,
        purpose=journey.purpose,
        arrival_time=journey.arrival_time,
        suggested_departure_time=journey.suggested_departure_time,
        buffer_minutes=journey.buffer_minutes,
        selected_mode=journey.selected_mode,
        estimated_duration_min=journey.estimated_duration_min,
        estimated_fare=journey.estimated_fare,
        itinerary_data=journey.get_itinerary(),
        created_at=journey.created_at,
    )


@router.delete("/{journey_id}")
async def delete_saved_journey(journey_id: int, db: Session = Depends(get_db)):
    journey = db.query(SavedJourney).filter(SavedJourney.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Saved journey not found")
    db.delete(journey)
    db.commit()
    return {"status": "success", "message": f"Journey {journey_id} deleted"}
