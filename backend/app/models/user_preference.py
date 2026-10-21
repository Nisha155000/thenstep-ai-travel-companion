import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_identifier = Column(String, unique=True, index=True, default="default_user")
    default_buffer_minutes = Column(Integer, default=30)
    preferred_mode = Column(String, default="any")  # "transit", "auto", "cab", "any"
    priority = Column(String, default="lowest_cost")  # "lowest_cost", "shortest_time", "less_walking", "fewer_transfers"
    language = Column(String, default="en")  # "en", "kn", "hi"
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
