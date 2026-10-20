# TexaFlow Textile ERP — Enterprise Management System

**TexaFlow Textile ERP** (Shiv Creation / Om Sai) is a full-stack, enterprise-grade cloud ERP and operational OS built specifically for textile embroidery manufacturing, trading, and job-work businesses.

---

## 🏗️ Repository Architecture

The project is structured as a clean, decoupled monorepo:

```text
.
├── backend/                  # Python FastAPI REST API Backend
│   ├── app/
│   │   ├── api/v1/           # Modular REST API endpoints
│   │   │   ├── auth.py       # Authentication & user profile
│   │   │   ├── categories.py # 06_categories master CRUD
│   │   │   ├── dashboard.py  # Executive KPI summaries & cash flow
│   │   │   ├── designs.py    # 07_design_library specifications
│   │   │   ├── expenses.py   # 03_expenses factory overheads
│   │   │   ├── parties.py    # 01_parties khata & contacts (alias: vendors.py)
│   │   │   ├── payments.py   # 05_payments vouchers
│   │   │   ├── purchases.py  # 04_purchases material inward bills
│   │   │   ├── system.py     # System health & diagnostic logs
│   │   │   └── workers.py    # 02_workers karigar directory (alias: employees.py)
│   │   ├── core/             # Configuration, database engine, mailer & multi-tenancy
│   │   ├── models/           # SQLAlchemy ORM models mapped to Supabase PostgreSQL
│   │   ├── schemas/          # Pydantic v2 validation models
│   │   └── main.py           # FastAPI application entrypoint & CORS
│   ├── requirements.txt      # Python dependencies
│   ├── run.py                # Server execution entrypoint
│   └── README.md
│
├── frontend/                 # Next.js 15 (App Router) + React 19 + Tailwind CSS
│   ├── app/                  # App Router pages & dashboard layouts
│   │   ├── (dashboard)/      # Protected dashboard views (parties, workers, expenses...)
│   │   ├── login/            # Authentication & OTP verification views
│   │   ├── globals.css       # Global design system & theme tokens
│   │   └── layout.tsx        # Root HTML wrapper & providers
│   ├── components/           # Reusable UI components & layouts (Sidebar, Navbar...)
│   ├── context/              # React Context (AuthContext, LanguageContext)
│   ├── lib/                  # API client, multi-tenant helpers & translations
│   ├── package.json          # Frontend dependencies & build scripts
│   └── README.md
│
├── .gitignore                # Global git ignore rules
└── README.md                 # Root project documentation
```

---

## 🗄️ Database Schema (Supabase PostgreSQL)

All database tables follow an organized, sequenced workflow matching the business operations:

| Seq | Table Name | Business Module | Description |
| :---: | :--- | :--- | :--- |
| **00** | `00_auth_users` | **Auth** | Owner and staff login credentials with PBKDF2 hashing |
| **00** | `00_settings` | **Settings** | Company profile, bank accounts, UPI QR, and invoice/challan prefixes |
| **01** | `01_parties` | **Parties** | Vepari, suppliers, yarn mills, and customers khata |
| **02** | `02_workers` | **Workers** | Karigars and salaried factory staff with shift and salary details |
| **03** | `03_expenses` | **Expenses** | Factory maintenance, power, tea, salary advances, and overheads |
| **04** | `04_purchases` | **Purchases** | Raw material, fabric, yarn, and zari inward bills with credit terms |
| **05** | `05_payments` | **Payments** | Payment vouchers, receipts, NEFT/RTGS, cheques, and cash transactions |
| **06** | `06_categories` | **Categories** | Master classifications for materials, expenses, and designs |
| **07** | `07_design_library` | **Designs** | Embroidery designs, stitch counts, artwork images, and pricing |

---

## 🚀 Quick Start Guide

### 1. Backend Setup (FastAPI)
```bash
cd backend

# Create & activate virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (Default: http://localhost:8000)
python3 run.py
```
- Interactive API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Alternative Docs (ReDoc): [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Frontend Setup (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev -- -p 3000
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Multi-Tenancy

- **Password Hashing**: PBKDF2 with SHA-256 and unique cryptographic salt per user.
- **Tenant Isolation**: Every database record is scoped with `company_id` (`comp-001`), enforced through FastAPI dependency injection (`get_tenant_company_id`) and HTTP headers (`X-Company-Id`).
- **Real-Time Auto-Initialization**: Server verifies and creates all tables on startup via `init_db()` in `database.py`.

---

## 📝 License
Proprietary software developed for Shiv Creation / Om Sai Textile Enterprises.
