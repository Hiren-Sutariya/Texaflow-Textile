"""
Supabase Schema Cleanup & Sync Script for Om Sai Textile ERP
- Drops unused tables (finished_designs, inventory_stock, job_orders, machines, parties)
- Keeps & initializes ONLY the 5 active modules:
    1. expenses
    2. payment_vouchers
    3. vendors
    4. employees (Workers & Karigars)
    5. designs (Design Library)
- Uses clean short IDs (exp-X, ven-X, emp-X, pay-X, des-X) and DD-MM-YYYY dates.
"""
from app.core.database import SessionLocal, engine, Base
from app.models.expense import Expense
from app.models.payment import PaymentVoucher
from app.models.vendor import Vendor
from app.models.employee import Employee
from app.models.design import Design
from sqlalchemy import text
import json

def cleanup_and_sync():
    print("🧹 Cleaning up unused tables in Supabase...")
    db = SessionLocal()

    try:
        # 1. Drop unused tables
        unused_tables = [
            "finished_designs",
            "inventory_stock",
            "job_orders",
            "machines",
            "parties"
        ]
        for tbl in unused_tables:
            db.execute(text(f"DROP TABLE IF EXISTS {tbl} CASCADE;"))
            print(f"  🗑️ Dropped table: {tbl}")
        db.commit()

        # 2. Create tables for active modules
        print("🏗️ Creating/Verifying tables for active modules...")
        Base.metadata.create_all(bind=engine)
        print("  ✅ Tables verified: expenses, payment_vouchers, vendors, employees, designs")

        # 3. Seed Vendors if empty
        if db.query(Vendor).count() == 0:
            sample_vendors = [
                Vendor(
                    id="ven-1",
                    sr_no=1,
                    account_type="Supplier / Vendor",
                    salutation="MR.",
                    first_name="Ramesh",
                    last_name="Khatri",
                    company_name="Shree Ram Yarns & Zari Mills",
                    display_name="Shree Ram Yarns & Zari Mills",
                    email="ramesh@shreeramyarns.com",
                    gstin="24AABCS9876E1Z5",
                    work_phone="0261 2451122",
                    mobile="+91 98241 12345",
                    pan="AABCS9876E",
                    is_msme=True,
                    payment_terms="Net 30",
                    city="Surat",
                    remarks="Primary metallic zari and polyester yarn supplier for embroidery machines."
                ),
                Vendor(
                    id="ven-2",
                    sr_no=2,
                    account_type="Job Work",
                    salutation="MR.",
                    first_name="Girish",
                    last_name="Panchal",
                    company_name="Ambica Embroidery & Cutting Works",
                    display_name="Ambica Embroidery & Cutting Works",
                    email="girish@ambicaemb.in",
                    gstin="24BGHPP4321K1Z9",
                    work_phone="0261 2890044",
                    mobile="+91 97129 87654",
                    pan="BGHPP4321K",
                    is_msme=True,
                    payment_terms="Due on Receipt",
                    city="Surat",
                    remarks="Specialized in cutting & post-embroidery stitching."
                ),
                Vendor(
                    id="ven-3",
                    sr_no=3,
                    account_type="Trading Partner",
                    salutation="MRS.",
                    first_name="Sunita",
                    last_name="Shah",
                    company_name="Vardhman Textile Machinery & Spares",
                    display_name="Vardhman Textile Machinery & Spares",
                    email="sunita@vardhmanspares.com",
                    gstin="24AAACV7788P1Z3",
                    work_phone="0261 2981122",
                    mobile="+91 98795 43210",
                    pan="AAACV7788P",
                    is_msme=False,
                    payment_terms="Net 45",
                    city="Surat",
                    remarks="Laser applique & spare parts dealer."
                )
            ]
            db.add_all(sample_vendors)
            db.commit()
            print("  ✅ 3 Sample Vendors seeded.")

        # 4. Seed Employees (Workers & Karigars) if empty
        if db.query(Employee).count() == 0:
            sample_employees = [
                Employee(id="emp-1", name="Ramesh Bhai (Master Karigar)", role="Head Karigar", phone="9825100011", monthly_salary=28000.0, current_advance=5000.0, status="Active"),
                Employee(id="emp-2", name="Suresh Bhai", role="Operator", phone="9825100012", monthly_salary=22000.0, current_advance=2000.0, status="Active"),
                Employee(id="emp-3", name="Mukesh Bhai", role="Operator", phone="9825100013", monthly_salary=22000.0, current_advance=0.0, status="Active"),
                Employee(id="emp-4", name="Dinesh Bhai", role="Helper", phone="9825100014", monthly_salary=15000.0, current_advance=1500.0, status="Active")
            ]
            db.add_all(sample_employees)
            db.commit()
            print("  ✅ 4 Sample Workers & Karigars seeded.")

        # 5. Seed Design Library if empty
        if db.query(Design).count() == 0:
            sample_designs = [
                Design(
                    id="des-1",
                    folder_code="PJD-2486",
                    title="Rani Silk Saree Work",
                    party_name="ABC Tex Fabrics",
                    created_date="01-10-2026",
                    machine_requirement="Multi-Head 12 Needles",
                    takko_length_meters=104.0,
                    cut_length_meters=0.93,
                    items=json.dumps([
                        {"category": "Front", "component_name": "Front Body", "stitch_count": 48500, "rate_per_1k": 0.45},
                        {"category": "Back", "component_name": "Back Body", "stitch_count": 36200, "rate_per_1k": 0.45},
                        {"category": "Patta", "component_name": "Pallu Border", "stitch_count": 62000, "rate_per_1k": 0.45}
                    ]),
                    colorways=json.dumps([
                        {"color_name": "Rani", "color_code": "#E11D48", "takka_count": 2, "roll_meters": [106, 104]},
                        {"color_name": "Rama", "color_code": "#0284C7", "takka_count": 1, "roll_meters": [104]}
                    ])
                ),
                Design(
                    id="des-2",
                    folder_code="PJD-77-35",
                    title="Kanchi Zari Butta Concept",
                    party_name="Royal Fashion House",
                    created_date="05-10-2026",
                    machine_requirement="Laser Applique 20 Heads",
                    takko_length_meters=100.0,
                    cut_length_meters=0.95,
                    items=json.dumps([
                        {"category": "All-Over", "component_name": "Zari Butti", "stitch_count": 28400, "rate_per_1k": 0.50}
                    ]),
                    colorways=json.dumps([
                        {"color_name": "Gold / Mustard", "color_code": "#CA8A04", "takka_count": 3, "roll_meters": [102, 100, 101]}
                    ])
                )
            ]
            db.add_all(sample_designs)
            db.commit()
            print("  ✅ 2 Sample Designs seeded.")

        # 6. Check final list of tables in Supabase
        tables = db.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename ASC")).fetchall()
        print("\n✨ Final Supabase public tables:")
        for t in tables:
            print(f"  📌 {t[0]}")

        print("\n🎉 Supabase cleanup and synchronization finished successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during cleanup: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_and_sync()
