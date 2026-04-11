"""
Admin parolini reset qilish yoki yangi admin yaratish scripti.
Backend papkasida turib ishga tushiring:

  cd resume-matcher/backend
  python reset_admin.py
"""
import sys
sys.path.append('.')

from api.database import SessionLocal
from api import models
from api.auth import get_password_hash


def list_all_admins():
    """Barcha adminlarni ko'rsatish"""
    db = SessionLocal()
    try:
        admins = db.query(models.User).filter(models.User.role == "admin").all()
        if not admins:
            print("❌ Hech qanday admin topilmadi.")
        else:
            print("\n📋 Adminlar ro'yxati:")
            print("-" * 40)
            for u in admins:
                print(f"  ID: {u.id} | Username: {u.username} | Email: {u.email} | Faol: {u.is_active}")
            print("-" * 40)
    finally:
        db.close()


def reset_password(username: str, new_password: str):
    """Foydalanuvchi parolini yangilash"""
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            print(f"❌ '{username}' foydalanuvchisi topilmadi!")
            return

        user.hashed_password = get_password_hash(new_password)
        user.is_active = True  # Agar bloklangan bo'lsa ochib qo'yamiz
        db.commit()
        print(f"\n✅ '{username}' paroli muvaffaqiyatli yangilandi!")
        print(f"   Role: {user.role}")
        print(f"   Email: {user.email}")
        print(f"   Yangi parol: {new_password}")
    finally:
        db.close()


def create_new_admin(username: str, email: str, password: str, full_name: str = "Admin"):
    """Yangi admin yaratish"""
    db = SessionLocal()
    try:
        # Mavjudligini tekshirish
        existing = db.query(models.User).filter(
            (models.User.username == username) | (models.User.email == email)
        ).first()
        if existing:
            print(f"❌ Bu username yoki email allaqachon band: {existing.username}")
            return

        new_admin = models.User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            role="admin",
            is_active=True
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        print(f"\n✅ Yangi admin yaratildi!")
        print(f"   Username: {username}")
        print(f"   Email: {email}")
        print(f"   Parol: {password}")
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 40)
    print("   ADMIN BOSHQARUV VOSITASI")
    print("=" * 40)
    print("\n1. Barcha adminlarni ko'rish")
    print("2. Parolni reset qilish")
    print("3. Yangi admin yaratish")

    choice = input("\nTanlov (1/2/3): ").strip()

    if choice == "1":
        list_all_admins()

    elif choice == "2":
        list_all_admins()
        username = input("\nUsername kiriting: ").strip()
        new_pass = input("Yangi parol (kamida 8 ta belgi, 1 katta harf, 1 raqam): ").strip()
        reset_password(username, new_pass)

    elif choice == "3":
        username = input("Username: ").strip()
        email = input("Email: ").strip()
        full_name = input("To'liq ism: ").strip()
        password = input("Parol (kamida 8 ta belgi, 1 katta harf, 1 raqam): ").strip()
        create_new_admin(username, email, password, full_name)

    else:
        print("❌ Noto'g'ri tanlov!")
