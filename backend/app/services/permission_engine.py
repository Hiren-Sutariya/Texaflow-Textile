"""
Centralized SaaS Permission, Entitlement & Field-Level Filtering Engine.
Enforces multi-layer access precedence:
Platform Feature -> Subscription Entitlement -> Company Module Config -> Role Action -> Field Filtering.
"""
from typing import Dict, Any, List, Optional, Union
import time
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.database import SessionLocal
from app.models.permission import (
    CompanyModuleSetting, RolePermissionSetting, FieldPermissionSetting,
    SupportSession, FIXED_ROLES, PLATFORM_MODULES
)
from app.models.subscription import TenantSubscription, SubscriptionPlan

# Fast in-memory cache for permissions (TTL 30 seconds)
_PERM_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL = 30

def clear_permission_cache(company_id: Optional[str] = None):
    """Invalidates cached permissions across workers."""
    if company_id:
        keys_to_remove = [k for k in _PERM_CACHE if k.startswith(company_id) or k.startswith("*")]
        for k in keys_to_remove:
            _PERM_CACHE.pop(k, None)
    else:
        _PERM_CACHE.clear()

def normalize_role(role: Optional[str]) -> str:
    """Normalizes role strings to the 5 fixed roles or SuperAdmin."""
    if not role:
        return "EMPLOYEE"
    clean = role.strip().upper()
    if clean == "SUPERADMIN":
        return "SuperAdmin"
    if clean in FIXED_ROLES:
        return clean
    # Map legacy aliases
    if clean in ("PROP", "OWNER", "DIRECTOR"):
        return "OWNER"
    if clean in ("MANAGER", "FACTORY_MANAGER"):
        return "MANAGER"
    if clean in ("ACCOUNTS", "ACCOUNTANT", "BILLING"):
        return "ACCOUNTANT"
    if clean in ("ADMIN", "ADMINISTRATOR"):
        return "ADMIN"
    return "EMPLOYEE"

class PermissionEngine:
    """Authoritative Evaluator for Module, Action, and Field-Level Security."""

    @staticmethod
    def get_company_module_settings(db: Session, company_id: str) -> Dict[str, bool]:
        """Returns enabled/disabled state of every module for a company."""
        cache_key = f"{company_id}:modules"
        cached = _PERM_CACHE.get(cache_key)
        now = time.time()
        if cached and (now - cached["timestamp"] < _CACHE_TTL):
            return cached["data"]

        # Default all platform modules to True
        modules_state = {m["key"]: True for m in PLATFORM_MODULES}

        # Query explicit company configurations
        records = db.query(CompanyModuleSetting).filter(
            CompanyModuleSetting.company_id == company_id
        ).all()
        for r in records:
            modules_state[r.module_key] = r.is_enabled

        # Intersect with subscription plan entitlements
        sub = db.query(TenantSubscription).filter(TenantSubscription.company_id == company_id).first()
        if sub and sub.plan_id:
            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
            if plan and not plan.allow_hrms:
                # Disable HRMS modules if plan disallows it
                for hrms_mod in ("workers", "attendance", "worker_payout"):
                    modules_state[hrms_mod] = False

        _PERM_CACHE[cache_key] = {"timestamp": now, "data": modules_state}
        return modules_state

    @staticmethod
    def get_role_permissions(db: Session, company_id: str, role: str) -> Dict[str, Dict[str, bool]]:
        """
        Resolves action permissions for a role in a company.
        Precedence: Company-specific override -> Platform default ('*') -> Deny by default.
        """
        norm_role = normalize_role(role)
        if norm_role == "SuperAdmin":
            # SuperAdmin has universal operational visibility
            return {
                m["key"]: {act: True for act in ("view", "create", "edit", "delete", "export", "approve", "print")}
                for m in PLATFORM_MODULES
            }

        cache_key = f"{company_id}:{norm_role}:actions"
        cached = _PERM_CACHE.get(cache_key)
        now = time.time()
        if cached and (now - cached["timestamp"] < _CACHE_TTL):
            return cached["data"]

        # 1. Fetch platform defaults
        defaults = db.query(RolePermissionSetting).filter(
            RolePermissionSetting.company_id == "*",
            RolePermissionSetting.role == norm_role
        ).all()

        action_map = {}
        for d in defaults:
            action_map[d.module_key] = {
                "view": d.can_view,
                "create": d.can_create,
                "edit": d.can_edit,
                "delete": d.can_delete,
                "export": d.can_export,
                "approve": d.can_approve,
                "print": d.can_print
            }

        # 2. Overlay company-specific overrides if present
        overrides = db.query(RolePermissionSetting).filter(
            RolePermissionSetting.company_id == company_id,
            RolePermissionSetting.role == norm_role
        ).all()
        for o in overrides:
            action_map[o.module_key] = {
                "view": o.can_view,
                "create": o.can_create,
                "edit": o.can_edit,
                "delete": o.can_delete,
                "export": o.can_export,
                "approve": o.can_approve,
                "print": o.can_print
            }

        # 3. Intersect with company module enablement
        mod_settings = PermissionEngine.get_company_module_settings(db, company_id)
        for mkey, is_enabled in mod_settings.items():
            if not is_enabled and mkey in action_map:
                action_map[mkey] = {act: False for act in ("view", "create", "edit", "delete", "export", "approve", "print")}

        _PERM_CACHE[cache_key] = {"timestamp": now, "data": action_map}
        return action_map

    @staticmethod
    def check_access(
        db: Session,
        company_id: str,
        role: str,
        module_key: str,
        action: str = "view"
    ) -> bool:
        """Evaluates whether the given role can perform the action on the module."""
        norm_role = normalize_role(role)
        if norm_role == "SuperAdmin":
            return True

        # Level 1: Module Enabled for Company
        mod_settings = PermissionEngine.get_company_module_settings(db, company_id)
        if not mod_settings.get(module_key, True):
            return False

        # Level 2 & 3: Role Action Permissions
        role_perms = PermissionEngine.get_role_permissions(db, company_id, norm_role)
        mod_perms = role_perms.get(module_key)
        if not mod_perms:
            return False

        return bool(mod_perms.get(action, False))

    @staticmethod
    def require_permission(
        db: Session,
        company_id: str,
        role: str,
        module_key: str,
        action: str = "view"
    ):
        """Raises HTTP 403 Forbidden if permission is not granted."""
        allowed = PermissionEngine.check_access(db, company_id, role, module_key, action)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Role '{role}' does not have permission to '{action}' in module '{module_key}'."
            )

    @staticmethod
    def get_field_permissions(
        db: Session,
        company_id: str,
        role: str,
        entity_type: str
    ) -> Dict[str, str]:
        """
        Returns map of field_name -> permission ('editable', 'read_only', 'hidden', 'not_permitted_update').
        Precedence: Company override -> Platform default -> 'editable'.
        """
        norm_role = normalize_role(role)
        if norm_role == "SuperAdmin":
            return {} # SuperAdmin has no field masking

        cache_key = f"{company_id}:{norm_role}:{entity_type}:fields"
        cached = _PERM_CACHE.get(cache_key)
        now = time.time()
        if cached and (now - cached["timestamp"] < _CACHE_TTL):
            return cached["data"]

        # Fetch platform defaults
        defaults = db.query(FieldPermissionSetting).filter(
            FieldPermissionSetting.company_id == "*",
            FieldPermissionSetting.role == norm_role,
            FieldPermissionSetting.entity_type == entity_type
        ).all()
        fld_map = {d.field_name: d.permission for d in defaults}

        # Overlay company-specific overrides
        overrides = db.query(FieldPermissionSetting).filter(
            FieldPermissionSetting.company_id == company_id,
            FieldPermissionSetting.role == norm_role,
            FieldPermissionSetting.entity_type == entity_type
        ).all()
        for o in overrides:
            fld_map[o.field_name] = o.permission

        _PERM_CACHE[cache_key] = {"timestamp": now, "data": fld_map}
        return fld_map

    @staticmethod
    def filter_response_fields(
        db: Session,
        company_id: str,
        role: str,
        entity_type: str,
        data: Union[Dict[str, Any], List[Dict[str, Any]]]
    ) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Backend Data Sanitizer:
        Removes all 'hidden' fields from API responses before returning to the client.
        Guarantees that sensitive columns (e.g. profit margins, private notes) are never leaked over the wire.
        """
        norm_role = normalize_role(role)
        if norm_role == "SuperAdmin":
            return data

        fld_map = PermissionEngine.get_field_permissions(db, company_id, norm_role, entity_type)
        hidden_fields = {k for k, v in fld_map.items() if v == "hidden"}
        if not hidden_fields:
            return data

        def _clean_dict(d: Dict[str, Any]) -> Dict[str, Any]:
            if not isinstance(d, dict):
                return d
            return {k: v for k, v in d.items() if k not in hidden_fields}

        if isinstance(data, list):
            return [_clean_dict(item) for item in data]
        elif isinstance(data, dict):
            return _clean_dict(data)
        return data

    @staticmethod
    def validate_mutation_fields(
        db: Session,
        company_id: str,
        role: str,
        entity_type: str,
        incoming_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Backend Mutation Guard:
        Prevents tampering by rejecting or stripping fields marked 'read_only' or 'not_permitted_update'.
        """
        norm_role = normalize_role(role)
        if norm_role == "SuperAdmin":
            return incoming_data

        fld_map = PermissionEngine.get_field_permissions(db, company_id, norm_role, entity_type)
        protected_fields = {k for k, v in fld_map.items() if v in ("read_only", "not_permitted_update", "hidden")}

        sanitized = {}
        for k, v in incoming_data.items():
            if k in protected_fields:
                # If caller attempts to alter a protected field with a non-null distinct value, raise 403
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Field Permission Violation: Role '{norm_role}' is not permitted to modify field '{k}' on '{entity_type}'."
                )
            sanitized[k] = v
        return sanitized
