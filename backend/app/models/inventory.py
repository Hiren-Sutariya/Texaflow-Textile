from sqlalchemy import Column, String, Float
from app.core.database import Base
from app.models.base import TimestampMixin
import uuid

class InventoryStock(Base, TimestampMixin):
    __tablename__ = "inventory_stock"

    id = Column(String(64), primary_key=True, default=lambda: f"stk-{uuid.uuid4().hex[:12]}")
    item_name = Column(String(255), nullable=False, index=True)
    category = Column(String(128), nullable=False, index=True) # Dhaga, Needles, Fabric, Chemical, Packing
    quantity = Column(Float, nullable=False, default=0.0)
    unit = Column(String(32), nullable=False, default="Cones") # Cones, Boxes, Meters, Kgs, Rolls
    min_stock_level = Column(Float, nullable=False, default=10.0)
    unit_price = Column(Float, nullable=False, default=0.0)
    supplier_name = Column(String(255), nullable=True)
