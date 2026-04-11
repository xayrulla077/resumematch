from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api import models
from api.auth import get_current_active_user
from typing import List
from datetime import datetime

router = APIRouter()


@router.get("/conversation/{application_id}")
async def get_conversation(
    application_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Application bo'yicha suhbatni olish"""
    application = (
        db.query(models.Application)
        .filter(models.Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Ariza topilmadi")

    # Faqat ariza egasi yoki employer ko'rishi mumkin
    if (
        current_user.id != application.user_id
        and current_user.id != application.job.creator_id
    ):
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    messages = (
        db.query(models.Message)
        .filter(models.Message.application_id == application_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    results = []
    for msg in messages:
        results.append(
            {
                "id": msg.id,
                "sender_id": msg.sender_id,
                "sender_name": msg.sender.full_name if msg.sender else "Noma'lum",
                "content": msg.content,
                "is_read": msg.is_read,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
            }
        )

    return {"messages": results}


@router.post("/send")
async def send_message(
    application_id: int,
    content: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Xabar yuborish"""
    if not content or not content.strip():
        raise HTTPException(status_code=400, detail="Xabar matni kiritilmagan")

    application = (
        db.query(models.Application)
        .filter(models.Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Ariza topilmadi")

    # Kimga yuborish kerak
    sender_id = int(current_user.id)
    if sender_id == int(application.user_id):
        receiver_id = int(application.job.creator_id)
    elif sender_id == int(application.job.creator_id):
        receiver_id = int(application.user_id)
    else:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Ruxsat yo'q")
        receiver_id = int(application.user_id)

    # Xabar yaratish
    message = models.Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        application_id=application_id,
        content=content.strip(),
        created_at=datetime.now(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    # Receiver uchun notification
    from routers.notifications import create_notification

    create_notification(
        db,
        user_id=receiver_id,
        title="Yangi xabar",
        message=f"Sizga yangi xabar keldi: {content[:50]}...",
        n_type="info",
    )

    return {
        "id": message.id,
        "sender_id": message.sender_id,
        "content": message.content,
        "created_at": message.created_at.isoformat() if message.created_at else None,
    }


@router.get("/conversations")
async def get_my_conversations(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Foydalanuvchining barcha suhbatlari"""
    # User ishtirok etgan applicationlar
    applications = (
        db.query(models.Application)
        .filter(
            (models.Application.user_id == current_user.id)
            | (models.Application.job.has(models.Job.creator_id == current_user.id))
        )
        .all()
    )

    conversations = []
    for app in applications:
        last_message = (
            db.query(models.Message)
            .filter(models.Message.application_id == app.id)
            .order_by(models.Message.created_at.desc())
            .first()
        )

        unread_count = (
            db.query(models.Message)
            .filter(
                models.Message.application_id == app.id,
                models.Message.receiver_id == current_user.id,
                models.Message.is_read == False,
            )
            .count()
        )

        other_user = (
            app.user
            if app.user_id != current_user.id
            else (app.job.creator if app.job else None)
        )

        if other_user:
            conversations.append(
                {
                    "application_id": app.id,
                    "job_title": app.job.title if app.job else "Noma'lum",
                    "other_user_name": other_user.full_name
                    if hasattr(other_user, "full_name")
                    else "Noma'lum",
                    "other_user_id": other_user.id,
                    "last_message": last_message.content[:50]
                    if last_message
                    else "Xabar yo'q",
                    "last_message_time": last_message.created_at.isoformat()
                    if last_message and last_message.created_at
                    else None,
                    "unread_count": unread_count,
                }
            )

    # Vaqt bo'yicha saralash
    conversations.sort(key=lambda x: x.get("last_message_time") or "", reverse=True)

    return {"conversations": conversations}


@router.post("/{message_id}/read")
async def mark_message_as_read(
    message_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Xabarni oqilgan deb belgilash"""
    message = (
        db.query(models.Message)
        .filter(
            models.Message.id == message_id,
            models.Message.receiver_id == current_user.id,
        )
        .first()
    )

    if not message:
        raise HTTPException(status_code=404, detail="Xabar topilmadi")

    message.is_read = True
    db.commit()
    return {"success": True}
