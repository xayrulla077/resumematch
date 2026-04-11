"""
Reset password for specific users.
Run: python reset_passwords.py
"""

import sys

sys.path.append(".")

from api.database import SessionLocal
from api import models
from api.auth import get_password_hash


def reset_passwords():
    db = SessionLocal()

    # Users to reset
    users_to_reset = [
        {"username": "Gulijan", "password": "Password123"},
        {"username": "Asliddin", "password": "Password123"},
        {"username": "gulijan", "password": "Password123"},
        {"username": "asliddin", "password": "Password123"},
    ]

    results = []

    for user_data in users_to_reset:
        user = (
            db.query(models.User)
            .filter(models.User.username == user_data["username"])
            .first()
        )

        if user:
            user.hashed_password = get_password_hash(user_data["password"])
            user.is_active = True
            results.append(f"✅ {user.username} - parol yangilandi")
        else:
            results.append(f"❌ {user_data['username']} - topilmadi")

    db.commit()
    db.close()

    print("\n" + "=" * 40)
    print("PAROLLAR YANGILANDI:")
    print("=" * 40)
    for r in results:
        print(r)
    print("\nGulijan uchun: Password123")
    print("Asliddin uchun: Password123")
    print("=" * 40)


if __name__ == "__main__":
    reset_passwords()
