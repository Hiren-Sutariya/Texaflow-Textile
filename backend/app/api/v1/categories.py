from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(
    module: Optional[str] = Query(None, description="Filter by module: material, expense, design"),
    company_id: str = "comp-001",
    db: Session = Depends(get_db)
):
    """Retrieve all categories, optionally filtered by module."""
    query = db.query(Category).filter(Category.company_id == company_id)
    if module and module != "all":
        query = query.filter(Category.module == module)
    return query.order_by(Category.name.asc()).all()

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    company_id: str = "comp-001",
    db: Session = Depends(get_db)
):
    """Create a new category in 06_categories table."""
    existing = db.query(Category).filter(
        Category.company_id == company_id,
        Category.name.ilike(cat_in.name.strip()),
        Category.module == cat_in.module
    ).first()
    if existing:
        return existing

    new_cat = Category(
        id=f"cat-{uuid.uuid4().hex[:8]}",
        company_id=company_id,
        name=cat_in.name.strip(),
        module=cat_in.module,
        color=cat_in.color,
        is_system=cat_in.is_system or False
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
def delete_category(
    category_id: str,
    company_id: str = "comp-001",
    db: Session = Depends(get_db)
):
    """Delete a category by ID."""
    cat = db.query(Category).filter(Category.id == category_id, Category.company_id == company_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"success": True, "message": f"Category {category_id} deleted successfully"}
