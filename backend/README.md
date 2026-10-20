# TexaFlow Textile ERP — FastAPI Backend

Production-ready, high-performance Python FastAPI backend for TexaFlow Textile ERP with Supabase Cloud PostgreSQL database.

---

## 🏗️ Architecture & Project Structure

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/                   # Versioned REST API endpoints
│   │       ├── auth.py           # Authentication, User credentials & Settings
│   │       ├── categories.py     # 06_categories CRUD
│   │       ├── dashboard.py      # KPI cards & financial summaries
│   │       ├── designs.py        # 07_design_library endpoints
│   │       ├── expenses.py       # 03_expenses endpoints
│   │       ├── parties.py        # 01_parties endpoints (alias: vendors.py)
│   │       ├── payments.py       # 05_payments vouchers
│   │       ├── purchases.py      # 04_purchases inward bills
│   │       ├── system.py         # System health & audit
│   │       └── workers.py        # 02_workers endpoints (alias: employees.py)
│   ├── core/
│   │   ├── config.py             # App environment configuration
│   │   ├── database.py           # SQLAlchemy SessionLocal, 9-table auto-init & seeding
│   │   ├── email_verifier.py     # Real-time DNS & MX email validator
│   │   ├── formatters.py         # ID generator & date helpers
│   │   ├── mailer.py             # OTP email sender & verification
│   │   └── tenant.py             # Multi-tenant isolation header dependency
│   ├── models/                   # SQLAlchemy ORM Models mapped to Supabase
│   │   ├── category.py           # Table: 06_categories
│   │   ├── design.py             # Table: 07_design_library
│   │   ├── expense.py            # Table: 03_expenses
│   │   ├── party.py              # Table: 01_parties (alias: vendor.py)
│   │   ├── payment.py            # Table: 05_payments
│   │   ├── purchase.py           # Table: 04_purchases
│   │   ├── settings.py           # Table: 00_settings (alias: company.py)
│   │   ├── user.py               # Table: 00_auth_users
│   │   └── worker.py             # Table: 02_workers (alias: employee.py)
│   ├── schemas/                  # Pydantic schemas for request/response validation
│   └── main.py                   # FastAPI application factory & CORS configuration
├── .env.example
├── .gitignore
├── requirements.txt
├── run.py
└── README.md
```

---

## 🗄️ Database Schema (Supabase PostgreSQL)

All tables follow a clean, ordered sequence matching the ERP sidebar workflow:

| Seq | Table Name | Description | Primary Key |
| :---: | :--- | :--- | :--- |
| **00** | `00_auth_users` | Admin & staff login accounts | `id` (e.g. `user-001`) |
| **00** | `00_settings` | Company profile, banks, invoice prefixes & print preferences | `id` (e.g. `comp-001`) |
| **01** | `01_parties` | Vepari / suppliers / mills / clients | `id` (e.g. `ven-1`) |
| **02** | `02_workers` | Karigars & salaried staff | `id` (e.g. `emp-1`) |
| **03** | `03_expenses` | Factory & operational expenses | `id` (e.g. `exp-1`) |
| **04** | `04_purchases` | Raw material purchase inward bills | `id` (e.g. `pur-1`) |
| **05** | `05_payments` | Payment vouchers & receipts | `id` (e.g. `pay-1`) |
| **06** | `06_categories` | Material, expense & design categories | `id` (e.g. `cat-1`) |
| **07** | `07_design_library` | Embroidery designs, stitch counts & specs | `id` (e.g. `des-1`) |

---

## 🚀 Quick Setup & Running Locally

### 1. Virtual Environment & Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment Variables
Create `.env` using `.env.example`:
```env
PROJECT_NAME="TexaFlow Textile ERP API"
API_V1_STR="/api/v1"
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

### 3. Start Development Server
```bash
python3 run.py
```
Or directly with Uvicorn:
```bash
uvicorn app.main:app --reload --port 8000
```

---

## 📖 Interactive API Documentation
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
