import sys
import os

# Add the parent directory to sys.path to import api modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from api.database import SessionLocal
from api.models import User
from api.auth import get_password_hash

def create_admin(username, password, email):
    db: Session = SessionLocal()
    try:
        # Check if user exists
        user = db.query(User).filter(User.username == username).first()
        if user:
            print(f"User {username} already exists. Updating to admin and setting password...")
            user.role = "admin"
            user.hashed_password = get_password_hash(password)
            user.is_active = True
        else:
            print(f"Creating new admin user: {username}...")
            user = User(
                username=username,
                email=email,
                hashed_password=get_password_hash(password),
                role="admin",
                full_name="Admin",
                is_active=True
            )
            db.add(user)
        
        db.commit()
        print(f"Successfully set {username} as Admin!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python setup_admin.py <username> <password> <email>")
    else:
        create_admin(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else f"{sys.argv[1]}@admin.com")
