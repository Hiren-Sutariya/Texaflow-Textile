from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse
from app.core.tenant import get_tenant_company_id

router = APIRouter(prefix="/categories", tags=["Categories"])

DEFAULT_CATEGORIES_TEMPLATE = [
    # Materials
    {"name": "Raw Material & Fabric", "module": "material", "color": "blue"},
    {"name": "Yarn & Threads", "module": "material", "color": "purple"},
    {"name": "Zari & Metallic", "module": "material", "color": "amber"},
    {"name": "Lace & Borders", "module": "material", "color": "emerald"},
    {"name": "Chemicals & Dyes", "module": "material", "color": "cyan"},
    # Expenses
    {"name": "Karigar Salary", "module": "expense", "color": "emerald"},
    {"name": "Electricity & Power", "module": "expense", "color": "amber"},
    {"name": "Worker Advance / Upad", "module": "expense", "color": "cyan"},
    {"name": "Machine Maintenance & Repairs", "module": "expense", "color": "rose"},
    {"name": "Packaging Materials", "module": "expense", "color": "indigo"},
    {"name": "Dhaga & Consumables", "module": "expense", "color": "violet"},
    {"name": "Logistics & Courier", "module": "expense", "color": "blue"},
    # Designs
    {"name": "Saree", "module": "design", "color": "purple"},
    {"name": "Choli & Blouse", "module": "design", "color": "pink"},
    {"name": "Kurti & Suit", "module": "design", "color": "indigo"},
    {"name": "Dupatta", "module": "design", "color": "teal"},
    {"name": "Lehenga", "module": "design", "color": "amber"},
]

def seed_default_categories_for_tenant(db: Session, company_id: str):
    existing_names = {
        (c[0], c[1].strip().lower())
        for c in db.query(Category.module, Category.name).filter(Category.company_id == company_id).all()
    }
    new_cats = []
    suffix = company_id.replace("comp-", "") if "comp-" in company_id else company_id[:6]
    for item in DEFAULT_CATEGORIES_TEMPLATE:
        if (item["module"], item["name"].strip().lower()) in existing_names:
            continue
        mod_prefix = item["module"][:3]
        uid = f"cat-{mod_prefix}-{suffix}-{uuid.uuid4().hex[:6]}"
        new_cats.append(Category(
            id=uid,
            company_id=company_id,
            name=item["name"],
            module=item["module"],
            color=item["color"],
            is_system=True
        ))
    if new_cats:
        db.add_all(new_cats)
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
        id=f"cat-{cat_in.module[:3]}-{uuid.uuid4().hex[:8]}",
        company_id=active_cid,
        name=clean_name,
        module=cat_in.module,
        color=cat_in.color or "blue",
        is_system=cat_in.is_system or False,
        is_deleted=False
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

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
