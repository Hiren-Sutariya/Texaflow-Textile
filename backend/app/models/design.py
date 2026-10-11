from sqlalchemy import Column, String, Float, Text
from app.core.database import Base
from app.models.base import TimestampMixin

class Design(Base, TimestampMixin):
    __tablename__ = "03_design_library"


    id = Column(String(64), primary_key=True)
    folder_code = Column(String(64), nullable=False, unique=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    party_name = Column(String(255), nullable=True)
    created_date = Column(String(16), nullable=False) # DD-MM-YYYY
    machine_requirement = Column(String(128), nullable=True)
    takko_length_meters = Column(Float, default=104.0)
    cut_length_meters = Column(Float, default=0.93)
    items = Column(Text, nullable=True)
    colorways = Column(Text, nullable=True)
