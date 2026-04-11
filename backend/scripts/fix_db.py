#!/usr/bin/env python
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "resume_matcher.db")
print(f"Database path: {db_path}")
print(f"Exists: {os.path.exists(db_path)}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check resumes table
cursor.execute("PRAGMA table_info(resumes)")
cols = cursor.fetchall()
print("\nCurrent resumes columns:")
for col in cols:
    print(f"  {col[1]}")

# Add missing columns
missing_cols = ["certifications", "projects", "achievements"]
existing_cols = [col[1] for col in cols]

for col_name in missing_cols:
    if col_name not in existing_cols:
        try:
            cursor.execute(f"ALTER TABLE resumes ADD COLUMN {col_name} TEXT")
            conn.commit()
            print(f"Added column: {col_name}")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")

conn.close()
print("\nDone!")
