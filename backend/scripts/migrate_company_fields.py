"""
Kompaniya jadvaliga yangi maydonlarni qo'shish migratsiyasi.
Bir marta ishga tushirish kerak.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from api.database import engine
from sqlalchemy import text

NEW_COLUMNS = [
    ("phone",            "VARCHAR"),
    ("email",            "VARCHAR"),
    ("work_hours_start", "VARCHAR"),
    ("work_hours_end",   "VARCHAR"),
    ("work_days",        "VARCHAR"),
    ("gallery_images",   "TEXT"),
    ("founders",         "TEXT"),
]

def column_exists(conn, table, col):
    result = conn.execute(text(f"PRAGMA table_info({table})"))
    return any(row[1] == col for row in result.fetchall())

def run():
    with engine.connect() as conn:
        for col_name, col_type in NEW_COLUMNS:
            if not column_exists(conn, "company_profiles", col_name):
                conn.execute(text(
                    f"ALTER TABLE company_profiles ADD COLUMN {col_name} {col_type}"
                ))
                print(f"✅ Qo'shildi: {col_name} ({col_type})")
            else:
                print(f"⏭️  Allaqachon mavjud: {col_name}")
        conn.commit()
    print("\n✅ Migratsiya muvaffaqiyatli yakunlandi!")

if __name__ == "__main__":
    run()
