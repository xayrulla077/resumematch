"""
Database migration - add missing columns to users table.
Run: python migrate_users.py
"""

import sys

sys.path.append(".")

from api.database import engine
from sqlalchemy import text


def migrate():
    with engine.connect() as conn:
        # Check if columns exist
        result = conn.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result]

        print("Current columns:", columns)

        # Add missing columns
        if "company_name" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN company_name VARCHAR"))
            print("✅ Added company_name column")

        if "company_logo" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN company_logo VARCHAR"))
            print("✅ Added company_logo column")

        # Also check and add other new tables
        tables = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        table_names = [t[0] for t in tables]
        print("\nExisting tables:", table_names)

        # Create missing tables
        new_tables = [
            "user_skills",
            "company_reviews",
            "salary_data",
            "video_resumes",
            "push_subscriptions",
            "messages",
            "job_tests",
            "test_questions",
            "test_attempts",
        ]

        for table in new_tables:
            if table not in table_names:
                print(f"⚠️ Table {table} doesn't exist - needs full migration")

        conn.commit()
        print("\n✅ Migration complete!")


if __name__ == "__main__":
    migrate()
