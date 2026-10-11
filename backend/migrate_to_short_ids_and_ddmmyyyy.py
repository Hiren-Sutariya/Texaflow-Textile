"""
Migration Script to convert Supabase tables to:
1. Short, clean IDs (exp-1, exp-2, pty-1, mch-1, etc.)
2. DD-MM-YYYY dates in all tables.
"""
from app.core.database import SessionLocal
from app.models.expense import Expense
from app.models.party import Party
from app.models.production import Machine
from app.core.formatters import format_to_dd_mm_yyyy
from sqlalchemy import text

def run_migration():
    print("🚀 Running migration for Short IDs and DD-MM-YYYY dates in Supabase...")
    db = SessionLocal()

    try:
        # 1. MIGRATE EXPENSES
        expenses = db.query(Expense).order_by(Expense.date.desc(), Expense.created_at.desc()).all()
        print(f"Found {len(expenses)} expenses to migrate...")
        
        for idx, exp in enumerate(expenses, start=1):
            short_id = f"exp-{idx}"
            formatted_date = format_to_dd_mm_yyyy(exp.date)
            
            # Use raw SQL to cleanly update PK and date
            db.execute(
                text("UPDATE expenses SET id = :new_id, date = :new_date WHERE expense_no = :exp_no"),
                {"new_id": short_id, "new_date": formatted_date, "exp_no": exp.expense_no}
            )
            print(f"  Expense {exp.expense_no}: id -> {short_id}, date -> {formatted_date}")
        
        db.commit()

        # 2. MIGRATE PARTIES
        parties = db.query(Party).order_by(Party.created_at.asc()).all()
        print(f"Found {len(parties)} parties to migrate...")
        for idx, p in enumerate(parties, start=1):
            short_id = f"pty-{idx}"
            db.execute(
                text("UPDATE parties SET id = :new_id WHERE name = :p_name"),
                {"new_id": short_id, "p_name": p.name}
            )
            print(f"  Party {p.name}: id -> {short_id}")
        db.commit()

        # 3. MIGRATE MACHINES
        machines = db.query(Machine).order_by(Machine.created_at.asc()).all()
        print(f"Found {len(machines)} machines to migrate...")
        for idx, m in enumerate(machines, start=1):
            short_id = f"mch-{idx}"
            db.execute(
                text("UPDATE machines SET id = :new_id WHERE name = :m_name"),
                {"new_id": short_id, "m_name": m.name}
            )
            print(f"  Machine {m.name}: id -> {short_id}")
        db.commit()

        print("🎉 Migration completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during migration: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
