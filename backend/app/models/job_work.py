from sqlalchemy import Column, String, Float, Integer, Text
from app.core.database import Base
from app.models.base import TimestampMixin
import uuid

class JobOrder(Base, TimestampMixin):
    __tablename__ = "job_orders"

    id = Column(String(64), primary_key=True, default=lambda: f"job-{uuid.uuid4().hex[:12]}")
    order_no = Column(String(64), nullable=False, unique=True, index=True)
    party_name = Column(String(255), nullable=False, index=True)
    design_no = Column(String(128), nullable=False, index=True)
    fabric_type = Column(String(128), nullable=True)
    stitches = Column(Integer, nullable=False, default=0)
    total_meters = Column(Float, nullable=False, default=0.0)
    rate_per_meter = Column(Float, nullable=False, default=0.0)
    status = Column(String(32), nullable=False, default="Pending", index=True) # Pending, Running, Completed, Dispatched
    assigned_machine = Column(String(64), nullable=True)
    start_date = Column(String(16), nullable=True)
    delivery_date = Column(String(16), nullable=True)
    remarks = Column(Text, nullable=True)
