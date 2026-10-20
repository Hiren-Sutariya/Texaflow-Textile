import os
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")

print(f"Connecting to Supabase PostgreSQL...")
engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as conn:
        insp = inspect(engine)
        existing_tables = set(insp.get_table_names())
        print(f"Current tables in Supabase: {sorted(list(existing_tables))}\n")

        # 1. 03_design_library -> 07_design_library (do first to free 03_ slot)
        if "03_design_library" in existing_tables:
            conn.execute(text('ALTER TABLE "03_design_library" RENAME TO "07_design_library";'))
            print("✅ Renamed: 03_design_library -> 07_design_library")
        elif "designs" in existing_tables:
            conn.execute(text('ALTER TABLE "designs" RENAME TO "07_design_library";'))
            print("✅ Renamed: designs -> 07_design_library")

        # 2. 01_vendors -> 01_parties
        if "01_vendors" in existing_tables:
            conn.execute(text('ALTER TABLE "01_vendors" RENAME TO "01_parties";'))
            print("✅ Renamed: 01_vendors -> 01_parties")
        elif "vendors" in existing_tables:
            conn.execute(text('ALTER TABLE "vendors" RENAME TO "01_parties";'))
            print("✅ Renamed: vendors -> 01_parties")

        # 3. 02_workers_karigars -> 02_workers
        if "02_workers_karigars" in existing_tables:
            conn.execute(text('ALTER TABLE "02_workers_karigars" RENAME TO "02_workers";'))
            print("✅ Renamed: 02_workers_karigars -> 02_workers")
        elif "employees" in existing_tables:
            conn.execute(text('ALTER TABLE "employees" RENAME TO "02_workers";'))
            print("✅ Renamed: employees -> 02_workers")

        # 4. 05_expenses -> 03_expenses
        if "05_expenses" in existing_tables:
            conn.execute(text('ALTER TABLE "05_expenses" RENAME TO "03_expenses";'))
            print("✅ Renamed: 05_expenses -> 03_expenses")
        elif "expenses" in existing_tables:
            conn.execute(text('ALTER TABLE "expenses" RENAME TO "03_expenses";'))
            print("✅ Renamed: expenses -> 03_expenses")

        # 5. purchases -> 04_purchases
        if "purchases" in existing_tables:
            conn.execute(text('ALTER TABLE "purchases" RENAME TO "04_purchases";'))
            print("✅ Renamed: purchases -> 04_purchases")

        # 6. 04_payments_vouchers -> 05_payments
        if "04_payments_vouchers" in existing_tables:
            conn.execute(text('ALTER TABLE "04_payments_vouchers" RENAME TO "05_payments";'))
            print("✅ Renamed: 04_payments_vouchers -> 05_payments")
        elif "payment_vouchers" in existing_tables:
            conn.execute(text('ALTER TABLE "payment_vouchers" RENAME TO "05_payments";'))
            print("✅ Renamed: payment_vouchers -> 05_payments")

        # 7. Create 06_categories if not exists
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS "06_categories" (
                id VARCHAR(50) PRIMARY KEY,
                company_id VARCHAR(50) NOT NULL DEFAULT 'comp-001',
                name VARCHAR(100) NOT NULL,
                module VARCHAR(50) NOT NULL,
                color VARCHAR(50),
                is_system BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        '''))
        print("✅ Verified / Created table: 06_categories")

        conn.commit()

        # Check final tables
        final_insp = inspect(engine)
        final_tables = sorted(final_insp.get_table_names())
        print(f"\n✨ Final Supabase tables in exact sidebar order:")
        for t in final_tables:
            count_res = conn.execute(text(f'SELECT count(*) FROM "{t}"')).scalar()
            print(f"  • {t:<22} ({count_res} records)")

if __name__ == "__main__":
    run_migration()
