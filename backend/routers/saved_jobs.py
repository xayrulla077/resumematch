from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api import models
from api.auth import get_current_active_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()


# === Saved Jobs ===


class SavedJobCreate(BaseModel):
    job_id: int
    notes: Optional[str] = None


class SavedJobResponse(BaseModel):
    id: int
    job_id: int
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/saved-jobs")
async def save_job(
    data: SavedJobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Ishni sevimlilarga qo'shish"""
    # Check if job exists
    job = db.query(models.Job).filter(models.Job.id == data.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check if already saved
    existing = (
        db.query(models.SavedJob)
        .filter(
            models.SavedJob.user_id == current_user.id,
            models.SavedJob.job_id == data.job_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Job already saved")

    saved = models.SavedJob(
        user_id=current_user.id,
        job_id=data.job_id,
        notes=data.notes,
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)

    return {"message": "Job saved successfully", "id": saved.id}


@router.get("/saved-jobs")
async def get_saved_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Sevimli ishlar ro'yxati"""
    saved_jobs = (
        db.query(models.SavedJob)
        .filter(models.SavedJob.user_id == current_user.id)
        .order_by(models.SavedJob.created_at.desc())
        .all()
    )

    result = []
    for s in saved_jobs:
        job = db.query(models.Job).filter(models.Job.id == s.job_id).first()
        if job:
            result.append(
                {
                    "id": s.id,
                    "job": {
                        "id": job.id,
                        "title": job.title,
                        "company": job.company,
                        "location": job.location,
                        "salary": job.salary,
                        "employment_type": job.employment_type,
                        "posted_at": job.posted_at.isoformat()
                        if job.posted_at
                        else None,
                    },
                    "notes": s.notes,
                    "saved_at": s.created_at.isoformat() if s.created_at else None,
                }
            )

    return result


@router.delete("/saved-jobs/{job_id}")
async def unsave_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Ishni sevimlilardan o'chirish"""
    saved = (
        db.query(models.SavedJob)
        .filter(
            models.SavedJob.user_id == current_user.id,
            models.SavedJob.job_id == job_id,
        )
        .first()
    )

    if not saved:
        raise HTTPException(status_code=404, detail="Saved job not found")

    db.delete(saved)
    db.commit()

    return {"message": "Job removed from saved"}


@router.get("/saved-jobs/check/{job_id}")
async def check_if_saved(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Ish saqlanganmi tekshirish"""
    saved = (
        db.query(models.SavedJob)
        .filter(
            models.SavedJob.user_id == current_user.id,
            models.SavedJob.job_id == job_id,
        )
        .first()
    )
    return {"is_saved": saved is not None}


# === Company Follows ===


@router.post("/follow-company")
async def follow_company(
    company_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Kompaniyani kuzatish"""
    # Check if already following
    existing = (
        db.query(models.CompanyFollow)
        .filter(
            models.CompanyFollow.user_id == current_user.id,
            models.CompanyFollow.company_name == company_name,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already following this company")

    follow = models.CompanyFollow(
        user_id=current_user.id,
        company_name=company_name,
    )
    db.add(follow)
    db.commit()

    return {"message": f"Now following {company_name}"}


@router.get("/followed-companies")
async def get_followed_companies(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Kuzatilayotgan kompaniyalar"""
    follows = (
        db.query(models.CompanyFollow)
        .filter(models.CompanyFollow.user_id == current_user.id)
        .order_by(models.CompanyFollow.created_at.desc())
        .all()
    )

    return [
        {
            "company_name": f.company_name,
            "followed_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in follows
    ]


@router.delete("/follow-company/{company_name}")
async def unfollow_company(
    company_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Kompaniyani kuzatishni bekor qilish"""
    follow = (
        db.query(models.CompanyFollow)
        .filter(
            models.CompanyFollow.user_id == current_user.id,
            models.CompanyFollow.company_name == company_name,
        )
        .first()
    )

    if not follow:
        raise HTTPException(status_code=404, detail="Not following this company")

    db.delete(follow)
    db.commit()

    return {"message": f"Unfollowed {company_name}"}


@router.get("/followed-companies/check/{company_name}")
async def check_if_following(
    company_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Kompaniyani kuzatdimi tekshirish"""
    follow = (
        db.query(models.CompanyFollow)
        .filter(
            models.CompanyFollow.user_id == current_user.id,
            models.CompanyFollow.company_name == company_name,
        )
        .first()
    )
    return {"is_following": follow is not None}


# === AI Job Recommendations ===


@router.get("/recommendations")
async def get_recommendations(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """AI tavsiya etilgan ishlar (skill va experience asosida)"""
    # Get user skills
    user_skills = (
        db.query(models.UserSkill)
        .filter(models.UserSkill.user_id == current_user.id)
        .all()
    )

    if not user_skills:
        return {"recommendations": [], "message": "No skills added yet"}

    # Get user resume for experience
    resume = (
        db.query(models.Resume).filter(models.Resume.user_id == current_user.id).first()
    )

    # Build query for matching jobs
    from sqlalchemy import or_

    skill_names = [s.skill_name for s in user_skills]
    queries = []

    for skill in skill_names[:5]:  # Top 5 skills
        queries.append(models.Job.required_skills.ilike(f"%{skill}%"))

    if not queries:
        queries.append(models.Job.is_active == True)

    # Get active jobs not already applied for
    applied_jobs = (
        db.query(models.Application.job_id)
        .filter(models.Application.user_id == current_user.id)
        .all()
    )
    applied_ids = [a.job_id for a in applied_jobs]

    jobs_query = (
        db.query(models.Job)
        .filter(models.Job.is_active == True)
        .filter(~models.Job.id.in_(applied_ids) if applied_ids else True)
    )

    if queries:
        jobs_query = jobs_query.filter(or_(*queries))

    jobs = jobs_query.order_by(models.Job.posted_at.desc()).limit(limit).all()

    # Calculate match score for each job
    recommendations = []
    for job in jobs:
        score = 0
        job_skills = (job.required_skills or "").lower()

        # Skill match (60%)
        for skill in skill_names:
            if skill.lower() in job_skills:
                score += 60 / len(skill_names)

        # Experience match (40%)
        if resume and resume.experience:
            exp_years = 0
            try:
                import re

                match = re.search(r"(\d+)", resume.experience)
                if match:
                    exp_years = int(match.group(1))
            except:
                pass

            # Assume mid-level for now
            if "senior" in job.title.lower() and exp_years >= 5:
                score += 40
            elif "junior" in job.title.lower() and exp_years <= 2:
                score += 40
            else:
                score += 20

        recommendations.append(
            {
                "job": {
                    "id": job.id,
                    "title": job.title,
                    "company": job.company,
                    "location": job.location,
                    "salary": job.salary,
                    "employment_type": job.employment_type,
                    "required_skills": job.required_skills,
                    "posted_at": job.posted_at.isoformat() if job.posted_at else None,
                },
                "match_score": round(score, 1),
            }
        )

    # Sort by score
    recommendations.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "recommendations": recommendations[:limit],
        "based_on": skill_names,
    }
