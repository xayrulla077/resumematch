import sqlite3
import sys
import os

# Get database path
db_path = "resume_matcher.db"
if not os.path.exists(db_path):
    db_path = "..\\resume_matcher.db"

print(f"Using database: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check resumes table columns
cursor.execute("PRAGMA table_info(resumes)")
cols = cursor.fetchall()
existing_cols = [col[1] for col in cols]
print(f"\nExisting columns: {existing_cols}")

# Add missing columns for Resume model
new_columns = [
    ("certifications", "TEXT"),
    ("projects", "TEXT"),
    ("achievements", "TEXT"),
]

for col_name, col_type in new_columns:
    if col_name not in existing_cols:
        try:
            cursor.execute(f"ALTER TABLE resumes ADD COLUMN {col_name} {col_type}")
            print(f"Added column: {col_name}")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")

conn.commit()
conn.close()
print("\nMigration complete!")
print("Restart the backend: python main.py")
