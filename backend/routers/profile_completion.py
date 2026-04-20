from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from api.database import get_db
from api import models
from api.auth import get_current_active_user

router = APIRouter()


@router.get("/profile-completion")
async def get_profile_completion(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Profile to'liqligini hisoblash"""

    # Profile fields to check
    fields = {
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "bio": current_user.bio,
        "location": current_user.location,
        "profile_image": current_user.profile_image,
    }

    # Calculate filled fields
    filled_basic = sum(1 for v in fields.values() if v)
    total_basic = len(fields)
    basic_percentage = round((filled_basic / total_basic) * 100)

    # Social links
    social_fields = {
        "linkedin": current_user.linkedin,
        "facebook": current_user.facebook,
        "instagram": current_user.instagram,
    }
    filled_social = sum(1 for v in social_fields.values() if v)
    total_social = len(social_fields)
    social_percentage = (
        round((filled_social / total_social) * 100) if total_social > 0 else 0
    )

    # Resume check
    resume = (
        db.query(models.Resume).filter(models.Resume.user_id == current_user.id).first()
    )
    resume_percentage = 50 if resume else 0

    # Skills check
    skills = (
        db.query(models.UserSkill)
        .filter(models.UserSkill.user_id == current_user.id)
        .count()
    )
    skills_percentage = min(50, skills * 10)  # Max 50% for skills

    # Job alerts check
    job_alert = (
        db.query(models.JobAlert)
        .filter(models.JobAlert.user_id == current_user.id)
        .first()
    )
    alerts_percentage = 25 if job_alert else 0

    # Video resume check
    video = (
        db.query(models.VideoResume)
        .filter(models.VideoResume.user_id == current_user.id)
        .first()
    )
    video_percentage = 25 if video else 0

    # Total completion (weighted)
    total = (
        basic_percentage
        + social_percentage
        + resume_percentage
        + skills_percentage
        + alerts_percentage
        + video_percentage
    )
    total = min(100, total)

    # Missing fields list
    missing = []
    if not current_user.full_name:
        missing.append({"field": "full_name", "label": "Full Name", "priority": "high"})
    if not current_user.phone:
        missing.append({"field": "phone", "label": "Phone", "priority": "high"})
    if not current_user.bio:
        missing.append({"field": "bio", "label": "Bio", "priority": "medium"})
    if not current_user.location:
        missing.append({"field": "location", "label": "Location", "priority": "medium"})
    if not current_user.profile_image:
        missing.append(
            {"field": "profile_image", "label": "Profile Photo", "priority": "medium"}
        )
    if not resume:
        missing.append({"field": "resume", "label": "Resume", "priority": "high"})
    if skills == 0:
        missing.append({"field": "skills", "label": "Skills", "priority": "high"})
    if not job_alert:
        missing.append(
            {"field": "job_alerts", "label": "Job Alerts", "priority": "low"}
        )
    if not video:
        missing.append(
            {"field": "video_resume", "label": "Video Resume", "priority": "low"}
        )

    return {
        "total_percentage": total,
        "breakdown": {
            "basic_info": basic_percentage,
            "social_links": social_percentage,
            "resume": resume_percentage,
            "skills": skills_percentage,
            "job_alerts": alerts_percentage,
            "video_resume": video_percentage,
        },
        "is_complete": total >= 80,
        "missing_fields": missing,
        "next_step": missing[0] if missing else None,
    }


@router.get("/profile-wizard-steps")
async def get_wizard_steps(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Profile wizard uchun qadamma-qadam ma'lumotlari"""

    steps = [
        {
            "id": "basic",
            "title": "Basic Information",
            "description": "Your name, contact info, and location",
            "fields": [
                {
                    "key": "full_name",
                    "label": "Full Name",
                    "type": "text",
                    "filled": bool(current_user.full_name),
                },
                {
                    "key": "email",
                    "label": "Email",
                    "type": "email",
                    "filled": bool(current_user.email),
                    "readonly": True,
                },
                {
                    "key": "phone",
                    "label": "Phone",
                    "type": "tel",
                    "filled": bool(current_user.phone),
                },
                {
                    "key": "location",
                    "label": "Location",
                    "type": "text",
                    "filled": bool(current_user.location),
                },
            ],
            "completed": bool(
                current_user.full_name and current_user.phone and current_user.location
            ),
        },
        {
            "id": "about",
            "title": "About You",
            "description": "Tell employers about yourself",
            "fields": [
                {
                    "key": "bio",
                    "label": "Bio",
                    "type": "textarea",
                    "filled": bool(current_user.bio),
                },
            ],
            "completed": bool(current_user.bio),
        },
        {
            "id": "photo",
            "title": "Profile Photo",
            "description": "Add a professional photo",
            "fields": [
                {
                    "key": "profile_image",
                    "label": "Photo",
                    "type": "file",
                    "filled": bool(current_user.profile_image),
                },
            ],
            "completed": bool(current_user.profile_image),
        },
        {
            "id": "resume",
            "title": "Resume",
            "description": "Upload your resume",
            "fields": [
                {
                    "key": "resume",
                    "label": "Resume",
                    "type": "upload",
                    "has_data": db.query(models.Resume)
                    .filter(models.Resume.user_id == current_user.id)
                    .first()
                    is not None,
                },
            ],
            "completed": db.query(models.Resume)
            .filter(models.Resume.user_id == current_user.id)
            .first()
            is not None,
        },
        {
            "id": "skills",
            "title": "Skills",
            "description": "Add your skills for better matching",
            "fields": [
                {
                    "key": "skills",
                    "label": "Skills",
                    "type": "list",
                    "count": db.query(models.UserSkill)
                    .filter(models.UserSkill.user_id == current_user.id)
                    .count(),
                },
            ],
            "completed": db.query(models.UserSkill)
            .filter(models.UserSkill.user_id == current_user.id)
            .count()
            >= 3,
        },
        {
            "id": "alerts",
            "title": "Job Alerts",
            "description": "Get notified about new jobs",
            "fields": [
                {
                    "key": "job_alerts",
                    "label": "Job Alerts",
                    "type": "toggle",
                    "enabled": db.query(models.JobAlert)
                    .filter(
                        models.JobAlert.user_id == current_user.id,
                        models.JobAlert.enabled == True,
                    )
                    .first()
                    is not None,
                },
            ],
            "completed": db.query(models.JobAlert)
            .filter(models.JobAlert.user_id == current_user.id)
            .first()
            is not None,
        },
    ]

    completed_steps = sum(1 for s in steps if s["completed"])
    progress = round((completed_steps / len(steps)) * 100)

    return {
        "steps": steps,
        "progress": progress,
        "completed_steps": completed_steps,
        "total_steps": len(steps),
    }
