# Om Sai ERP — SaaS Security & Centralized Access Control Audit

## 1. Threat Model & Security Posture

As a commercial multi-tenant SaaS application managing mission-critical textile financial data, purchase costs, karigar wages, and customer accounts, **Om Sai ERP** implements a defense-in-depth security architecture.

### Primary Threat Vectors Evaluated:
1. **Cross-Tenant Data Leakage (BOLA / IDOR)**: Malicious tenants manipulating IDs to access competitor designs, rates, or customer lists.
2. **Privilege Escalation**: Company owners attempting to elevate roles, edit platform permissions, or access Super Admin APIs.
3. **Sensitive Field Disclosure**: Accountants or managers inspecting API responses in browser developer tools to view raw manufacturing profit margins.
4. **Direct API Mutation Tampering**: Attackers sending unauthorized JSON payloads to mutate read-only or hidden fields.
5. **Support Session Abuse / Impersonation Risks**: Unaudited access or perpetual administrative session tokens without time limits.
6. **Payment Webhook Replay**: Duplicate payment event payloads attempting to trigger unauthorized subscription extensions.

---

## 2. Security Controls & Mitigations

### A. Tenant Isolation & Zero-Trust Architecture
- **JWT Cryptographic Verification**: Every private API call requires a signed JWT containing `company_id`, `role`, and `user_id`.
- **Zero Trust in Frontend Header Claims**: The client-side header `X-Company-Id` is never trusted in isolation. `get_tenant_context` cross-verifies the header value against the cryptographically decoded JWT payload. Any mismatch immediately aborts the request with `403 Forbidden`.
- **Equal Treatment for OSE House**: The parent company, Om Sai Enterprise (`comp-002`), runs on identical code paths and database constraints as external client companies (`comp-001`). There are zero hardcoded bypasses.

### B. Role-Based Access Control (RBAC) & Anti-Escalation
- **Fixed 5-Role Predefined Model**: Roles are restricted to `OWNER`, `ADMIN`, `ACCOUNTANT`, `MANAGER`, and `EMPLOYEE`.
- **Immutability of Role Matrix by Tenants**: All permission matrix endpoints (`/platform/permissions/*`) require `require_super_admin`. Company Owners attempting to invoke these routes receive `403 Forbidden`.
- **Protection Against Custom Roles**: Custom role inputs are either normalized to predefined fallback roles (`EMPLOYEE`) or explicitly rejected with `400 Bad Request`.

### C. Server-Side Field-Level Security (FLS)
- **Response Stripping**: In `filter_response_fields()`, fields marked `hidden` for a given role are purged from the response JSON on the backend server before network transmission. Client-side DevTools cannot view the raw data.
- **Mutation Validation**: In `validate_mutation_fields()`, any incoming `POST` or `PUT` payload containing keys marked `hidden` or `read_only` for the caller's role is rejected with `403 Forbidden`.

### D. Audited Support Sessions (Impersonation Defense)
- **Password Obfuscation**: Platform administrators never view, decrypt, or reset customer passwords into plaintext.
- **Time-Bounded Tokens**: Support session tokens are generated with strict TTLs (15 to 120 minutes) and recorded in `00_saas_support_sessions`.
- **Mandatory Justification**: Support session creation requires an explicit justification string recorded in the audit trail.
- **Instant Revocation**: Support sessions can be invalidated immediately via `POST /platform/support/revoke-session`.
- **High-Visibility Diagnostic Banner**: The frontend client renders a persistent amber warning banner whenever a support token is in use.

### E. Subscription Expiration & Account Suspension
- **Suspension Enforcement**: Companies marked `status = "suspended"` are completely locked out of the system (`403 Forbidden`).
- **Grace Period Read-Only Enforcement**: Companies with expired subscriptions past their grace period are restricted to read-only mode. All state-changing write mutations (`POST`, `PUT`, `DELETE`) return `402 Payment Required`.

### F. Payment Webhook Idempotency
- All processed payment gateway transaction IDs are recorded with unique database constraints. Duplicate webhook deliveries are detected and safely skipped without double-crediting subscriptions.

---

## 3. Vulnerability Assessment Summary

| Vulnerability Category | OWASP Risk | Pre-Mitigation Status | Implemented Mitigation | Post-Audit Status |
|---|---|---|---|---|
| Broken Object Level Authorization (BOLA) | Critical | High | Cryptographic `TenantContext` verification on every query | **RESOLVED / VERIFIED** |
| Broken Object Property Level Authorization | High | Moderate | Backend `filter_response_fields` & `validate_mutation_fields` | **RESOLVED / VERIFIED** |
| Broken Function Level Authorization | Critical | Moderate | Centralized `require_permission` and `require_super_admin` | **RESOLVED / VERIFIED** |
| Security Misconfiguration | Medium | Low | Fixed 5-role hierarchy; locked tenant role editing | **RESOLVED / VERIFIED** |
| Insufficient Logging & Monitoring | Medium | Moderate | Immutable audit stream recording all Super Admin events | **RESOLVED / VERIFIED** |
