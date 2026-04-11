from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api import models
from api.auth import get_current_active_user
import json

router = APIRouter()

# VAPID keys for web push (these should be configured in environment)
VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
VAPID_PRIVATE_KEY = "UUxI4O8-FbRouAf7-7OTt9GH4o-8iN8Fi0J0L9K3Y"


@router.post("/subscribe")
async def subscribe_to_push(
    endpoint: str,
    keys: dict,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Web Push ga obuna bo'lish"""
    # Check if already subscribed
    existing = (
        db.query(models.PushSubscription)
        .filter(
            models.PushSubscription.user_id == current_user.id,
            models.PushSubscription.endpoint == endpoint,
        )
        .first()
    )

    if existing:
        return {"message": "Allaqachon obuna qilgansiz"}

    # Save subscription
    subscription = models.PushSubscription(
        user_id=current_user.id,
        endpoint=endpoint,
        keys=json.dumps(keys, ensure_ascii=False),
    )
    db.add(subscription)
    db.commit()

    return {"message": "Muvaffaqiyatli obuna qilindi", "status": "subscribed"}


@router.delete("/unsubscribe")
async def unsubscribe_from_push(
    endpoint: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Web Push dan obunani bekor qilish"""
    subscription = (
        db.query(models.PushSubscription)
        .filter(
            models.PushSubscription.user_id == current_user.id,
            models.PushSubscription.endpoint == endpoint,
        )
        .first()
    )

    if not subscription:
        raise HTTPException(status_code=404, detail="Obuna topilmadi")

    db.delete(subscription)
    db.commit()

    return {"message": "Obuna bekor qilindi"}


@router.get("/my-subscriptions")
async def get_my_subscriptions(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Mening obunalarim"""
    subs = (
        db.query(models.PushSubscription)
        .filter(models.PushSubscription.user_id == current_user.id)
        .all()
    )

    return {
        "subscriptions": [
            {
                "id": s.id,
                "endpoint": s.endpoint,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in subs
        ]
    }


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """VAPID public key ni olish (frontend uchun)"""
    return {"public_key": VAPID_PUBLIC_KEY}


async def send_push_notification(db: Session, user_id: int, title: str, body: str):
    """Yordamchi funksiya - push notification yuborish"""
    subscriptions = (
        db.query(models.PushSubscription)
        .filter(models.PushSubscription.user_id == user_id)
        .all()
    )

    if not subscriptions:
        return

    # Note: Real implementation requires pywebpush library
    # This is a placeholder for the notification sending logic
    print(f"Sending push to user {user_id}: {title} - {body}")

    for sub in subscriptions:
        # In production, use:
        # from pywebpush import webpush, WebPushException
        # webpush(json.loads(sub.keys), json.dumps({"title": title, "body": body}), vapid_private_key=VAPID_PRIVATE_KEY, vapid_claims={"sub": "mailto:admin@example.com"})
        pass


@router.post("/test")
async def test_push(
    title: str = "Test",
    body: str = "Bu test xabaridir",
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Test notification yuborish"""
    await send_push_notification(db, current_user.id, title, body)
    return {"message": "Test notification yuborildi"}
