# Om Sai ERP — Commercial Multi-Tenant SaaS Architecture Specification

## 1. Executive Summary & Architectural Vision

**Om Sai ERP** has been architected and engineered as a high-performance, commercial, subscription-based multi-tenant SaaS ERP platform tailored for the textile manufacturing industry. It powers both the parent manufacturing enterprise, **Om Sai Enterprise – OSE House**, and external textile manufacturing enterprises across India on a shared cloud infrastructure with complete data isolation, centralized access control, and zero trust in client-side claims.

### Core Architectural Mandates
1. **Centralized Platform Governance**: A dedicated SaaS Super Admin platform (`/platform`) governs tenant lifecycles, plans, subscriptions, global module switches, and field-level permission policies.
2. **Strict Multi-Tenant Isolation**: Complete logical and cryptographic isolation between companies. Om Sai Enterprise (OSE House / `comp-002`) operates under the exact same multi-tenant constraints as external tenants without administrative backdoors.
3. **Fixed 5-Role Predefined Model**: Role names and hierarchies (`OWNER`, `ADMIN`, `ACCOUNTANT`, `MANAGER`, `EMPLOYEE`) are strictly immutable. Company owners cannot create custom roles or modify the core permission matrix.
4. **4-Level Permission & Security Model**:
   - **Level 1 (Module Activation)**: Subscription plan entitlements intersected with company module overrides.
   - **Level 2 & 3 (Role Action Capabilities)**: Centralized CRUD + Export + Approve + Print matrix per role and module.
   - **Level 4 (Field-Level Visibility & Mutability)**: Server-side JSON stripping of hidden fields and 403 rejection of unauthorized field mutations.
5. **Audited Support & Diagnostic Sessions**: Zero visibility into company credentials or passwords. Time-bounded, cryptographically signed impersonation sessions with mandatory justification and instant revocation.

---

## 2. Three-Tier Architectural Topology

```
+-------------------------------------------------------------------------------------------------------+
|                                    1. PLATFORM ADMINISTRATION LAYER                                   |
|                                         Path: /platform/*                                             |
|   - Dashboard & KPI Analytics (MRR, ARR)        - Centralized Multi-Level Permission Matrix           |
|   - Enterprise Tenant Management & Status       - Field-Level Security & Mutability Engine            |
|   - Cross-Tenant User Management (5 Fixed Roles)- Time-Bounded Audited Support Sessions (Banner Mode) |
|   - Subscription Tiers, Plans & Invoices        - Immutable Security & Governance Audit Trail         |
+-------------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+-------------------------------------------------------------------------------------------------------+
|                                     2. TENANT MANAGEMENT LAYER                                        |
|                                      Path: /settings, /company                                        |
|   - Tenant-Specific Branding & Header Profiles  - Financial Year & GSTIN Configurations               |
|   - Bank Accounts & Payment QR Codes            - Document Sequences (Challan / Invoice Auto-Nos)     |
|   - Read-Only Plan Entitlement Status Banner    - Strict Tenant Boundary Enforcement                  |
+-------------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+-------------------------------------------------------------------------------------------------------+
|                                   3. ERP CORE APPLICATION LAYER                                       |
|                                Path: /dashboard, /sales-invoices, ...                                 |
|   - Sales Invoices & Challan Linking            - HRMS, Daily Attendance & Karigar Payouts            |
|   - Purchases, Yarn/Grey Lots & Mill Inward     - General Ledger, Day Book & Cash Flow                |
|   - Parties (Karigar, Weaver, Broker, Customer) - Design Management & Inventory Catalog               |
+-------------------------------------------------------------------------------------------------------+
```

---

## 3. Route Structure & Partitioning

| Route Segment | Target Audience | Access Guard / Policy | Description |
|---|---|---|---|
| `/platform/dashboard` | Super Admin | `role == "SuperAdmin"` | Real-time platform KPI dashboard, active enterprises, MRR, ARR, renewals |
| `/platform/companies` | Super Admin | `require_super_admin` | Global enterprise registry, status toggle (`active`, `suspended`, `trial`), profile overrides |
| `/platform/users` | Super Admin | `require_super_admin` | Cross-tenant user provisioning, 5 fixed roles assignment, secure password resets |
| `/platform/permissions` | Super Admin | `require_super_admin` | Matrix for Level 2/3 Action Permissions & Level 4 Field-Level Security rules |
| `/platform/modules` | Super Admin | `require_super_admin` | Visual module activation/deactivation toggles per enterprise |
| `/platform/subscriptions` | Super Admin | `require_super_admin` | Subscription lifecycle table, trial extension, plan assignments |
| `/platform/billing` | Super Admin | `require_super_admin` | Invoices, payment receipts, idempotency verification, financial logs |
| `/platform/plans` | Super Admin | `require_super_admin` | Plan tiers configuration (Starter, Professional, Enterprise) and limits |
| `/platform/support` | Super Admin | `require_super_admin` | Audited diagnostic session generation with mandatory reason & active banner |
| `/platform/audit-logs` | Super Admin | `require_super_admin` | Searchable, immutable event trail recording all administrative actions |
| `/platform/settings` | Super Admin | `require_super_admin` | Cryptographic session policies, grace periods, webhook signature secrets |
| `/dashboard` | Tenant Users | `get_tenant_context` | Company ERP operations dashboard reflecting enabled tenant modules |
| `/sales-invoices` | Tenant Users | `require_permission("sales_invoices", "view")` | Sales invoices with field-level response filtering and mutation checks |
| `/purchases` | Tenant Users | `require_permission("purchases", "view")` | Material inward, yarn bills, and supplier ledger entries |
| `/parties` | Tenant Users | `require_permission("parties", "view")` | Party directory with credit limits and GST details |
| `/workers` | Tenant Users | `require_permission("workers", "view")` | Karigar and staff roster with piece-rate / fixed salary contracts |

---

## 4. Multi-Level Centralized Permission Architecture

Access control follows a strict **precedence hierarchy** where every check must pass; failure at any tier triggers an immediate denial (`403 Forbidden` or `402 Payment Required`):

```
┌─────────────────────────────────────────────────────────┐
│ Level 1: Platform Feature & Subscription Entitlement   │
│ (Plan allows module? Company enabled module?)           │
└──────────────────────────┬──────────────────────────────┘
                           │ Passed
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Level 2 & 3: Role Action Permission                     │
│ (Can role perform action: view/create/edit/delete/etc?) │
└──────────────────────────┬──────────────────────────────┘
                           │ Passed
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Level 4: Field-Level Visibility & Mutability            │
│ (Read: Filter JSON fields? Write: Block tamper fields?) │
└─────────────────────────────────────────────────────────┘
```

### The 5 Fixed Predefined Company Roles
1. **OWNER**: Full administrative and operational command within the tenant boundary. Unrestricted access to commercial margins, financials, and company settings. Cannot modify platform permissions or create custom roles.
2. **ADMIN**: Operational supervisor managing staff, inventory, master catalogues, and daily workflows.
3. **ACCOUNTANT**: Dedicated financial operator managing billing, vouchers, ledgers, and day books. Profit margins and sensitive operational notes can be dynamically hidden by Super Admin.
4. **MANAGER**: Floor and dispatch coordinator handling production, challans, gate passes, and inventory movements without visibility into raw supplier margins or bank credentials.
5. **EMPLOYEE**: Field operator handling basic data entry (e.g. daily attendance recording, piece-rate tallying) under strict read-only/append constraints.

---

## 5. Database Schema & Data Isolation Architecture

All persistent records reside in PostgreSQL under isolated schema partitions with `company_id` foreign keys indexed across every business table.

### SaaS Governance Tables
- `00_saas_plans`: Subscription tiers, pricing, and allowed module arrays.
- `00_saas_subscriptions`: Tenant subscription state (`trial`, `active`, `past_due`, `canceled`), cycle dates, and grace periods.
- `00_saas_company_modules`: Per-company module activation/deactivation overrides (`is_enabled`).
- `00_saas_role_permissions`: Granular CRUD, export, approve, and print toggles per role (`company_id='*'` for platform defaults).
- `00_saas_field_permissions`: Field-level rules (`visible`, `hidden`, `read_only`) per model and role.
- `00_saas_support_sessions`: Time-bounded, cryptographically signed impersonation records with mandatory audit justification.
- `00_saas_audit_logs`: Immutable security audit stream recording actor, action, tenant, IP, and timestamp.
- `00_saas_invoices`: Platform billing statements and payment transaction receipts with idempotency keys.

### Tenant Business Tables
All 18 core ERP entities (`00_auth_users`, `00_company_settings`, `01_parties`, `02_workers`, `03_attendance`, `04_purchases`, `05_expenses`, `06_payments`, `07_yarn_stock`, `08_sales_challans`, `09_sales_invoices`, `10_designs`, `11_day_book`, `12_salary_slips`, etc.) enforce:
1. `company_id = Column(String(64), nullable=False, index=True)`
2. Direct backend dependency validation via `TenantContext`.
3. Client-supplied `company_id` values in request headers or payloads are strictly cross-checked against the cryptographically verified JWT payload. Mismatches trigger immediate `403 Forbidden` exceptions.
