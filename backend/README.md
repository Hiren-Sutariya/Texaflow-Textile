# Om Sai Textile ERP - FastAPI Backend

High-performance Python FastAPI backend for Om Sai Textile ERP with PostgreSQL (Cloud DB / Supabase / Neon).

---

## 🚀 Quick Setup

### 1. Create & Activate Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Database URL
Copy `.env.example` to `.env` and set your Cloud PostgreSQL connection string:
```bash
cp .env.example .env
```
Inside `.env`:
```env
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:5432/postgres"
```

### 4. Run the Development Server
```bash
python run.py
```
Or with uvicorn:
```bash
uvicorn app.main:app --reload --port 8000
```

---

## 📖 API Documentation (Swagger)
Once the server is running, access interactive API documentation:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🗄️ Database Architecture
All tables are automatically synced on startup:
- `expenses`: Expenses with categories, vendors, bills, status, amount
- `payment_vouchers`: Payment and receipt transactions
- `parties`: Customers, vendors, and jobworkers
- `job_orders`: Multi-head embroidery job orders and stitches
- `machines`: Embroidery machine status and efficiency
- `inventory_stock`: Raw materials and dhaga inventory
- `employees`: Karigar salary and worker advances
