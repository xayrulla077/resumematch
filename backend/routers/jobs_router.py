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
    current_user: models.User = Depends(get_current_active_user),
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
        posted_at=datetime.now(),
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # Log activity
    log_activity(
        db,
        int(current_user.id),
        "job_post",
        f"Yangi ish o'rni yaratildi: {new_job.title}",
        {"job_id": new_job.id, "company": new_job.company},
    )

    # Job Alert - Notify candidates with matching skills
    if new_job.required_skills:
        job_skills = set(
            s.strip().lower() for s in new_job.required_skills.split(",") if s.strip()
        )

        # Find candidates with matching skills
        candidates = db.query(models.User).filter(models.User.role == "candidate").all()

        for candidate in candidates:
            resumes = (
                db.query(models.Resume)
                .filter(models.Resume.user_id == candidate.id)
                .all()
            )

            for resume in resumes:
                if resume.skills:
                    resume_skills = set(
                        s.strip().lower() for s in resume.skills.split(",") if s.strip()
                    )
                    matched_skills = job_skills.intersection(resume_skills)

                    # If 50%+ skills match, send notification
                    if len(matched_skills) >= len(job_skills) * 0.5:
                        from routers.notifications import create_notification

                        create_notification(
                            db,
                            user_id=candidate.id,
                            title="Sizga mos yangi vakansiya!",
                            message=f"'{new_job.title}' vakansiya sizning ko'nikmalaringizga mos keladi ({len(matched_skills)} ta skill mos tushdi).",
                            n_type="job_alert",
                        )
                        break  # Bir resumes uchun bitta notification

    return new_job


@router.get("/", response_model=schemas.PaginatedJobsResponse)
async def get_jobs(
    page: int = 1, limit: int = 10, search: str = None, db: Session = Depends(get_db)
):
    """Barcha ish o'rinlarini olish (paginatsiya va qidiruv bilan)"""
    skip = (page - 1) * limit

    query = db.query(models.Job).filter(models.Job.is_active == True)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Job.title.ilike(search_filter),
                models.Job.company.ilike(search_filter),
                models.Job.location.ilike(search_filter),
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
            "total_pages": total_pages,
        },
    }


@router.get("/my-jobs")
async def get_my_jobs(
    page: int = 1,
    limit: int = 10,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Employerning o'z vakansiyalarini olish"""
    if current_user.role not in ["employer", "admin"]:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    skip = (page - 1) * limit

    query = db.query(models.Job).filter(models.Job.creator_id == current_user.id)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Job.title.ilike(search_filter),
                models.Job.company.ilike(search_filter),
            )
        )

    total = query.count()
    jobs = query.order_by(models.Job.posted_at.desc()).offset(skip).limit(limit).all()

    # Add applications_count to each job
    jobs_with_count = []
    for job in jobs:
        app_count = (
            db.query(models.Application)
            .filter(models.Application.job_id == job.id)
            .count()
        )
        jobs_with_count.append(
            {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "salary": job.salary,
                "employment_type": job.employment_type,
                "description": job.description,
                "requirements": job.requirements,
                "creator_id": job.creator_id,
                "is_active": job.is_active,
                "posted_at": job.posted_at.isoformat() if job.posted_at else None,
                "applications_count": app_count,
            }
        )

    total_pages = (total + limit - 1) // limit

    return {
        "items": jobs_with_count,
        "metadata": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
        },
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
    current_user: models.User = Depends(get_current_active_user),
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
        int(current_user.id),
        "job_delete",
        f"Ish o'rni o'chirildi: {job.title}",
        {"job_id": job_id},
    )

    return {"message": "Ish o'rni o'chirildi"}


@router.put("/{job_id}", response_model=schemas.JobResponse)
async def update_job(
    job_id: int,
    job_update: schemas.JobUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
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
        int(current_user.id),
        "job_update",
        f"Ish o'rni tahrirlandi: {job.title}",
        {"job_id": job_id},
    )

    return job


@router.get("/recommended")
async def get_recommended_jobs(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Candidate uchun tavsiya etilgan ishlar - uning resume skills bo'yicha"""
    if current_user.role == "employer" or current_user.role == "admin":
        raise HTTPException(
            status_code=400, detail="Bu funksiya faqat candidatelar uchun"
        )

    # Validate page and limit - handle potential string values
    try:
        page = max(1, int(page))
        limit = max(1, min(100, int(limit)))
    except (ValueError, TypeError):
        page = 1
        limit = 10

    # Foydalanuvchining resume(s)ini olish
    user_resumes = (
        db.query(models.Resume).filter(models.Resume.user_id == current_user.id).all()
    )

    if not user_resumes:
        return {
            "items": [],
            "metadata": {"total": 0, "page": page, "limit": limit, "total_pages": 0},
            "message": "Rezyume topilmadi",
        }

    # Barcha resume skilllarini yig'ish
    all_skills = set()
    for resume in user_resumes:
        if resume.skills:
            for skill in resume.skills.split(","):
                all_skills.add(skill.strip().lower())

    if not all_skills:
        return {
            "items": [],
            "metadata": {"total": 0, "page": page, "limit": limit, "total_pages": 0},
            "message": "Rezyumada skills topilmadi",
        }

    skip = (page - 1) * limit

    # Faqat active ishlar
    query = db.query(models.Job).filter(models.Job.is_active == True)

    # Already applied jobsni chiqarib tashlash
    applied_job_ids = [
        app.job_id
        for app in db.query(models.Application)
        .filter(models.Application.user_id == current_user.id)
        .all()
    ]
    if applied_job_ids:
        query = query.filter(~models.Job.id.in_(applied_job_ids))

    total = query.count()
    jobs = query.order_by(models.Job.posted_at.desc()).offset(skip).limit(limit).all()

    # Har bir job uchun match score hisoblash
    results = []
    for job in jobs:
        job_skills = set()
        if job.required_skills:
            for skill in job.required_skills.split(","):
                job_skills.add(skill.strip().lower())

        if job_skills:
            matched = all_skills.intersection(job_skills)
            match_score = (len(matched) / len(job_skills)) * 100
        else:
            match_score = 0

        results.append(
            {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "salary": job.salary,
                "employment_type": job.employment_type,
                "description": job.description,
                "requirements": job.requirements,
                "posted_at": job.posted_at.isoformat() if job.posted_at else None,
                "match_score": round(match_score, 1),
            }
        )

    # Match score bo'yicha saralash
    results.sort(key=lambda x: x.get("match_score", 0), reverse=True)

    total_pages = (total + limit - 1) // limit

    return {
        "items": results,
        "metadata": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
        },
    }
