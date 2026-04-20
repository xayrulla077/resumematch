import sqlite3
import os

def fix_database():
    db_path = os.path.join(os.path.dirname(__file__), '..', 'resume_matcher.db')
    print(f"Connecting to database at: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Add missing columns to users table
    columns_to_add = [
        ('location', 'VARCHAR'),
        ('linkedin', 'VARCHAR'),
        ('facebook', 'VARCHAR'),
        ('instagram', 'VARCHAR')
    ]
    
    cursor.execute("PRAGMA table_info(users)")
    existing_columns = [col[1] for col in cursor.fetchall()]
    
    for col_name, col_type in columns_to_add:
        if col_name not in existing_columns:
            print(f"Adding column {col_name} to users table...")
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                print(f"Column {col_name} added successfully.")
            except Exception as e:
                print(f"Error adding column {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")
            
    conn.commit()
    conn.close()
    print("Database fix completed.")

if __name__ == "__main__":
    fix_database()
