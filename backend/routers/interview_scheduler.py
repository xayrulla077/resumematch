from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from api.database import get_db
from api import models, schemas
from api.auth import get_current_active_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta, timezone

router = APIRouter()


# Schema
class InterviewSchedule(BaseModel):
    id: int
    application_id: int
    scheduled_at: datetime
    duration_minutes: int
    meeting_link: Optional[str]
    notes: Optional[str]
    status: str  # scheduled, completed, cancelled
    created_at: datetime

    model_config = {"from_attributes": True}


class InterviewScheduleCreate(BaseModel):
    application_id: int
    scheduled_at: datetime
    duration_minutes: int = 60
    notes: Optional[str] = None


class InterviewScheduleUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


@router.post("/schedule", response_model=InterviewSchedule)
async def schedule_interview(
    schedule: InterviewScheduleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Interview vaqtini belgilash"""
    if current_user.role not in ["employer", "admin"]:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    # Application ni tekshirish
    application = (
        db.query(models.Application)
        .filter(models.Application.id == schedule.application_id)
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Ariza topilmadi")

    # Job ni tekshirish
    job = db.query(models.Job).filter(models.Job.id == application.job_id).first()
    if job.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bu ish sizga tegishli emas")

    # Interview schedule yaratish
    new_schedule = models.InterviewSchedule(
        application_id=schedule.application_id,
        scheduled_at=schedule.scheduled_at,
        duration_minutes=schedule.duration_minutes,
        meeting_link=f"https://meet.resumematcher.com/interview/{schedule.application_id}",
        notes=schedule.notes,
        status="scheduled",
    )

    db.add(new_schedule)

    # Application holatini yangilash
    application.status = "interview"

    db.commit()
    db.refresh(new_schedule)

    # Send Notification for Interview Schedule
    from routers.notifications import create_notification
    create_notification(
        db,
        user_id=application.user_id,
        title="Intervyuga taklif!",
        message=f"Sizning '{job.title}' uchun topshirgan arizangiz ma'qullandi va intervyu belgilandi. Intervyu calendar bo'limida sanani tekshiring.",
        n_type="status_update",
    )

    return new_schedule


@router.get("/application/{application_id}", response_model=InterviewSchedule)
async def get_application_interview(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Birorta arizaga bog'langan interviewni olish"""
    schedule = (
        db.query(models.InterviewSchedule)
        .filter(models.InterviewSchedule.application_id == application_id)
        .first()
    )

    if not schedule:
        raise HTTPException(status_code=404, detail="Interview topilmadi")

    return schedule


@router.put("/{schedule_id}", response_model=InterviewSchedule)
async def update_interview(
    schedule_id: int,
    update: InterviewScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Interviewni yangilash"""
    schedule = (
        db.query(models.InterviewSchedule)
        .filter(models.InterviewSchedule.id == schedule_id)
        .first()
    )

    if not schedule:
        raise HTTPException(status_code=404, detail="Interview topilmadi")

    if update.scheduled_at:
        schedule.scheduled_at = update.scheduled_at
    if update.duration_minutes:
        schedule.duration_minutes = update.duration_minutes
    if update.meeting_link is not None:
        schedule.meeting_link = update.meeting_link
    if update.notes is not None:
        schedule.notes = update.notes
    if update.status:
        schedule.status = update.status

    db.commit()
    db.refresh(schedule)

    return schedule


@router.get("/my-interviews")
async def get_my_interviews(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Foydalanuvchining interviewlari"""
    applications = (
        db.query(models.Application)
        .filter(
            models.Application.user_id == current_user.id,
            models.Application.status == "interview",
        )
        .all()
    )

    result = []
    for app in applications:
        schedule = (
            db.query(models.InterviewSchedule)
            .filter(models.InterviewSchedule.application_id == app.id)
            .first()
        )

        job = db.query(models.Job).filter(models.Job.id == app.job_id).first()

        if schedule:
            result.append(
                {
                    "application_id": app.id,
                    "job_title": job.title if job else "Noma'lum",
                    "company": job.company if job else "Noma'lum",
                    "scheduled_at": schedule.scheduled_at,
                    "duration_minutes": schedule.duration_minutes,
                    "meeting_link": schedule.meeting_link,
                    "status": schedule.status,
                }
            )

    return result


@router.get("/calendar-events")
async def get_calendar_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Calendar uchun eventlar"""
    query = db.query(models.InterviewSchedule).join(models.Application)

    if current_user.role == "employer":
        jobs = (
            db.query(models.Job).filter(models.Job.creator_id == current_user.id).all()
        )
        job_ids = [j.id for j in jobs]
        applications = (
            db.query(models.Application)
            .filter(models.Application.job_id.in_(job_ids))
            .all()
        )
        app_ids = [a.id for a in applications]
        query = query.filter(models.InterviewSchedule.application_id.in_(app_ids))
    elif current_user.role == "candidate":
        query = query.filter(models.Application.user_id == current_user.id)

    schedules = query.all()

    events = []
    for schedule in schedules:
        app = (
            db.query(models.Application)
            .filter(models.Application.id == schedule.application_id)
            .first()
        )

        job = db.query(models.Job).filter(models.Job.id == app.job_id).first()
        candidate = db.query(models.User).filter(models.User.id == app.user_id).first()

        events.append(
            {
                "id": schedule.id,
                "title": f"Intervyu: {candidate.full_name if candidate else 'Nomzod'} - {job.title if job else ''}",
                "start": schedule.scheduled_at.isoformat(),
                "end": (
                    schedule.scheduled_at + timedelta(minutes=schedule.duration_minutes)
                ).isoformat(),
                "meeting_link": schedule.meeting_link,
                "status": schedule.status,
                "candidate_name": candidate.full_name if candidate else None,
                "job_title": job.title if job else None,
            }
        )

    return events
