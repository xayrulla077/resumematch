from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import os
from api.database import get_db
from api.models import User
from api.schemas import UserCreate, UserResponse, Token, UserBase, GoogleToken
from api.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from utils.activity_logger import log_activity
from google.oauth2 import id_token
from google.auth.transport import requests

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

router = APIRouter()


@router.post("/google", response_model=Token)
async def google_login(data: GoogleToken, db: Session = Depends(get_db)):
    """Google orqali kirish/ro'yxatdan o'tish"""
    try:
        # Verify Google Token
        idinfo = id_token.verify_oauth2_token(data.token, requests.Request(), GOOGLE_CLIENT_ID)

        # Extract info
        email = idinfo['email']
        full_name = idinfo.get('name', '')
        
        # Foydalanuvchini topish yoki yaratish
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Yangi foydalanuvchi (Google orqali)
            username = email.split('@')[0]
            # Username band bo'lsa raqam qo'shamiz
            base_username = username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = User(
                email=email,
                username=username,
                hashed_password=get_password_hash("GoogleAuthNoPassword!"), # Random password or flag
                full_name=full_name,
                role="user"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Token yaratish
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role},
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except ValueError:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google tokeni yaroqsiz"
        )


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Yangi foydalanuvchi ro'yxatdan o'tkazish"""

    # Username tekshirish
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu username allaqachon band"
        )

    # Email tekshirish
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu email allaqachon ro'yxatdan o'tgan"
        )

    # Yangi foydalanuvchi yaratish
    hashed_password = get_password_hash(user.password)

    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        phone=user.phone,
        bio=user.bio,
        role="user"  # Default role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log activity
    log_activity(
        db,
        new_user.id,
        "register",
        "Yangi foydalanuvchi ro'yxatdan o'tdi",
        {"username": new_user.username}
    )

    return new_user


@router.post("/login", response_model=Token)
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
):
    """Foydalanuvchi tizimga kirish"""

    # Foydalanuvchini topish
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username yoki parol noto'g'ri",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Foydalanuvchi faol emas"
        )

    # Token yaratish
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )

    # Log activity
    log_activity(
        db,
        user.id,
        "login",
        "Foydalanuvchi tizimga kirdi"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """Hozirgi foydalanuvchi ma'lumotlarini olish"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
        user_update: UserBase,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Foydalanuvchi ma'lumotlarini yangilash"""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    if user_update.email:
        # Check if email already taken by another user
        existing_email = db.query(User).filter(User.email == user_update.email, User.id != current_user.id).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Bu email allaqachon band")
        current_user.email = user_update.email

    db.commit()
    db.refresh(current_user)

    # Log activity
    log_activity(
        db,
        current_user.id,
        "profile_update",
        "Profil ma'lumotlari yangilandi"
    )

    return current_user


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Profil rasmini yuklash"""
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Faqat rasm fayllari (png, jpg) qabul qilinadi")

    content = await file.read()
    if len(content) > 2 * 1024 * 1024:  # 2MB limit
        raise HTTPException(status_code=400, detail="Rasm hajmi 2MB dan oshmasligi kerak")

    # Save logic
    avatar_dir = os.path.join("uploads", "avatars")
    os.makedirs(avatar_dir, exist_ok=True)
    
    ext = os.path.splitext(file.filename)[1]
    filename = f"{current_user.id}_avatar_{int(datetime.now().timestamp())}{ext}"
    file_path = os.path.join(avatar_dir, filename)
    
    with open(file_path, "wb") as f:
        f.write(content)
        
    current_user.profile_image = f"/uploads/avatars/{filename}"
    db.commit()
    
    return {"message": "Profil rasmi yangilandi", "url": current_user.profile_image}