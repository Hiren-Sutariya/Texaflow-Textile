"""
Database Seeding Script for Om Sai Textile ERP
Populates initial sample data for development and testing.
"""
from app.core.database import SessionLocal, init_db
from app.models.expense import Expense
from app.models.party import Party
from app.models.production import Machine

def seed_database():
    print("🌱 Initializing tables and seeding initial data...")
    init_db()
    db = SessionLocal()

    try:
        sample_expenses = [
            Expense(
                id="exp-1",
                expense_no="EB-001",
                date="26-09-2026",
                category="Karigar Salary",
                vendor_name="Master Karigar Union",
                amount=55000.0,
                payment_status="Paid",
                paid_via="Current Account HDFC",
                notes="Head Karigar & Night Shift Operators Monthly Salary Settlement"
            ),
            Expense(
                id="exp-2",
                expense_no="EB-002",
                date="24-09-2026",
                category="Electricity & Power",
                vendor_name="DGVCL Power Corp",
                amount=42500.0,
                payment_status="Paid",
                paid_via="Current Account HDFC",
                notes="Surat DGVCL Industrial Electricity Bill (4200 Units)"
            ),
            Expense(
                id="exp-3",
                expense_no="EB-003",
                date="23-09-2026",
                category="Worker Advance / Upad",
                vendor_name="Karigar Ramesh (Shift B)",
                amount=15000.0,
                payment_status="Paid",
                paid_via="Petty Cash",
                notes="Karigar Ramesh & Suresh Festival Advance"
            ),
            Expense(
                id="exp-4",
                expense_no="EB-004",
                date="22-09-2026",
                category="Machine Maintenance & Repairs",
                vendor_name="Ganesh Embroidery Services",
                amount=8500.0,
                payment_status="Paid",
                paid_via="UPI Cash",
                notes="Machine 3 Laser & Bearing Service"
            ),
            Expense(
                id="exp-5",
                expense_no="EB-005",
                date="21-09-2026",
                category="Packaging Materials",
                vendor_name="Maruti Jobwork Works Surat",
                amount=24000.0,
                payment_status="Pending",
                paid_via="Credit (15 days)",
                notes="Outsourced Machine Work / Jobwork Production Charges"
            ),
            Expense(
                id="exp-6",
                expense_no="EB-006",
                date="20-09-2026",
                category="Dhaga & Consumables",
                vendor_name="Surat Needle Mart",
                amount=14200.0,
                payment_status="Pending",
                paid_via="Credit (15 days)",
                notes="Groz-Beckert Needles (DBxK5) 10 boxes & Shuttle Hooks"
            ),
            Expense(
                id="exp-7",
                expense_no="EB-007",
                date="18-09-2026",
                category="Dhaga & Consumables",
                vendor_name="Shree Ram Threads Surat",
                amount=28400.0,
                payment_status="Paid",
                paid_via="HDFC Cheque",
                notes="Viscose Embroidery Threads (Rani & Rama Shade)"
            ),
            Expense(
                id="exp-8",
                expense_no="EB-008",
                date="10-09-2026",
                category="Logistics & Courier",
                vendor_name="Nayara Energy & Local Freight",
                amount=19000.0,
                payment_status="Paid",
                paid_via="UPI Cash",
                notes="Generator Diesel Tank Refill (200L) & Goods Tempo Freight"
            )
        ]

        existing_nos = {e.expense_no for e in db.query(Expense.expense_no).all()}
        for exp in sample_expenses:
            if exp.expense_no not in existing_nos:
                db.add(exp)
        db.commit()
        print(f"✅ Total expenses in DB: {db.query(Expense).count()}")

        # 2. Seed Embroidery Machines
        if db.query(Machine).count() == 0:
            sample_machines = [
                Machine(id="mch-1", name="Machine 1 (Multi-Head)", heads=24, speed_rpm=850, status="Running", operator_name="Ramesh Bhai", shift="Day", efficiency_pct=96.0),
                Machine(id="mch-2", name="Machine 2 (Multi-Head)", heads=24, speed_rpm=820, status="Running", operator_name="Suresh Bhai", shift="Day", efficiency_pct=92.5),
                Machine(id="mch-3", name="Machine 3 (Laser Applique)", heads=20, speed_rpm=780, status="Maintenance", operator_name="Mukesh Bhai", shift="Day", efficiency_pct=0.0),
                Machine(id="mch-4", name="Machine 4 (Multi-Head)", heads=24, speed_rpm=850, status="Running", operator_name="Dinesh Bhai", shift="Night", efficiency_pct=98.0)
            ]
            db.add_all(sample_machines)
            db.commit()
            print("✅ 4 Embroidery Machines seeded.")

        # 3. Seed Sample Parties
        if db.query(Party).count() == 0:
            sample_parties = [
                Party(id="pty-1", name="Shree Ram Threads Surat", party_type="Vendor", phone="9825100001", city="Surat"),
                Party(id="pty-2", name="Surat Needle Mart", party_type="Vendor", phone="9825100002", city="Surat"),
                Party(id="pty-3", name="Maruti Jobwork Works Surat", party_type="Vendor", phone="9825100003", city="Surat"),
                Party(id="pty-4", name="Ganesh Embroidery Services", party_type="Vendor", phone="9825100004", city="Surat"),
                Party(id="pty-5", name="Radhe Krishna Sarees", party_type="Customer", phone="9825100005", city="Surat")
            ]
            db.add_all(sample_parties)
            db.commit()
            print("✅ 5 Sample Parties & Vendors seeded.")

        print("🎉 Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"⚠️ Error while seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
