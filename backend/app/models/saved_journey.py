import datetime
import json
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.database import Base


class SavedJourney(Base):
    __tablename__ = "saved_journeys"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    origin_name = Column(String, nullable=False)
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    destination_name = Column(String, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lon = Column(Float, nullable=False)
    purpose = Column(String, default="interview")
    arrival_time = Column(String, nullable=False)
    suggested_departure_time = Column(String, nullable=True)
    buffer_minutes = Column(Integer, default=30)
    selected_mode = Column(String, nullable=False)
    estimated_duration_min = Column(Integer, nullable=False)
    estimated_fare = Column(String, nullable=True)
    itinerary_json = Column(Text, nullable=False)  # Full JSON string of the steps & route
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def get_itinerary(self):
        try:
            return json.loads(self.itinerary_json)
        except Exception:
            return {}
