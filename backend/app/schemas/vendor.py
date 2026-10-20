"""Legacy alias for Party schemas."""
from app.schemas.party import (
    PartyBase as VendorBase,
    PartyCreate as VendorCreate,
    PartyUpdate as VendorUpdate,
    PartyResponse as VendorResponse,
    PartyBase,
    PartyCreate,
    PartyUpdate,
    PartyResponse,
)

__all__ = [
    "VendorBase",
    "VendorCreate",
    "VendorUpdate",
    "VendorResponse",
    "PartyBase",
    "PartyCreate",
    "PartyUpdate",
    "PartyResponse",
]
