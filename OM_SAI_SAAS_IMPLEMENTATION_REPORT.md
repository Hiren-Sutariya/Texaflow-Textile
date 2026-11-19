# Om Sai ERP — SaaS Super Admin & Centralized Access Control Implementation Report

## 1. Overview of Completed Work

This report details the implementation of the centralized SaaS Super Admin platform, fixed 5-role authorization matrix, multi-level permission engine, and audited diagnostic support workflow for **Om Sai ERP**.

All modifications were engineered non-destructively: existing manufacturing calculations, invoice numbering schemes, Karigar wage ledgers, and database records remain intact.

---

## 2. Backend Implementation Details

### A. Permission Engine Service (`backend/app/services/permission_engine.py`)
A centralized permission evaluation engine was developed to enforce access control across all API routes:
- `get_company_module_settings(db, company_id)`: Fetches active modules for a tenant, resolving subscription plan restrictions and explicit company overrides.
- `get_role_permissions(db, company_id, role, module_key)`: Resolves company-specific role action permissions with fallback to platform defaults (`company_id='*'`). Enforces deny-by-default if undefined.
- `require_permission(db, company_id, role, module_key, action)`: Validates that the role is permitted to perform the specified action (`view`, `create`, `edit`, `delete`, `export`, `approve`, `print`).
- `filter_response_fields(db, company_id, role, model_name, data)`: Strips `hidden` fields from outbound API JSON dictionaries or model objects before serialization.
- `validate_mutation_fields(db, company_id, role, model_name, payload_dict)`: Inspects incoming mutation dictionaries. If an incoming payload attempts to mutate a field marked `read_only` or `hidden`, the mutation is blocked with `403 Forbidden`.

### B. Tenant Context Dependency (`backend/app/core/tenant.py`)
The dependency `get_tenant_context` was upgraded to enforce SaaS platform rules:
1. **JWT Verification**: Validates issuer, signature, and expiration.
2. **Cross-Tenant Validation**: Confirms that any `X-Company-Id` header supplied by the client matches `token_company_id`. Mismatches raise `403 Forbidden`.
3. **Suspended Account Enforcement**: If the company has status `suspended`, all requests are rejected with `403 Forbidden`.
4. **Subscription Expiration Guard**: If the company subscription has expired past its grace period, state-modifying requests (`POST`, `PUT`, `DELETE`, `PATCH`) are blocked with `402 Payment Required`, while read-only operations (`GET`, `HEAD`) remain accessible.

### C. Platform Super Admin API (`backend/app/api/v1/platform.py`)
Over 15 dedicated administrative endpoints were created:
- `GET /platform/overview`: Computes platform-wide KPIs: active enterprises, trial enterprises, suspended enterprises, user counts, Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), and upcoming renewal schedules.
- `GET /platform/companies` & `PUT /platform/companies/{id}/status`: Provides full lifecycle control over enterprises (`active`, `suspended`, `trial`, `expired`).
- `GET /platform/users`, `POST /platform/users`, `PUT /platform/users/{id}`, `POST /platform/users/{id}/reset-password`: Centralized cross-tenant user provisioning enforcing the 5 fixed roles (`OWNER`, `ADMIN`, `ACCOUNTANT`, `MANAGER`, `EMPLOYEE`).
- `GET /platform/permissions/matrix` & `PUT /platform/permissions/matrix`: Global or per-tenant configuration of the Level 2/3 Action Permission matrix.
- `GET /platform/permissions/fields` & `PUT /platform/permissions/fields`: Configuration of Level 4 field visibility (`visible`, `hidden`, `read_only`).
- `POST /platform/support/create-session`, `GET /platform/support/active-sessions`, `POST /platform/support/revoke-session`: Cryptographically signed diagnostic support sessions with mandatory justification strings.
- `GET /platform/audit-logs`: Immutable platform security audit trail.

---

## 3. Frontend Portal Implementation Details (`frontend/app/platform/*`)

A responsive SaaS administration control center was built matching the Om Sai ERP design system:

1. **Platform Shell (`layout.tsx`)**:
   - Modern indigo/slate UI distinct from standard company ERP views.
   - 11-item sidebar navigation with active path highlighting and status badges.
   - SuperAdmin authentication guard redirecting unauthorized users.
2. **Dashboard Overview (`page.tsx`)**:
   - Live KPI cards: Total Enterprises, Active MRR, Active Users, System Health.
   - Subscription health charts and upcoming renewal schedules.
3. **Company Management (`companies/page.tsx`)**:
   - Enterprise data table with search, tier filters, and status toggles.
   - Modal for updating enterprise billing and company contact metadata.
4. **User Governance (`users/page.tsx`)**:
   - Cross-enterprise user registry.
   - User creation modal enforcing the 5 fixed predefined roles.
   - Secure password reset modal with generated temporary credentials.
5. **Centralized Permission Matrix (`permissions/page.tsx`)**:
   - Interactive matrix table with toggles for all 16 modules across the 5 predefined roles.
   - Level 4 Field-Level Security editor configuring field visibility and mutability per role.
6. **Module Activation Grid (`modules/page.tsx`)**:
   - Enterprise module switcher enabling or disabling ERP modules per enterprise.
7. **Subscription & Billing Management (`subscriptions/page.tsx` & `billing/page.tsx`)**:
   - Subscription lifecycle editor (extend trials, switch tiers, manage grace periods).
   - Revenue ledger recording transaction receipts and idempotency verification.
8. **Audited Support Session Center (`support/page.tsx`)**:
   - Diagnostic session generator requiring explicit operational justification.
   - Real-time active sessions table with one-click instant revocation.
   - Support portal launch initializing diagnostic mode with a high-visibility warning banner.
9. **Navbar Diagnostic Banner (`frontend/components/layout/Navbar.tsx`)**:
   - Renders a prominent amber diagnostic banner (`🚨 DIAGNOSTIC SUPPORT MODE — Session active for target company`) whenever an impersonation session token is in use.

---

## 4. Database Migrations & Verification

All database updates were applied using safe, non-destructive migrations:
- **`09_sales_invoices`**: Added columns `profit_margin` (NUMERIC), `paid_amount` (NUMERIC), and `outstanding_amount` (NUMERIC).
- **`00_saas_company_modules`**: Initialized table for per-tenant module activation overrides.
- **`00_saas_role_permissions`**: Initialized table with platform default templates seeded for all 5 roles across all 16 modules.
- **`00_saas_field_permissions`**: Initialized table with field-level security templates for `sales_invoice`, `purchase`, `expense`, and `party`.
- **`00_saas_support_sessions`**: Initialized table with `session_token` typed as `TEXT` for JWT tokens.
- **`00_saas_invoices`**: Initialized platform billing and transaction ledger.
- **Company Seeds**: Initialized and verified both `comp-001` (Shiv Creation) and `comp-002` (Om Sai Enterprise – OSE House) as active enterprises.
