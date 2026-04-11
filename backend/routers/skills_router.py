from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api import models
from api.auth import get_current_active_user
from typing import List
import json

router = APIRouter()


@router.post("/add")
async def add_skill(
    skill_name: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Foydalanuvchiga skill qo'shish"""
    existing = (
        db.query(models.UserSkill)
        .filter(
            models.UserSkill.user_id == current_user.id,
            models.UserSkill.skill_name.ilike(skill_name),
        )
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="Bu skill allaqachon mavjud")

    user_skill = models.UserSkill(
        user_id=current_user.id,
        skill_name=skill_name.strip(),
        verified=False,
        badge_type="none",
    )
    db.add(user_skill)
    db.commit()
    db.refresh(user_skill)

    return {
        "id": user_skill.id,
        "skill": user_skill.skill_name,
        "message": "Skill qo'shildi",
    }


@router.get("/my-skills")
async def get_my_skills(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Foydalanuvchining skilllari"""
    skills = (
        db.query(models.UserSkill)
        .filter(models.UserSkill.user_id == current_user.id)
        .all()
    )

    return {
        "skills": [
            {
                "id": s.id,
                "skill_name": s.skill_name,
                "verified": s.verified,
                "badge_type": s.badge_type,
                "issued_by": s.issued_by,
                "earned_at": s.earned_at.isoformat() if s.earned_at else None,
            }
            for s in skills
        ]
    }


@router.put("/{skill_id}/verify")
async def verify_skill(
    skill_id: int,
    badge_type: str = "bronze",
    issued_by: str = "Resume Matcher",
    credential_id: str = None,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Skillni verify qilish (admin yoki employer)"""
    user_skill = (
        db.query(models.UserSkill).filter(models.UserSkill.id == skill_id).first()
    )

    if not user_skill:
        raise HTTPException(status_code=404, detail="Skill topilmadi")

    # Faqat admin yoki employer verify qila oladi
    if current_user.role not in ["admin", "employer"]:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    user_skill.verified = True
    user_skill.badge_type = badge_type  # gold, silver, bronze
    user_skill.issued_by = issued_by
    user_skill.credential_id = credential_id
    user_skill.earned_at = models.datetime.now()

    db.commit()
    db.refresh(user_skill)

    return {
        "message": f"{user_skill.skill_name} skill {badge_type} badge bilan tasdiqlandi"
    }


@router.get("/leaderboard")
async def get_skill_leaderboard(
    skill_name: str = None, limit: int = 10, db: Session = Depends(get_db)
):
    """Skill bo'yicha eng yaxshi foydalanuvchilar"""
    query = db.query(models.UserSkill).filter(models.UserSkill.verified == True)

    if skill_name:
        query = query.filter(models.UserSkill.skill_name.ilike(f"%{skill_name}%"))

    skills = query.order_by(models.UserSkill.badge_type.desc()).limit(limit).all()

    # Group by user
    user_scores = {}
    for s in skills:
        badge_weights = {"gold": 3, "silver": 2, "bronze": 1}
        score = badge_weights.get(s.badge_type, 0)

        if s.user_id not in user_scores:
            user_scores[s.user_id] = {"user_id": s.user_id, "score": 0, "skills": []}

        user_scores[s.user_id]["score"] += score
        user_scores[s.user_id]["skills"].append(s.skill_name)

    # Sort by score
    sorted_users = sorted(user_scores.values(), key=lambda x: x["score"], reverse=True)[
        :limit
    ]

    # Get user info
    results = []
    for item in sorted_users:
        user = db.query(models.User).filter(models.User.id == item["user_id"]).first()
        if user:
            results.append(
                {
                    "user_name": user.full_name or user.username,
                    "score": item["score"],
                    "skills": item["skills"][:5],
                    "badges": db.query(models.UserSkill)
                    .filter(
                        models.UserSkill.user_id == user.id,
                        models.UserSkill.verified == True,
                    )
                    .count(),
                }
            )

    return {"leaderboard": results}


@router.get("/analytics")
async def get_skill_analytics(db: Session = Depends(get_db)):
    """Platformadagi eng mashhur skill statistikasi"""
    skills = db.query(models.UserSkill).filter(models.UserSkill.verified == True).all()

    skill_counts = {}
    for s in skills:
        name = s.skill_name.lower().strip()
        if name not in skill_counts:
            skill_counts[name] = {"name": s.skill_name, "count": 0, "verified": 0}
        skill_counts[name]["count"] += 1
        if s.verified:
            skill_counts[name]["verified"] += 1

    sorted_skills = sorted(
        skill_counts.values(), key=lambda x: x["count"], reverse=True
    )[:20]

    return {"top_skills": sorted_skills}
