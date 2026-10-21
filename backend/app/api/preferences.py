from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user_preference import UserPreference
from app.schemas.preference import UserPreferenceResponse, UserPreferenceUpdate

router = APIRouter(prefix="/preferences", tags=["Preferences"])


@router.get("", response_model=UserPreferenceResponse)
async def get_preferences(db: Session = Depends(get_db)):
    pref = db.query(UserPreference).filter(UserPreference.user_identifier == "default_user").first()
    if not pref:
        pref = UserPreference(
            user_identifier="default_user",
            default_buffer_minutes=30,
            preferred_mode="any",
            priority="lowest_cost",
            language="en",
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.put("", response_model=UserPreferenceResponse)
async def update_preferences(data: UserPreferenceUpdate, db: Session = Depends(get_db)):
    pref = db.query(UserPreference).filter(UserPreference.user_identifier == "default_user").first()
    if not pref:
        pref = UserPreference(user_identifier="default_user")
        db.add(pref)

    if data.default_buffer_minutes is not None:
        pref.default_buffer_minutes = data.default_buffer_minutes
    if data.preferred_mode is not None:
        pref.preferred_mode = data.preferred_mode
    if data.priority is not None:
        pref.priority = data.priority
    if data.language is not None:
        pref.language = data.language

    db.commit()
    db.refresh(pref)
    return pref
