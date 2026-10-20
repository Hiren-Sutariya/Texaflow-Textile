from sqlalchemy import Column, String, Text, Boolean, JSON
from app.core.database import Base
from app.models.base import TimestampMixin

class Company(Base, TimestampMixin):
    __tablename__ = "00_settings"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    code = Column(String(64), unique=True, nullable=False, index=True)
    owner_name = Column(String(255), nullable=False)
    phone = Column(String(32), nullable=True)
    alt_phone = Column(String(32), nullable=True)
    email = Column(String(128), nullable=True)
    address = Column(Text, nullable=True)
    city_state = Column(String(128), nullable=True)
    pincode = Column(String(32), nullable=True)
    gstin = Column(String(32), nullable=True)
    pan = Column(String(32), nullable=True)
    brand_name = Column(String(255), nullable=True)
    tagline = Column(Text, nullable=True)
    msme_no = Column(String(64), nullable=True)
    website = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False, default="active")

    # Bank Details
    bank_name = Column(String(128), nullable=True)
    account_holder = Column(String(128), nullable=True)
    account_no = Column(String(64), nullable=True)
    account_type = Column(String(64), nullable=True)
    ifsc = Column(String(32), nullable=True)
    branch_name = Column(String(128), nullable=True)
    upi_id = Column(String(128), nullable=True)
    qr_code_image = Column(Text, nullable=True)

    # Invoicing & Printing Preferences
    invoice_title = Column(String(128), nullable=True)
    challan_title = Column(String(128), nullable=True)
    invoice_prefix = Column(String(64), nullable=True)
    next_invoice_no = Column(String(64), nullable=True)
    challan_prefix = Column(String(64), nullable=True)
    next_challan_no = Column(String(64), nullable=True)
    hsn_sac_code = Column(String(64), nullable=True)
    gst_rate = Column(String(64), nullable=True)
    payment_terms = Column(String(64), nullable=True)
    signatory_label = Column(String(128), nullable=True)
    eway_threshold = Column(String(32), nullable=True)
    print_qr = Column(Boolean, default=True)
    terms_conditions = Column(Text, nullable=True)
    settings_json = Column(JSON, nullable=True)
