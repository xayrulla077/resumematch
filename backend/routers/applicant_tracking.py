from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from api.database import get_db
from api import models
from api.auth import get_current_active_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

# Application pipeline statuses
PIPELINE_STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"]


class UpdatePipelineStatus(BaseModel):
    status: str
    notes: Optional[str] = None


class PipelineStage(BaseModel):
    stage: str
    applications: List[dict]
    count: int


@router.get("/pipeline")
async def get_applicant_pipeline(
    job_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Get applicant pipeline for employer's jobs"""

    # Get employer's jobs
    jobs = db.query(models.Job).filter(models.Job.user_id == current_user.id).all()

    if not jobs:
        return {"stages": [], "message": "No jobs found"}

    job_ids = [j.id for j in jobs]
    if job_id:
        job_ids = [job_id]

    # Get applications for these jobs
    applications = (
        db.query(models.Application)
        .filter(models.Application.job_id.in_(job_ids))
        .all()
    )

    # Build pipeline
    pipeline = {stage: [] for stage in PIPELINE_STAGES}

    for app in applications:
        job = db.query(models.Job).filter(models.Job.id == app.job_id).first()
        user = db.query(models.User).filter(models.User.id == app.user_id).first()
        resume = (
            db.query(models.Resume).filter(models.Resume.user_id == app.user_id).first()
        )

        # Get user skills
        skills = (
            db.query(models.UserSkill)
            .filter(models.UserSkill.user_id == app.user_id)
            .all()
        )

        app_data = {
            "id": app.id,
            "job_id": app.job_id,
            "job_title": job.title if job else "Unknown",
            "candidate": {
                "id": user.id,
                "name": user.full_name or user.username,
                "email": user.email,
                "location": user.location,
                "bio": user.bio,
            },
            "resume": {
                "id": resume.id if resume else None,
                "title": resume.title if resume else None,
            },
            "skills": [s.skill_name for s in skills],
            "status": app.status,
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
            "notes": app.admin_notes,
        }

        stage = app.status if app.status in PIPELINE_STAGES else "applied"
        pipeline[stage].append(app_data)

    # Convert to response format
    stages = []
    for stage in PIPELINE_STAGES:
        stages.append(
            {
                "stage": stage,
                "applications": pipeline[stage],
                "count": len(pipeline[stage]),
            }
        )

    return {"stages": stages}


@router.put("/pipeline/{application_id}/status")
async def update_pipeline_status(
    application_id: int,
    data: UpdatePipelineStatus,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Update application status in pipeline"""

    # Get application
    app = (
        db.query(models.Application)
        .filter(models.Application.id == application_id)
        .first()
    )

    if not app:
        return {"error": "Application not found"}

    # Verify job belongs to employer
    job = db.query(models.Job).filter(models.Job.id == app.job_id).first()
    if job.user_id != current_user.id and current_user.role != "admin":
        return {"error": "Not authorized"}

    # Update status
    old_status = app.status
    app.status = data.status

    if data.notes:
        app.admin_notes = data.notes

    db.commit()

    return {
        "message": f"Status updated from {old_status} to {data.status}",
        "application_id": application_id,
        "new_status": data.status,
    }


@router.post("/pipeline/{application_id}/notes")
async def add_pipeline_note(
    application_id: int,
    note: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Add note to application"""

    app = (
        db.query(models.Application)
        .filter(models.Application.id == application_id)
        .first()
    )

    if not app:
        return {"error": "Application not found"}

    # Verify ownership
    job = db.query(models.Job).filter(models.Job.id == app.job_id).first()
    if job.user_id != current_user.id and current_user.role != "admin":
        return {"error": "Not authorized"}

    # Append note with timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    existing_notes = app.admin_notes or ""
    new_note = f"[{timestamp}] {note}\n"
    app.admin_notes = existing_notes + new_note

    db.commit()

    return {"message": "Note added successfully"}


@router.get("/pipeline/stats")
async def get_pipeline_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Get pipeline statistics"""

    jobs = db.query(models.Job).filter(models.Job.user_id == current_user.id).all()
    job_ids = [j.id for j in jobs]

    applications = (
        db.query(models.Application)
        .filter(models.Application.job_id.in_(job_ids))
        .all()
    )

    stats = {
        "total": len(applications),
        "by_stage": {stage: 0 for stage in PIPELINE_STAGES},
        "this_week": 0,
        "this_month": 0,
    }

    from datetime import timedelta

    now = datetime.now()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    for app in applications:
        if app.status in stats["by_stage"]:
            stats["by_stage"][app.status] += 1

        if app.applied_at and app.applied_at >= week_ago:
            stats["this_week"] += 1

        if app.applied_at and app.applied_at >= month_ago:
            stats["this_month"] += 1

    return stats
