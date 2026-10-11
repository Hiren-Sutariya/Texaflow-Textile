"""
Database Seeding Script for Om Sai Textile ERP
Populates initial sample data for development and testing.
"""
from app.core.database import SessionLocal, init_db
from app.models.expense import Expense
from app.models.party import Party
from app.models.production import Machine
from app.models.payment import PaymentVoucher
from app.models.inventory import InventoryStock
from app.models.employee import Employee

def seed_database():
    print("🌱 Initializing tables and seeding initial data...")
    init_db()
    db = SessionLocal()

    try:
        # 1. Seed Expenses (Matching our new form & table)
        if db.query(Expense).count() == 0:
            sample_expenses = [
                Expense(
                    expense_no="EXP-2026-081",
                    date="2026-09-26",
                    category="Karigar Salary",
                    title="Head Karigar & Night Shift Operators Monthly Salary Settlement",
                    vendor_name="Master Karigar Union",
                    amount=55000.0,
                    payment_status="Paid",
                    paid_via="Current Account HDFC",
                    invoice_no="SAL-2026-09",
                    notes="Head Karigar & Night Shift Operators Monthly Salary Settlement"
                ),
                Expense(
                    expense_no="EXP-2026-082",
                    date="2026-09-24",
                    category="Electricity & Power",
                    title="Surat DGVCL Industrial Electricity Bill",
                    vendor_name="DGVCL Power Corp",
                    amount=42500.0,
                    payment_status="Paid",
                    paid_via="Current Account HDFC",
                    invoice_no="DGVCL-992184",
                    notes="Surat DGVCL Industrial Electricity Bill (4200 Units)"
                ),
                Expense(
                    expense_no="EXP-2026-083",
                    date="2026-09-23",
                    category="Worker Advance / Upad",
                    title="Karigar Ramesh & Suresh Festival Advance",
                    vendor_name="Karigar Ramesh (Shift B)",
                    amount=15000.0,
                    payment_status="Paid",
                    paid_via="Petty Cash",
                    invoice_no="UPD-0923",
                    notes="Karigar Ramesh & Suresh Festival Advance"
                ),
                Expense(
                    expense_no="EXP-2026-084",
                    date="2026-09-22",
                    category="Machine Maintenance & Repairs",
                    title="Machine 3 Laser & Bearing Service",
                    vendor_name="Ganesh Embroidery Services",
                    amount=8500.0,
                    payment_status="Paid",
                    paid_via="UPI Cash",
                    invoice_no="GES-412",
                    notes="Machine 3 Laser & Bearing Service"
                ),
                Expense(
                    expense_no="EXP-2026-085",
                    date="2026-09-21",
                    category="Packaging Materials",
                    title="External Multi-Head Embroidery Jobwork Production Charges",
                    vendor_name="Maruti Jobwork Works Surat",
                    amount=24000.0,
                    payment_status="Pending",
                    paid_via="Credit (15 days)",
                    invoice_no="MJW-781",
                    notes="Outsourced Machine Work / Jobwork Production Charges"
                ),
                Expense(
                    expense_no="EXP-2026-086",
                    date="2026-09-20",
                    category="Dhaga & Consumables",
                    title="Groz-Beckert Needles (DBxK5) 10 boxes & Shuttle Hooks",
                    vendor_name="Surat Needle Mart",
                    amount=14200.0,
                    payment_status="Pending",
                    paid_via="Credit (15 days)",
                    invoice_no="SNM-889",
                    notes="Groz-Beckert Needles (DBxK5) 10 boxes & Shuttle Hooks"
                ),
                Expense(
                    expense_no="EXP-2026-087",
                    date="2026-09-18",
                    category="Dhaga & Consumables",
                    title="Viscose Embroidery Threads (Rani & Rama Shade)",
                    vendor_name="Shree Ram Threads Surat",
                    amount=28400.0,
                    payment_status="Paid",
                    paid_via="HDFC Cheque",
                    invoice_no="SRT-5510",
                    notes="Viscose Embroidery Threads (Rani & Rama Shade)"
                ),
                Expense(
                    expense_no="EXP-2026-088",
                    date="2026-09-10",
                    category="Logistics & Courier",
                    title="Generator Diesel Tank Refill (200L) & Goods Tempo Freight",
                    vendor_name="Nayara Energy & Local Freight",
                    amount=19000.0,
                    payment_status="Paid",
                    paid_via="UPI Cash",
                    invoice_no="PET-9912",
                    notes="Generator Diesel Tank Refill (200L) & Goods Tempo Freight"
                )
            ]
            db.add_all(sample_expenses)
            print("✅ 8 Sample Expenses seeded.")

        # 2. Seed Embroidery Machines
        if db.query(Machine).count() == 0:
            sample_machines = [
                Machine(name="Machine 1 (Multi-Head)", heads=24, speed_rpm=850, status="Running", operator_name="Ramesh Bhai", shift="Day", efficiency_pct=96.0),
                Machine(name="Machine 2 (Multi-Head)", heads=24, speed_rpm=820, status="Running", operator_name="Suresh Bhai", shift="Day", efficiency_pct=92.5),
                Machine(name="Machine 3 (Laser Applique)", heads=20, speed_rpm=780, status="Maintenance", operator_name="Mukesh Bhai", shift="Day", efficiency_pct=0.0),
                Machine(name="Machine 4 (Multi-Head)", heads=24, speed_rpm=850, status="Running", operator_name="Dinesh Bhai", shift="Night", efficiency_pct=98.0)
            ]
            db.add_all(sample_machines)
            print("✅ 4 Embroidery Machines seeded.")

        # 3. Seed Sample Parties
        if db.query(Party).count() == 0:
            sample_parties = [
                Party(name="Shree Ram Threads Surat", party_type="Vendor", phone="9825100001", city="Surat"),
                Party(name="Surat Needle Mart", party_type="Vendor", phone="9825100002", city="Surat"),
                Party(name="Maruti Jobwork Works Surat", party_type="Vendor", phone="9825100003", city="Surat"),
                Party(name="Ganesh Embroidery Services", party_type="Vendor", phone="9825100004", city="Surat"),
                Party(name="Radhe Krishna Sarees", party_type="Customer", phone="9825100005", city="Surat")
            ]
            db.add_all(sample_parties)
            print("✅ 5 Sample Parties & Vendors seeded.")

        db.commit()
        print("🎉 Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"⚠️ Error while seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
