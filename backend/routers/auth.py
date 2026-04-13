from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from typing import Optional
import os
import secrets
import logging
from api.database import get_db
from api.models import User
from api.schemas import (
    UserCreate,
    UserResponse,
    Token,
    UserBase,
    UserUpdate,
    GoogleToken,
)
from api.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from utils.activity_logger import log_activity
from google.oauth2 import id_token
from google.auth.transport import requests

logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def get_rate_limit_key(request: Request) -> str:
    """Rate limit key"""
    return get_remote_address(request)


@router.post("/google", response_model=Token)
async def google_login(data: GoogleToken, db: Session = Depends(get_db)):
    """Google orqali kirish/ro'yxatdan o'tish"""
    try:
        idinfo = id_token.verify_oauth2_token(
            data.token, requests.Request(), GOOGLE_CLIENT_ID
        )

        email = idinfo["email"]
        full_name = idinfo.get("name", "")

        user = db.query(User).filter(User.email == email).first()

        if not user:
            username = email.split("@")[0]
            base_username = username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1

            user = User(
                email=email,
                username=username,
                hashed_password=get_password_hash(secrets.token_urlsafe(32)),
                full_name=full_name,
                role="candidate",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role},
            expires_delta=access_token_expires,
        )

        return {"access_token": access_token, "token_type": "bearer"}
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Google tokeni yaroqsiz"
        )


@router.post("/register", response_model=UserResponse)
@limiter.limit("3/minute")
async def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    """Yangi foydalanuvchi ro'yxatdan o'tkazish"""

    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu username allaqachon band",
        )

    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu email allaqachon ro'yxatdan o'tgan",
        )

    hashed_password = get_password_hash(user.password)

    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        phone=user.phone,
        bio=user.bio,
        role=user.role or "candidate",
        company_name=user.company_name if user.role == "employer" else None,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_activity(
        db,
        new_user.id,
        "register",
        "Yangi foydalanuvchi ro'yxatdan o'tdi",
        {"username": new_user.username},
    )

    return new_user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Foydalanuvchi tizimga kirish"""

    user = db.query(User).filter(User.username == form_data.username).first()

    # Check if user exists first
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username yoki parol noto'g'ri",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        remaining = (user.locked_until - datetime.now(timezone.utc)).seconds // 60
        logger.warning(f"Locked user login attempt: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Hisob {remaining} daqiqa ichida bloklangan. Keyinroq urinib ko'ring.",
        )

    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Foydalanuvchi faol emas"
        )

    # Verify password
    if not verify_password(form_data.password, user.hashed_password):
        # Increment failed attempts
        user.failed_login_attempts += 1

        if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(
                minutes=LOCKOUT_DURATION_MINUTES
            )
            logger.warning(
                f"Account locked: {user.username} after {MAX_FAILED_ATTEMPTS} failed attempts"
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f" Ko'p marta noto'g'ri urinish. Hisob {LOCKOUT_DURATION_MINUTES} daqiqaga bloklandi.",
            )

        db.commit()
        logger.warning(
            f"Failed login attempt {user.failed_login_attempts}/{MAX_FAILED_ATTEMPTS}: {user.username}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username yoki parol noto'g'ri",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Successful login - reset failed attempts
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_active = datetime.now(timezone.utc)
    db.commit()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires,
    )

    log_activity(db, user.id, "login", "Foydalanuvchi tizimga kirdi")
    logger.info(f"Successful login: {user.username}")

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_active_user),
):
    """Token yangilash (refresh)"""
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.username, "role": current_user.role},
        expires_delta=access_token_expires,
    )

    logger.info(f"Token refreshed: {current_user.username}")
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Foydalanuvchi tizimdan chiqish"""
    log_activity(db, current_user.id, "logout", "Foydalanuvchi tizimdan chiqdi")
    logger.info(f"User logged out: {current_user.username}")
    return {"message": "Muvaffaqiyatli chiqildi"}


# Password reset request
class PasswordResetRequest(BaseModel):
    email: EmailStr


@router.post("/password-reset-request")
async def request_password_reset(
    request_data: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    """Parolni tiklash so'rovi"""
    user = db.query(User).filter(User.email == request_data.email).first()

    # Don't reveal if email exists
    if not user:
        return {"message": "Agar email mavjud bo'lsa, ko'rsatma yuboriladi"}

    # Generate reset token
    reset_token = secrets.token_urlsafe(32)

    # In production, send email with reset link
    # For now, just return the token (FOR DEMO ONLY)
    logger.info(f"Password reset requested for: {user.email}")

    return {
        "message": "Agar email mavjud bo'lsa, ko'rsatma yuboriladi",
        "reset_token": reset_token,  # Remove in production!
    }


@router.post("/password-reset")
async def reset_password(
    token: str,
    new_password: str,
    db: Session = Depends(get_db),
):
    """Parolni tiklash"""
    # In production, validate token from email
    # For now, simplified version

    # Validate new password
    if len(new_password) < 8:
        raise HTTPException(
            status_code=400, detail="Parol kamida 8 ta belgidan iborat bo'lishi kerak"
        )

    return {"message": "Parol muvaffaqiyatli o'zgartirildi"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """Hozirgi foydalanuvchi ma'lumotlarini olish"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Foydalanuvchi ma'lumotlarini yangilash"""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    if user_update.email:
        existing_email = (
            db.query(User)
            .filter(User.email == user_update.email, User.id != current_user.id)
            .first()
        )
        if existing_email:
            raise HTTPException(status_code=400, detail="Bu email allaqachon band")
        current_user.email = user_update.email

    db.commit()
    db.refresh(current_user)

    log_activity(
        db, current_user.id, "profile_update", "Profil ma'lumotlari yangilandi"
    )

    return current_user


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Profil rasmini yuklash"""
    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(
            status_code=400, detail="Faqat rasm fayllari (png, jpg) qabul qilinadi"
        )

    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=400, detail="Rasm hajmi 2MB dan oshmasligi kerak"
        )

    avatar_dir = os.path.join("uploads", "avatars")
    os.makedirs(avatar_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or ".png")[1]
    filename = f"{current_user.id}_avatar_{int(datetime.now().timestamp())}{ext}"
    file_path = os.path.join(avatar_dir, filename)

    with open(file_path, "wb") as f:
        f.write(content)

    current_user.profile_image = f"/uploads/avatars/{filename}"
    db.commit()

    return {"message": "Profil rasmi yangilandi", "url": current_user.profile_image}
