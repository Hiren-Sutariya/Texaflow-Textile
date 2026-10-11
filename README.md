# DigiScale — Business Management System

DigiScale (UI title: **Business Monitoring**) is a production-grade ERP and operational OS built specifically for embroidery manufacturing and job-work businesses.

## Architecture

- `frontend/`: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- `backend/`: Python, FastAPI, Pydantic, SQLAlchemy, Supabase integration
- `database/`: Supabase PostgreSQL schema, migrations, RLS policies, seed data
- `docs/`: Architecture & API documentation

## Quick Start

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev -- -p 3000
```
