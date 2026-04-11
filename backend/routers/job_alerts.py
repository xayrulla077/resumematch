from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from api.database import get_db
from api import models
from api.auth import get_current_active_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json

router = APIRouter()


class JobAlertPreferences(BaseModel):
    enabled: bool = True
    skills: List[str] = []
    locations: List[str] = []
    job_types: List[str] = []
    min_salary: Optional[int] = None
    notify_email: bool = True
    notify_push: bool = True


class JobAlertResponse(BaseModel):
    id: int
    user_id: int
    enabled: bool
    skills: List[str]
    locations: List[str]
    job_types: List[str]
    min_salary: Optional[int]
    notify_email: bool
    notify_push: bool

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.id,
            user_id=obj.user_id,
            enabled=obj.enabled,
            skills=json.loads(obj.skills) if obj.skills else [],
            locations=json.loads(obj.locations) if obj.locations else [],
            job_types=json.loads(obj.job_types) if obj.job_types else [],
            min_salary=obj.min_salary,
            notify_email=obj.notify_email,
            notify_push=obj.notify_push,
        )


@router.get("/preferences", response_model=JobAlertResponse)
async def get_alert_preferences(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Job alert sozlamalarini olish"""
    alert = (
        db.query(models.JobAlert)
        .filter(models.JobAlert.user_id == current_user.id)
        .first()
    )

    if not alert:
        alert = models.JobAlert(
            user_id=current_user.id,
            enabled=True,
            skills="[]",
            locations="[]",
            job_types="[]",
            notify_email=True,
            notify_push=True,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

    return JobAlertResponse.from_orm(alert)


@router.put("/preferences", response_model=JobAlertResponse)
async def update_alert_preferences(
    prefs: JobAlertPreferences,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Job alert sozlamalarini yangilash"""
    alert = (
        db.query(models.JobAlert)
        .filter(models.JobAlert.user_id == current_user.id)
        .first()
    )

    if not alert:
        alert = models.JobAlert(user_id=current_user.id)
        db.add(alert)

    alert.enabled = prefs.enabled
    alert.skills = json.dumps(prefs.skills)
    alert.locations = json.dumps(prefs.locations)
    alert.job_types = json.dumps(prefs.job_types)
    alert.min_salary = prefs.min_salary
    alert.notify_email = prefs.notify_email
    alert.notify_push = prefs.notify_push

    db.commit()
    db.refresh(alert)

    return JobAlertResponse.from_orm(alert)


@router.get("/check")
async def check_new_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Yangi vakansiyalarni tekshirish"""
    alert = (
        db.query(models.JobAlert)
        .filter(
            models.JobAlert.user_id == current_user.id, models.JobAlert.enabled == True
        )
        .first()
    )

    if not alert or not alert.enabled:
        return {"has_new": False, "jobs": []}

    skills = json.loads(alert.skills) if alert.skills else []
    locations = json.loads(alert.locations) if alert.locations else []

    query = db.query(models.Job).filter(models.Job.is_active == True)

    if skills:
        skill_filter = or_(
            *[models.Job.required_skills.ilike(f"%{s}%") for s in skills]
        )
        query = query.filter(skill_filter)

    if locations:
        loc_filter = or_(*[models.Job.location.ilike(f"%{loc}%") for loc in locations])
        query = query.filter(loc_filter)

    jobs = query.order_by(models.Job.posted_at.desc()).limit(10).all()

    return {
        "has_new": len(jobs) > 0,
        "count": len(jobs),
        "jobs": [
            {
                "id": j.id,
                "title": j.title,
                "company": j.company,
                "location": j.location,
                "salary": j.salary,
                "posted_at": j.posted_at.isoformat() if j.posted_at else None,
            }
            for j in jobs
        ],
    }


@router.post("/subscribe")
async def subscribe_to_job_alerts(
    skill: str,
    location: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Bitta skillga obuna bo'lish"""
    alert = (
        db.query(models.JobAlert)
        .filter(models.JobAlert.user_id == current_user.id)
        .first()
    )

    if not alert:
        alert = models.JobAlert(
            user_id=current_user.id,
            enabled=True,
            skills="[]",
            locations="[]",
            job_types="[]",
        )
        db.add(alert)

    skills = json.loads(alert.skills) if alert.skills else []
    locations = json.loads(alert.locations) if alert.locations else []

    if skill not in skills:
        skills.append(skill)
    if location and location not in locations:
        locations.append(location)

    alert.skills = json.dumps(skills)
    alert.locations = json.dumps(locations)
    alert.enabled = True

    db.commit()

    return {"success": True, "message": f"'{skill}' uchun job alert yoqildi"}


@router.post("/unsubscribe")
async def unsubscribe_from_alerts(
    skill: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Obunani bekor qilish"""
    alert = (
        db.query(models.JobAlert)
        .filter(models.JobAlert.user_id == current_user.id)
        .first()
    )

    if alert:
        skills = json.loads(alert.skills) if alert.skills else []
        if skill in skills:
            skills.remove(skill)
            alert.skills = json.dumps(skills)
            db.commit()

    return {"success": True, "message": f"'{skill}' uchun job alert o'chirildi"}
