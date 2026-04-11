"""
List all users in database.
Run: python list_users.py
"""

import sys

sys.path.append(".")

from api.database import SessionLocal
from api import models


def list_users():
    db = SessionLocal()

    users = db.query(models.User).all()

    print("\n" + "=" * 60)
    print("BARCHA FOYDALANUVCHILAR:")
    print("=" * 60)

    for u in users:
        print(
            f"ID: {u.id} | Username: {u.username} | Email: {u.email} | Role: {u.role}"
        )

    print("=" * 60)
    print(f"Jami: {len(users)} foydalanuvchi")

    db.close()


if __name__ == "__main__":
    list_users()
