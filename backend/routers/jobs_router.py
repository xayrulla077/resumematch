from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from api.database import get_db
from api import models, schemas
from api.auth import get_current_active_user
from datetime import datetime

router = APIRouter()


from sqlalchemy import or_
from utils.activity_logger import log_activity

@router.post("/", response_model=schemas.JobResponse)
async def create_job(
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Yangi ish o'rni yaratish"""
    
    # Create new job with authenticated user
    new_job = models.Job(
        title=job.title,
        company=job.company,
        location=job.location,
        salary=job.salary,
        employment_type=job.employment_type,
        description=job.description,
        requirements=job.requirements,
        creator_id=current_user.id,
        posted_at=datetime.now()
    )
    
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    # Log activity
    log_activity(
        db, 
        current_user.id, 
        "job_post", 
        f"Yangi ish o'rni yaratildi: {new_job.title}",
        {"job_id": new_job.id, "company": new_job.company}
    )
    
    return new_job


@router.get("/", response_model=schemas.PaginatedJobsResponse)
async def get_jobs(
    page: int = 1, 
    limit: int = 10, 
    search: str = None,
    db: Session = Depends(get_db)
):
    """Barcha ish o'rinlarini olish (paginatsiya va qidiruv bilan)"""
    skip = (page - 1) * limit
    
    query = db.query(models.Job)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Job.title.ilike(search_filter),
                models.Job.company.ilike(search_filter),
                models.Job.location.ilike(search_filter)
            )
        )
    
    total = query.count()
    jobs = query.offset(skip).limit(limit).all()
    
    total_pages = (total + limit - 1) // limit
    
    return {
        "items": jobs,
        "metadata": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    }


@router.get("/{job_id}", response_model=schemas.JobResponse)
async def get_job(job_id: int, db: Session = Depends(get_db)):
    """Bitta ish o'rnini olish"""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Ish o'rni topilmadi")
    return job


@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Ish o'rnini o'chirish — faqat yaratuvchi yoki admin"""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Ish o'rni topilmadi")

    # Faqat yaratuvchi yoki admin o'chira oladi
    if current_user.role != "admin" and job.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    db.delete(job)
    db.commit()
    
    # Log activity
    log_activity(
        db,
        current_user.id,
        "job_delete",
        f"Ish o'rni o'chirildi: {job.title}",
        {"job_id": job_id}
    )
    
    return {"message": "Ish o'rni o'chirildi"}


@router.put("/{job_id}", response_model=schemas.JobResponse)
async def update_job(
    job_id: int,
    job_update: schemas.JobUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Ish o'rnini tahrirlash"""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Ish o'rni topilmadi")

    # Only creator or admin
    if current_user.role != "admin" and job.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    # Update fields
    for key, value in job_update.model_dump().items():
        setattr(job, key, value)

    db.commit()
    db.refresh(job)

    # Log activity
    log_activity(
        db,
        current_user.id,
        "job_update",
        f"Ish o'rni tahrirlandi: {job.title}",
        {"job_id": job_id}
    )

    return job
