from sqlalchemy import Column, String, Float
from app.core.database import Base
from app.models.base import TimestampMixin
import uuid

class Employee(Base, TimestampMixin):
    __tablename__ = "02_workers_karigars"


    id = Column(String(64), primary_key=True, default=lambda: f"emp-{uuid.uuid4().hex[:12]}")
    name = Column(String(255), nullable=False, index=True)
    role = Column(String(128), nullable=False, default="Karigar") # Head Karigar, Operator, Master, Helper
    phone = Column(String(32), nullable=True)
    monthly_salary = Column(Float, nullable=False, default=0.0)
    current_advance = Column(Float, nullable=False, default=0.0)
    status = Column(String(32), nullable=False, default="Active")
