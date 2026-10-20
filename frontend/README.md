# TexaFlow Textile ERP — Next.js Frontend

Modern, high-performance web dashboard built with Next.js 15 (App Router), React 19, TypeScript, and Tailwind CSS for **TexaFlow Textile ERP / Om Sai**.

---

## 🎨 Features & Modules

- **Owner Command Center**: Real-time KPI summaries, today's cash flow, and quick-action shortcuts.
- **Masters**:
  - `Parties` (`/vendors` / `/parties`): Supplier, mill, vepari, and customer khata management.
  - `Workers` (`/employees`): Karigar & salaried staff records, shifts, and advances.
- **Finance**:
  - `Expenses` (`/expenses`): Factory overheads, salary disbursements, and power bills.
  - `Purchases` (`/purchases`): Raw material & fabric inward bills with credit terms (Net 30/45/60).
  - `Payments` (`/payments`): Payment vouchers, RTGS/NEFT/Cheque/Cash receipts.
  - `Ledger` (`/ledger`): Live party debit/credit statements and closing balances.
- **Settings**:
  - `Categories` (`/categories`): Custom master classifications for materials, expenses, and designs.
  - `Settings` (`/settings`): Complete company profile, multi-bank accounts, QR code UPI, and invoice/challan prefix configurations.
- **Upcoming Modules**:
  - `Design Library` (`/designs`): Stitch count calculator, thread consumption, and embroidery artwork.
  - `Karigar Issue` (`/job-works`): Jobwork issuance & piece-rate tracking.
  - `Worker Payout` (`/worker-payout`): Karigar wage settlements.
  - `OMS Performance` (`/oms-performance`): Production machine speeds and operator efficiency.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev -- -p 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Library**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data Fetching**: Custom API client with automatic Bearer token & multi-tenant headers (`X-Company-Id`).
