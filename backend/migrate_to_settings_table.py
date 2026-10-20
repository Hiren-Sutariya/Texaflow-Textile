import os
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")

print("Connecting to Supabase PostgreSQL...")
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        insp = inspect(engine)
        tables = set(insp.get_table_names())

        if "00_companies" in tables and "00_settings" not in tables:
            conn.execute(text('ALTER TABLE "00_companies" RENAME TO "00_settings";'))
            print("✅ Renamed table: 00_companies -> 00_settings")
        elif "00_settings" in tables:
            print("ℹ️ Table 00_settings already exists.")

        # Add all Settings page columns to 00_settings
        columns_to_add = [
            ("brand_name", "VARCHAR(255)"),
            ("tagline", "TEXT"),
            ("alt_phone", "VARCHAR(32)"),
            ("city_state", "VARCHAR(128)"),
            ("pincode", "VARCHAR(32)"),
            ("msme_no", "VARCHAR(64)"),
            ("website", "VARCHAR(128)"),
            ("pan", "VARCHAR(32)"),
            ("bank_name", "VARCHAR(128)"),
            ("account_holder", "VARCHAR(128)"),
            ("account_no", "VARCHAR(64)"),
            ("account_type", "VARCHAR(64)"),
            ("ifsc", "VARCHAR(32)"),
            ("branch_name", "VARCHAR(128)"),
            ("upi_id", "VARCHAR(128)"),
            ("qr_code_image", "TEXT"),
            ("invoice_title", "VARCHAR(128)"),
            ("challan_title", "VARCHAR(128)"),
            ("invoice_prefix", "VARCHAR(64)"),
            ("next_invoice_no", "VARCHAR(64)"),
            ("challan_prefix", "VARCHAR(64)"),
            ("next_challan_no", "VARCHAR(64)"),
            ("hsn_sac_code", "VARCHAR(64)"),
            ("gst_rate", "VARCHAR(64)"),
            ("payment_terms", "VARCHAR(64)"),
            ("signatory_label", "VARCHAR(128)"),
            ("eway_threshold", "VARCHAR(32)"),
            ("print_qr", "BOOLEAN DEFAULT true"),
            ("terms_conditions", "TEXT"),
            ("settings_json", "JSONB")
        ]

        for col, col_type in columns_to_add:
            conn.execute(text(f'ALTER TABLE "00_settings" ADD COLUMN IF NOT EXISTS {col} {col_type};'))

        conn.commit()
        print("✅ Added all settings fields to 00_settings table!")

        # Verify
        final_insp = inspect(engine)
        final_cols = [c["name"] for c in final_insp.get_columns("00_settings")]
        print(f"\n✨ Columns in 00_settings ({len(final_cols)} columns):")
        print(", ".join(final_cols))

        records = conn.execute(text('SELECT id, name, owner_name, email FROM "00_settings"')).fetchall()
        print(f"\n📊 Existing records in 00_settings: {len(records)}")
        for r in records:
            print(f"  • {r[0]}: {r[1]} (Owner: {r[2]}, Email: {r[3]})")

if __name__ == "__main__":
    migrate()
