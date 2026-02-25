from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
import os
from sqlalchemy.orm import Session
from api.database import get_db
from api import models, schemas
from api.auth import get_current_active_user
import psutil
import time
from datetime import datetime, timedelta
from typing import List

router = APIRouter()

# Keep track of server start time
START_TIME = datetime.now()

@router.get("/system-stats", response_model=schemas.SystemStatsResponse)
async def get_system_stats(current_user: models.User = Depends(get_current_active_user)):
    """Tizim resurslari haqida ma'lumot (faqat admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Ruxsat berilmagan")
    
    uptime_delta = datetime.now() - START_TIME
    uptime_str = f"{uptime_delta.days}d {uptime_delta.seconds // 3600}h {(uptime_delta.seconds // 60) % 60}m"
    
    return {
        "cpu_usage": psutil.cpu_percent(interval=0.1),
        "memory_usage": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('/').percent,
        "uptime": uptime_str,
        "server_time": datetime.now()
    }

@router.get("/db-overview", response_model=schemas.DBOverviewResponse)
async def get_db_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Baza statistikasi (faqat admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Ruxsat berilmagan")
    
    return {
        "resumes_count": db.query(models.Resume).count(),
        "jobs_count": db.query(models.Job).count(),
        "matches_count": db.query(models.Match).count(),
        "users_count": db.query(models.User).count(),
        "applications_count": db.query(models.Application).count()
    }

@router.get("/activity-logs", response_model=List[schemas.ActivityLogResponse])
async def get_activity_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Oxirgi harakatlar logi (faqat admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Ruxsat berilmagan")
    
    logs = db.query(models.ActivityLog)\
        .order_by(models.ActivityLog.created_at.desc())\
        .limit(limit)\
        .all()
    
    return logs

@router.get("/users", response_model=List[schemas.UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Foydalanuvchilar ro'yxati (faqat admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Ruxsat berilmagan")
    
    users = db.query(models.User).all()
    return users

@router.get("/backup")
async def create_backup(current_user: models.User = Depends(get_current_active_user)):
    """Ma'lumotlar bazasidan nusxa olish (faqat admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Ruxsat berilmagan")
    
    db_path = "./resume_matcher.db"
    if not os.path.exists(db_path):
         raise HTTPException(status_code=404, detail="Baza fayli topilmadi")
         
    return FileResponse(
        db_path, 
        filename=f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db",
        media_type='application/x-sqlite3'
    )
