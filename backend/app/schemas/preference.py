from typing import Optional
from pydantic import BaseModel, ConfigDict


class UserPreferenceBase(BaseModel):
    default_buffer_minutes: int = 30
    preferred_mode: str = "any"  # "transit", "auto", "cab", "any"
    priority: str = "lowest_cost"  # "lowest_cost", "shortest_time", "less_walking", "fewer_transfers"
    language: str = "en"  # "en", "kn", "hi"


class UserPreferenceUpdate(BaseModel):
    default_buffer_minutes: Optional[int] = None
    preferred_mode: Optional[str] = None
    priority: Optional[str] = None
    language: Optional[str] = None


class UserPreferenceResponse(UserPreferenceBase):
    id: int
    user_identifier: str

    model_config = ConfigDict(from_attributes=True)
