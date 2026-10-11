from sqlalchemy import Column, String, Integer
from app.core.database import Base
from app.models.base import TimestampMixin
import uuid

class FinishedDesign(Base, TimestampMixin):
    __tablename__ = "finished_designs"

    id = Column(String(64), primary_key=True, default=lambda: f"dsp-{uuid.uuid4().hex[:12]}")
    order_id = Column(String(64), nullable=True)
    design_code = Column(String(128), nullable=False, index=True)
    design_name = Column(String(255), nullable=False)
    party_name = Column(String(255), nullable=False, index=True)
    machine_number = Column(String(64), nullable=False)
    total_pcs_produced = Column(Integer, nullable=False, default=0)
    total_stitches = Column(Integer, nullable=True, default=0)
    completion_date = Column(String(16), nullable=False)
    status = Column(String(32), nullable=False, default="Ready for Dispatch", index=True)
    dispatched_pcs = Column(Integer, nullable=False, default=0)
    remaining_pcs = Column(Integer, nullable=False, default=0)
