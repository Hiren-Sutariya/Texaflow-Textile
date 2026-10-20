from sqlalchemy import Column, String, Float, Text
from app.core.database import Base
from app.models.base import TimestampMixin

class Employee(Base, TimestampMixin):
    __tablename__ = "02_workers"

    id = Column(String(64), primary_key=True)
    code = Column(String(64), nullable=True, index=True) # Khata No e.g. KAR-001, STF-002
    name = Column(String(255), nullable=False, index=True)
    role = Column(String(128), nullable=True, default="Karigar")
    employee_type = Column(String(64), nullable=False, default="Karigar") # Karigar / Salaried Staff
    mobile = Column(String(32), nullable=True)
    email = Column(String(128), nullable=True)
    assigned_machine = Column(String(128), nullable=True) # e.g. Machine 1, Machine 5
    shift = Column(String(64), nullable=False, default="Day Shift")
    monthly_salary = Column(Float, nullable=False, default=0.0)
    advance_balance = Column(Float, nullable=False, default=0.0)
    status = Column(String(32), nullable=False, default="Active") # Active / Inactive
    photo_url = Column(Text, nullable=True)
    helpers = Column(Text, nullable=True) # JSON list of helpers [{id, name, mobile}]
    bank_details = Column(Text, nullable=True) # JSON bank details
    portal_credentials = Column(Text, nullable=True) # JSON login creds
    documents = Column(Text, nullable=True) # JSON list of documents
    company_id = Column(String(64), nullable=False, default="comp-001", index=True)

