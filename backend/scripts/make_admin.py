"""
Admin user yaratish scripti
"""
import sys
sys.path.append('.')

from api.database import SessionLocal
from api import models

def make_admin(username):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == username).first()
        if user:
            user.role = "admin"
            db.commit()
            print(f"✅ {username} endi admin!")
            print(f"Login: {username}")
            print(f"Email: {user.email}")
        else:
            print(f"❌ {username} topilmadi!")
    finally:
        db.close()

if __name__ == "__main__":
    # O'zingiz yaratgan username ni kiriting
    username = input("Username kiriting: ")
    make_admin(username)
