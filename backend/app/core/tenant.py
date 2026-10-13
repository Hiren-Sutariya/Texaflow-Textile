"""
Multi-Tenant / Multi-Company Dependency for Texaflow ERP.
Extracts company_id from 'X-Company-Id' HTTP header or defaults to 'comp-001' (Om Sai Enterprises).
"""
from typing import Optional
from fastapi import Header

def get_tenant_company_id(x_company_id: Optional[str] = Header(None)) -> str:
    """
    Extracts the tenant company_id for data isolation.
    Defaults to 'comp-001' if header is not passed.
    """
    if x_company_id and x_company_id.strip():
        return x_company_id.strip()
    return "comp-001"
