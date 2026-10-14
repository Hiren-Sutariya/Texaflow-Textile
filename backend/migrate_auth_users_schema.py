"""
Migration script to restructure 00_auth_users in Supabase PostgreSQL and local SQLite:
1. Re-order columns:
   - id
   - firm_name
   - name
   - email
   - username
   - password_hash
   - company_id
   - created_at
   - updated_at
2. Remove role and role_title columns completely.
3. Clean up user IDs to short, company-matched format:
   - comp-001 -> user-001
   - comp-002 -> user-002
   - comp-XXX -> user-XXX
"""

import sys
import os
import sqlite3
import sqlalchemy as sa
from app.core.database import engine

def migrate_postgres():
    print("=== Migrating Supabase Cloud PostgreSQL ===")
    with engine.begin() as conn:
        # Check current rows
        old_rows = conn.execute(sa.text('SELECT * FROM "00_auth_users"')).fetchall()
        print(f"Read {len(old_rows)} rows from existing 00_auth_users")

        # Create new table with exact desired column order
        conn.execute(sa.text("""
            CREATE TABLE IF NOT EXISTS "00_auth_users_new" (
                id VARCHAR(64) PRIMARY KEY,
                firm_name VARCHAR(255) DEFAULT 'Om Sai Enterprise',
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                username VARCHAR(128) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                company_id VARCHAR(64) NOT NULL DEFAULT 'comp-002',
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
            );
        """))

        # Truncate new table if exists
        conn.execute(sa.text('TRUNCATE TABLE "00_auth_users_new"'))

        # Insert migrated data
        for r in old_rows:
            mapping = dict(r._mapping)
            cid = mapping.get("company_id") or "comp-001"
            
            # Compute clean short user ID matching company number
            # comp-001 -> user-001, comp-002 -> user-002
            comp_num_str = cid.replace("comp-", "").strip()
            if comp_num_str.isdigit():
                new_user_id = f"user-{int(comp_num_str):03d}"
            else:
                new_user_id = f"user-001"

            conn.execute(sa.text("""
                INSERT INTO "00_auth_users_new" 
                (id, firm_name, name, email, username, password_hash, company_id, created_at, updated_at)
                VALUES (:id, :firm_name, :name, :email, :username, :password_hash, :company_id, :created_at, :updated_at)
            """), {
                "id": new_user_id,
                "firm_name": mapping.get("firm_name"),
                "name": mapping.get("name"),
                "email": mapping.get("email"),
                "username": mapping.get("username"),
                "password_hash": mapping.get("password_hash"),
                "company_id": cid,
                "created_at": mapping.get("created_at"),
                "updated_at": mapping.get("updated_at")
            })
            print(f"Migrated user: {mapping.get('username')} -> id: {new_user_id}, firm: {mapping.get('firm_name')}")

        # Drop old table and rename new table
        conn.execute(sa.text('DROP TABLE "00_auth_users" CASCADE'))
        conn.execute(sa.text('ALTER TABLE "00_auth_users_new" RENAME TO "00_auth_users"'))
        conn.execute(sa.text('CREATE INDEX IF NOT EXISTS ix_00_auth_users_username ON "00_auth_users" (username)'))
        conn.execute(sa.text('CREATE INDEX IF NOT EXISTS ix_00_auth_users_company_id ON "00_auth_users" (company_id)'))
        print("✅ PostgreSQL migration completed successfully!")

def migrate_sqlite():
    db_path = "/Users/apple/Desktop/Om Sai /backend/om_sai.db"
    if not os.path.exists(db_path):
        return
    print("\n=== Migrating local SQLite ===")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    try:
        c.execute('SELECT * FROM "00_auth_users"')
        old_rows = c.fetchall()
        col_names = [d[0] for d in c.description]
        print(f"Read {len(old_rows)} rows from SQLite")

        c.execute('DROP TABLE IF EXISTS "00_auth_users_new"')
        c.execute('''
            CREATE TABLE "00_auth_users_new" (
                id VARCHAR(64) PRIMARY KEY,
                firm_name VARCHAR(255) DEFAULT 'Om Sai Enterprise',
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                username VARCHAR(128) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                company_id VARCHAR(64) NOT NULL DEFAULT 'comp-002',
                created_at DATETIME,
                updated_at DATETIME
            )
        ''')

        for row in old_rows:
            d = dict(zip(col_names, row))
            cid = d.get("company_id") or "comp-001"
            comp_num_str = cid.replace("comp-", "").strip()
            if comp_num_str.isdigit():
                new_user_id = f"user-{int(comp_num_str):03d}"
            else:
                new_user_id = f"user-001"

            c.execute('''
                INSERT INTO "00_auth_users_new"
                (id, firm_name, name, email, username, password_hash, company_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                new_user_id,
                d.get("firm_name"),
                d.get("name"),
                d.get("email"),
                d.get("username"),
                d.get("password_hash"),
                cid,
                d.get("created_at"),
                d.get("updated_at")
            ))
            print(f"SQLite Migrated: {d.get('username')} -> id: {new_user_id}")

        c.execute('DROP TABLE "00_auth_users"')
        c.execute('ALTER TABLE "00_auth_users_new" RENAME TO "00_auth_users"')
        conn.commit()
        print("✅ SQLite migration completed successfully!")
    except Exception as e:
        print(f"SQLite migration notice: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_postgres()
    migrate_sqlite()
