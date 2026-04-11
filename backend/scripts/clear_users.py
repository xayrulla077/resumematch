import sys
sys.path.append('.')

from api.database import SessionLocal
from api import models

def clear_all_users():
    db = SessionLocal()
    try:
        # Delete related data first to avoid foreign key issues
        print("🗑️  Hamma ma'lumotlarni o'chirish boshlandi...")
        
        db.query(models.ActivityLog).delete()
        db.query(models.Notification).delete()
        db.query(models.Match).delete()
        db.query(models.Application).delete()
        db.query(models.Resume).delete()
        db.query(models.Job).delete()
        
        # Now delete users
        num_users = db.query(models.User).count()
        db.query(models.User).delete()
        
        db.commit()
        print(f"✅ Muvaffaqiyatli o'chirildi: {num_users} ta foydalanuvchi va ularga tegishli barcha ma'lumotlar.")
    except Exception as e:
        db.rollback()
        print(f"❌ Xatolik yuz berdi: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    confirm = input("DIQQAT! Hamma foydalanuvchilar va ma'lumotlar o'chib ketadi. Rozimisiz? (ha/yo'q): ")
    if confirm.lower() == 'ha':
        clear_all_users()
    else:
        print("Bekor qilindi.")
