"""
Formatters and ID Generators for Om Sai Textile ERP
Provides clean, short IDs and standardized DD-MM-YYYY dates.
"""
from typing import Optional
from sqlalchemy.orm import Session

def format_to_dd_mm_yyyy(date_str: Optional[str]) -> Optional[str]:
    """
    Standardizes date string to DD-MM-YYYY format for database storage.
    Handles:
      - YYYY-MM-DD -> DD-MM-YYYY
      - DD-MM-YYYY -> DD-MM-YYYY
      - YYYY/MM/DD -> DD-MM-YYYY
      - DD/MM/YYYY -> DD-MM-YYYY
    """
    if not date_str or not isinstance(date_str, str):
        return date_str
    
    clean = date_str.strip()
    if not clean:
        return clean

    # Dash separator
    parts = clean.split("-")
    if len(parts) == 3:
        if len(parts[0]) == 4:  # YYYY-MM-DD
            return f"{parts[2].zfill(2)}-{parts[1].zfill(2)}-{parts[0]}"
        elif len(parts[2]) == 4:  # DD-MM-YYYY
            return f"{parts[0].zfill(2)}-{parts[1].zfill(2)}-{parts[2]}"

    # Slash separator
    parts_slash = clean.split("/")
    if len(parts_slash) == 3:
        if len(parts_slash[0]) == 4:  # YYYY/MM/DD
            return f"{parts_slash[2].zfill(2)}-{parts_slash[1].zfill(2)}-{parts_slash[0]}"
        elif len(parts_slash[2]) == 4:  # DD/MM/YYYY
            return f"{parts_slash[0].zfill(2)}-{parts_slash[1].zfill(2)}-{parts_slash[2]}"

    return clean

def generate_short_id(db: Session, model, prefix: str) -> str:
    """
    Generates short, sequential, human-friendly ID like exp-1, pay-1, job-1.
    Finds the maximum integer suffix currently in the table for this prefix.
    """
    records = db.query(model.id).filter(model.id.like(f"{prefix}-%")).all()
    max_num = 0
    for (r_id,) in records:
        if r_id and r_id.startswith(f"{prefix}-"):
            suffix = r_id[len(prefix) + 1:]
            if suffix.isdigit():
                num = int(suffix)
                if num > max_num:
                    max_num = num
    
    # If no sequential IDs found, check total count of records as starting point
    if max_num == 0:
        total_count = db.query(model).count()
        return f"{prefix}-{total_count + 1}"
    
    return f"{prefix}-{max_num + 1}"
