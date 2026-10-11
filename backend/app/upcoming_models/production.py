from sqlalchemy import Column, String, Float, Integer
from app.core.database import Base
from app.models.base import TimestampMixin
import uuid

class Machine(Base, TimestampMixin):
    __tablename__ = "machines"

    id = Column(String(64), primary_key=True, default=lambda: f"mch-{uuid.uuid4().hex[:12]}")
    name = Column(String(128), nullable=False, unique=True, index=True)
    heads = Column(Integer, nullable=False, default=24)
    speed_rpm = Column(Integer, nullable=False, default=850)
    status = Column(String(32), nullable=False, default="Running", index=True) # Running, Idle, Maintenance
    current_order_no = Column(String(64), nullable=True)
    current_design_no = Column(String(128), nullable=True)
    operator_name = Column(String(128), nullable=True)
    shift = Column(String(32), nullable=False, default="Day")
    efficiency_pct = Column(Float, nullable=False, default=95.0)
