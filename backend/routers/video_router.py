from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from api.database import get_db
from api import models
from api.auth import get_current_active_user
import os
import uuid
from datetime import datetime

router = APIRouter()

VIDEO_DIR = os.path.join(os.getcwd(), "uploads", "videos")
os.makedirs(VIDEO_DIR, exist_ok=True)


@router.post("/upload")
async def upload_video(
    title: str = None,
    description: str = None,
    video_type: str = "cover_letter",
    is_public: bool = False,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Video resume yuklash"""
    # Validate file type
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Video fayl kerak")

    # Check file size (max 50MB)
    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=400, detail="Video hajmi 50MB dan oshmasligi kerak"
        )

    # Save file
    ext = file.filename.split(".")[-1] if "." in file.filename else "mp4"
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(VIDEO_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    # Create database entry
    video = models.VideoResume(
        user_id=current_user.id,
        title=title,
        description=description,
        video_url=f"/uploads/videos/{filename}",
        video_type=video_type,
        is_public=is_public,
        duration=0,  # Could calculate with ffprobe
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    return {
        "id": video.id,
        "title": video.title,
        "video_url": video.video_url,
        "message": "Video muvaffaqiyatli yuklandi",
    }


@router.get("/my-videos")
async def get_my_videos(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Mening videolarim"""
    videos = (
        db.query(models.VideoResume)
        .filter(models.VideoResume.user_id == current_user.id)
        .order_by(models.VideoResume.created_at.desc())
        .all()
    )

    return {
        "videos": [
            {
                "id": v.id,
                "title": v.title,
                "description": v.description,
                "video_url": v.video_url,
                "video_type": v.video_type,
                "is_public": v.is_public,
                "view_count": v.view_count,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
            for v in videos
        ]
    }


@router.get("/{video_id}")
async def get_video(video_id: int, db: Session = Depends(get_db)):
    """Videoni ko'rish"""
    video = (
        db.query(models.VideoResume).filter(models.VideoResume.id == video_id).first()
    )

    if not video:
        raise HTTPException(status_code=404, detail="Video topilmadi")

    # Check access
    if not video.is_public and video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    # Increment view count
    video.view_count += 1
    db.commit()

    return {
        "id": video.id,
        "title": video.title,
        "description": video.description,
        "video_url": video.video_url,
        "video_type": video.video_type,
        "view_count": video.view_count,
        "created_at": video.created_at.isoformat() if video.created_at else None,
    }


@router.put("/{video_id}")
async def update_video(
    video_id: int,
    title: str = None,
    description: str = None,
    is_public: bool = None,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Videoni tahrirlash"""
    video = (
        db.query(models.VideoResume)
        .filter(
            models.VideoResume.id == video_id,
            models.VideoResume.user_id == current_user.id,
        )
        .first()
    )

    if not video:
        raise HTTPException(status_code=404, detail="Video topilmadi")

    if title is not None:
        video.title = title
    if description is not None:
        video.description = description
    if is_public is not None:
        video.is_public = is_public

    db.commit()
    db.refresh(video)

    return {"message": "Video yangilandi"}


@router.delete("/{video_id}")
async def delete_video(
    video_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Videoni o'chirish"""
    video = (
        db.query(models.VideoResume)
        .filter(
            models.VideoResume.id == video_id,
            models.VideoResume.user_id == current_user.id,
        )
        .first()
    )

    if not video:
        raise HTTPException(status_code=404, detail="Video topilmadi")

    # Delete file
    filepath = os.path.join(VIDEO_DIR, os.path.basename(video.video_url))
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(video)
    db.commit()

    return {"message": "Video o'chirildi"}


@router.get("/public/list")
async def get_public_videos(limit: int = 20, db: Session = Depends(get_db)):
    """Public videolar ro'yxati"""
    videos = (
        db.query(models.VideoResume)
        .filter(models.VideoResume.is_public == True)
        .order_by(models.VideoResume.view_count.desc())
        .limit(limit)
        .all()
    )

    results = []
    for v in videos:
        user = db.query(models.User).filter(models.User.id == v.user_id).first()
        results.append(
            {
                "id": v.id,
                "title": v.title,
                "description": v.description,
                "video_url": v.video_url,
                "video_type": v.video_type,
                "view_count": v.view_count,
                "created_by": user.full_name if user else "Anonim",
            }
        )

    return {"videos": results}
