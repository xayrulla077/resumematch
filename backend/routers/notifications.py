from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api import models, schemas
from api.auth import get_current_active_user
from typing import List

router = APIRouter()

@router.get("", response_model=List[schemas.NotificationResponse])
async def get_notifications(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Foydalanuvchi bildirishnomalarini olish"""
    notifications = db.query(models.Notification)\
        .filter(models.Notification.user_id == current_user.id)\
        .order_by(models.Notification.created_at.desc())\
        .limit(50)\
        .all()
    return notifications

@router.post("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Bildirishnomani oqilgan deb belgilash"""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Bildirishnoma topilmadi")
        
    notification.is_read = True
    db.commit()
    return {"success": True}

@router.post("/read-all")
async def mark_all_notifications_as_read(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Barcha bildirishnomalarni oqilgan deb belgilash"""
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"success": True}

# Helper function to create notifications (to be used in other routers)
def create_notification(db: Session, user_id: int, title: str, message: str, n_type: str = "info"):
    notification = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=n_type
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
