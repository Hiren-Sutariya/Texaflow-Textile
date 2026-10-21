from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.core.tenant import get_tenant_company_id

router = APIRouter(prefix="/categories", tags=["Categories"])

DEFAULT_CATEGORIES_TEMPLATE = [
    # Expenses (Only expense categories seeded by default)
    {"name": "Karigar Salary", "module": "expense"},
    {"name": "Electricity & Power", "module": "expense"},
    {"name": "Worker Advance / Upad", "module": "expense"},
    {"name": "Machine Maintenance & Repairs", "module": "expense"},
    {"name": "Packaging Materials", "module": "expense"},
    {"name": "Dhaga & Consumables", "module": "expense"},
    {"name": "Logistics & Courier", "module": "expense"},
]

def generate_short_category_id(db: Session, module: str) -> str:
    """Generate a clean, short unique category ID like cat-des-1, cat-mat-1, cat-exp-1."""
    mod_prefix = module[:3].lower()
    existing_records = db.query(Category.id).filter(
        Category.id.like(f"cat-{mod_prefix}-%")
    ).all()
    existing_ids = {r[0] for r in existing_records}
    
    num = 1
    while f"cat-{mod_prefix}-{num}" in existing_ids:
        num += 1
    return f"cat-{mod_prefix}-{num}"

def seed_default_categories_for_tenant(db: Session, company_id: str):
    existing_names = {
        (c[0], c[1].strip().lower())
        for c in db.query(Category.module, Category.name).filter(Category.company_id == company_id).all()
    }
    new_cats = []
    for item in DEFAULT_CATEGORIES_TEMPLATE:
        if (item["module"], item["name"].strip().lower()) in existing_names:
            continue
        uid = generate_short_category_id(db, item["module"])
        # Add to tracking so subsequent items in the same batch get incremented IDs
        new_cat = Category(
            id=uid,
            company_id=company_id,
            name=item["name"],
            module=item["module"],
            is_system=True
        )
        new_cats.append(new_cat)
        db.add(new_cat)
        db.flush()
    if new_cats:
        db.commit()

@router.get("", response_model=List[CategoryResponse])
def get_categories(
    module: Optional[str] = Query(None, description="Filter by module: material, expense, design"),
    company_id: Optional[str] = Query(None, description="Optional Company ID override"),
    tenant_cid: str = Depends(get_tenant_company_id),
    db: Session = Depends(get_db)
):
    """Retrieve all categories strictly isolated by company_id."""
    active_cid = company_id.strip() if company_id and company_id.strip() else tenant_cid

    # If the company has NO categories in table yet, seed clean defaults
    cat_count = db.query(Category).filter(Category.company_id == active_cid).count()
    if cat_count == 0:
        seed_default_categories_for_tenant(db, active_cid)

    query = db.query(Category).filter(Category.company_id == active_cid, Category.is_deleted == False)
    if module and module != "all":
        query = query.filter(Category.module == module)
    results = query.order_by(Category.created_at.asc(), Category.id.asc()).all()

    # Guarantee uniqueness by (module, lowercase name)
    seen = set()
    unique_res = []
    for r in results:
        key = (r.module, r.name.strip().lower())
        if key not in seen:
            seen.add(key)
            unique_res.append(r)
    return unique_res

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    company_id: Optional[str] = Query(None),
    tenant_cid: str = Depends(get_tenant_company_id),
    db: Session = Depends(get_db)
):
    """Create a new category in 06_categories table strictly for the active tenant."""
    active_cid = company_id.strip() if company_id and company_id.strip() else tenant_cid
    clean_name = cat_in.name.strip()

    existing = db.query(Category).filter(
        Category.company_id == active_cid,
        Category.name.ilike(clean_name),
        Category.module == cat_in.module
    ).first()
    if existing:
        if existing.is_deleted:
            existing.is_deleted = False
            existing.deleted_at = None
            existing.deleted_by = None
            db.commit()
            db.refresh(existing)
        return existing

    new_cat = Category(
        id=generate_short_category_id(db, cat_in.module),
        company_id=active_cid,
        name=clean_name,
        module=cat_in.module,
        is_system=cat_in.is_system or False,
        is_deleted=False
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: str,
    cat_in: CategoryUpdate,
    company_id: Optional[str] = Query(None),
    tenant_cid: str = Depends(get_tenant_company_id),
    db: Session = Depends(get_db)
):
    """Update category in-place so its position, ID, and created_at never change."""
    active_cid = company_id.strip() if company_id and company_id.strip() else tenant_cid
    clean_target = category_id.strip()

    cat = db.query(Category).filter(
        (Category.id == clean_target) | (Category.name.ilike(clean_target)),
        Category.company_id == active_cid,
        Category.is_deleted == False
    ).first()

    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    if cat_in.name is not None:
        new_name = cat_in.name.strip()
        duplicate = db.query(Category).filter(
            Category.id != cat.id,
            Category.company_id == active_cid,
            Category.module == (cat_in.module or cat.module),
            Category.name.ilike(new_name),
            Category.is_deleted == False
        ).first()
        if duplicate:
            raise HTTPException(status_code=400, detail=f"Category '{new_name}' already exists in this module")
        cat.name = new_name

    if cat_in.module is not None:
        cat.module = cat_in.module

    from datetime import datetime
    cat.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
def delete_category(
    category_id: str,
    company_id: Optional[str] = Query(None),
    tenant_cid: str = Depends(get_tenant_company_id),
    db: Session = Depends(get_db)
):
    """Soft delete a category by moving it to Recycle Bin."""
    active_cid = company_id.strip() if company_id and company_id.strip() else tenant_cid
    clean_target = category_id.strip()

    cat = db.query(Category).filter(
        (Category.id == clean_target) | (Category.name.ilike(clean_target)),
        Category.company_id == active_cid,
        Category.is_deleted == False
    ).first()

    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    from datetime import datetime
    cat.is_deleted = True
    cat.deleted_at = datetime.utcnow()
    cat.deleted_by = "Admin"
    db.commit()
    return {"success": True, "message": f"Category '{clean_target}' moved to Recycle Bin"}
