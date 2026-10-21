from sqlalchemy import Column, String, Boolean
from app.core.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin
import uuid

class Category(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "06_categories"

    id = Column(String(50), primary_key=True, default=lambda: f"cat-{uuid.uuid4().hex[:12]}")
    company_id = Column(String(50), nullable=False, default="comp-001", index=True)
    name = Column(String(100), nullable=False, index=True)
    module = Column(String(50), nullable=False, index=True) # material, expense, design
    color = Column(String(50), nullable=True)
    is_system = Column(Boolean, default=False)
