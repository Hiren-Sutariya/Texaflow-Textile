from datetime import datetime
from app.core.database import SessionLocal
from app.models.expense import Expense

def parse_date_obj(d_str):
    if not d_str:
        return datetime(2026, 1, 1)
    parts = d_str.strip().split("-")
    if len(parts) == 3:
        if len(parts[0]) == 4:
            return datetime.strptime(d_str, "%Y-%m-%d")
        return datetime.strptime(d_str, "%d-%m-%Y")
    return datetime(2026, 1, 1)

def migrate_and_sequence_expenses():
    db = SessionLocal()
    expenses = db.query(Expense).all()
    print(f"Total expenses fetched: {len(expenses)}")

    # Sort chronologically (oldest date first, with stable ID tiebreaker)
    sorted_expenses = sorted(
        expenses,
        key=lambda x: (
            parse_date_obj(x.date),
            int(x.id.replace("exp-", "")) if x.id and x.id.replace("exp-", "").isdigit() else 0
        )
    )

    from sqlalchemy import text
    from app.core.database import engine

    with engine.connect() as conn:
        for idx, exp in enumerate(sorted_expenses, start=1):
            temp_id = f"tmp-exp-{idx:03d}"
            conn.execute(text('UPDATE "05_expenses" SET id = :temp_id WHERE id = :old_id'), {'temp_id': temp_id, 'old_id': exp.id})

        for idx, exp in enumerate(sorted_expenses, start=1):
            temp_id = f"tmp-exp-{idx:03d}"
            final_id = f"exp-{idx:03d}"
            final_no = f"EB-{idx:03d}"
            v_name = None if exp.vendor_name in ("General Vendor", "general vendor", "General vendor") else exp.vendor_name
            conn.execute(
                text('UPDATE "05_expenses" SET id = :final_id, expense_no = :final_no, vendor_name = :v_name WHERE id = :temp_id'),
                {'final_id': final_id, 'final_no': final_no, 'v_name': v_name, 'temp_id': temp_id}
            )
            print(f"Row {idx:02d}: {final_id} -> {final_no} | Date={exp.date} | Notes={exp.notes[:35] if exp.notes else ''}")
        conn.commit()

    print("\n✅ Successfully updated all expenses in Supabase in sequence (both id and expense_no matched)!")

if __name__ == "__main__":
    migrate_and_sequence_expenses()
