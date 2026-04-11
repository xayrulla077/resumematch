from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api import models
from api.auth import get_current_active_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()


class SkillVerifyRequest(BaseModel):
    skill_name: str
    credential_id: Optional[str] = None
    issued_by: Optional[str] = None


class SkillVerifyResponse(BaseModel):
    id: int
    skill_name: str
    verified: bool
    badge_type: str
    issued_by: Optional[str]
    earned_at: datetime
    expires_at: Optional[datetime]

    model_config = {"from_attributes": True}


# Popular skills that can be auto-verified
AUTO_VERIFIED_SKILLS = {
    "AWS": {"badge": "gold", "issuer": "Amazon Web Services"},
    "Azure": {"badge": "gold", "issuer": "Microsoft"},
    "Google Cloud": {"badge": "gold", "issuer": "Google"},
    "Python": {"badge": "silver", "issuer": "Python Institute"},
    "JavaScript": {"badge": "silver", "issuer": "Mozilla"},
    "React": {"badge": "silver", "issuer": "Meta"},
    "Node.js": {"badge": "silver", "issuer": "OpenJS Foundation"},
    "Docker": {"badge": "gold", "issuer": "Docker"},
    "Kubernetes": {"badge": "gold", "issuer": "CNCF"},
    "SQL": {"badge": "bronze", "issuer": "Database Vendor"},
    "Machine Learning": {"badge": "gold", "issuer": "Various"},
    "Data Science": {"badge": "gold", "issuer": "Various"},
}


@router.post("/verify", response_model=SkillVerifyResponse)
async def verify_skill(
    request: SkillVerifyRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Skillni verifikatsiya qilish"""
    skill_name = request.skill_name.strip()

    # Check if skill exists in database
    existing = (
        db.query(models.UserSkill)
        .filter(
            models.UserSkill.user_id == current_user.id,
            models.UserSkill.skill_name.ilike(skill_name),
        )
        .first()
    )

    if existing:
        # Update existing skill
        existing.verified = True
        if request.credential_id:
            existing.credential_id = request.credential_id
        if request.issued_by:
            existing.issued_by = request.issued_by
        existing.earned_at = datetime.now()
        db.commit()
        db.refresh(existing)
        return existing

    # Auto-determine badge based on skill
    skill_info = AUTO_VERIFIED_SKILLS.get(skill_name, {})
    badge = skill_info.get("badge", "bronze")
    issuer = request.issued_by or skill_info.get("issuer", "Self-verified")

    # Create new skill
    new_skill = models.UserSkill(
        user_id=current_user.id,
        skill_name=skill_name,
        verified=True,
        badge_type=badge,
        issued_by=issuer,
        credential_id=request.credential_id,
        earned_at=datetime.now(),
    )

    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)

    return new_skill


@router.get("/my-skills", response_model=List[SkillVerifyResponse])
async def get_my_skills(
    verified_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Foydalanuvchining skilllari"""
    query = db.query(models.UserSkill).filter(
        models.UserSkill.user_id == current_user.id
    )

    if verified_only:
        query = query.filter(models.UserSkill.verified == True)

    skills = query.order_by(models.UserSkill.earned_at.desc()).all()
    return skills


@router.delete("/{skill_id}")
async def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Skillni o'chirish"""
    skill = (
        db.query(models.UserSkill)
        .filter(
            models.UserSkill.id == skill_id, models.UserSkill.user_id == current_user.id
        )
        .first()
    )

    if not skill:
        raise HTTPException(status_code=404, detail="Skill topilmadi")

    db.delete(skill)
    db.commit()

    return {"success": True, "message": "Skill o'chirildi"}


@router.get("/suggestions")
async def get_skill_suggestions(
    query: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Skill tavsiyalari"""
    suggestions = list(AUTO_VERIFIED_SKILLS.keys())

    if query:
        suggestions = [s for s in suggestions if query.lower() in s.lower()]

    return [
        {
            "skill": skill,
            "badge": AUTO_VERIFIED_SKILLS[skill].get("badge"),
            "issuer": AUTO_VERIFIED_SKILLS[skill].get("issuer"),
        }
        for skill in suggestions
    ]


@router.get("/badges")
async def get_badge_info():
    """Badge turlari haqida ma'lumot"""
    return {
        "badges": [
            {
                "type": "gold",
                "color": "#FFD700",
                "description": "Industry recognized certification",
            },
            {
                "type": "silver",
                "color": "#C0C0C0",
                "description": "Verified professional skill",
            },
            {
                "type": "bronze",
                "color": "#CD7F32",
                "description": "Self-reported skill",
            },
        ],
        "verified_count_bonus": {
            "5": "Bronze badge unlocked",
            "10": "Silver badge unlocked",
            "20": "Gold badge for overall profile",
        },
    }


@router.get("/leaderboard")
async def get_skills_leaderboard(
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Eng ko'p skillga ega foydalanuvchilar"""
    from sqlalchemy import func

    results = (
        db.query(
            models.User.id,
            models.User.full_name,
            models.User.profile_image,
            func.count(models.UserSkill.id).label("skill_count"),
            func.sum(
                models.case(
                    (models.UserSkill.badge_type == "gold", 3),
                    (models.UserSkill.badge_type == "silver", 2),
                    else_=1,
                )
            ).label("total_score"),
        )
        .join(models.UserSkill, models.User.id == models.UserSkill.user_id)
        .filter(models.UserSkill.verified == True)
        .group_by(models.User.id, models.User.full_name, models.User.profile_image)
        .order_by(
            func.sum(
                models.case(
                    (models.UserSkill.badge_type == "gold", 3),
                    (models.UserSkill.badge_type == "silver", 2),
                    else_=1,
                )
            ).desc()
        )
        .limit(limit)
        .all()
    )

    return [
        {
            "rank": i + 1,
            "user_id": r[0],
            "full_name": r[1] or "Anonymous",
            "profile_image": r[2],
            "skill_count": r[3],
            "total_score": r[4],
        }
        for i, r in enumerate(results)
    ]
