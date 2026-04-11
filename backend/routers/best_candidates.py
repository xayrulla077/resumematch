from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from api.database import get_db
from api import models
from api.auth import get_current_active_user
from typing import Optional, List
from pydantic import BaseModel

router = APIRouter()


class CandidateRating(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    bio: Optional[str]
    profile_image: Optional[str]

    # Ratings
    skills_score: float
    education_score: float
    experience_score: float
    total_score: float

    # Details
    skills: Optional[str]
    education: Optional[str]
    experience_years: int
    resume_count: int

    model_config = {"from_attributes": True}


def calculate_skills_score(resume) -> float:
    """Skilllar bo'yicha ball hisoblash"""
    if not resume.skills:
        return 0.0

    skills = [s.strip().lower() for s in str(resume.skills).split(",") if s.strip()]

    # Ko'proq skills = yuqori ball
    base_score = min(len(skills) * 5, 40)  # Max 40 ball

    # Dasturlash tillarini aniqlash
    programming_langs = [
        "python",
        "javascript",
        "java",
        "c++",
        "c#",
        "php",
        "ruby",
        "go",
        "rust",
        "swift",
        "kotlin",
        "typescript",
        "scala",
        "r",
        "matlab",
        "sql",
        "html",
        "css",
        "react",
        "angular",
        "vue",
        "node",
        "django",
        "flask",
        "spring",
        "laravel",
        "express",
        "nextjs",
        "nuxt",
    ]

    known_langs = [s for s in skills if any(lang in s for lang in programming_langs)]
    lang_bonus = min(len(known_langs) * 3, 30)  # Max 30 ball

    # AI/ML skills
    ai_ml_skills = [
        "ai",
        "ml",
        "machine learning",
        "deep learning",
        "tensorflow",
        "pytorch",
        "nlp",
    ]
    ai_bonus = min(
        sum(1 for s in skills if any(ai in s for ai in ai_ml_skills)) * 5, 15
    )

    # Cloud/DevOps
    devops_skills = [
        "aws",
        "azure",
        "gcp",
        "docker",
        "kubernetes",
        "jenkins",
        "ci/cd",
        "devops",
    ]
    devops_bonus = min(
        sum(1 for s in skills if any(d in s for d in devops_skills)) * 4, 15
    )

    return min(base_score + lang_bonus + ai_bonus + devops_bonus, 100)


def calculate_education_score(resume) -> float:
    """Ta'lim bo'yicha ball hisoblash"""
    if not resume.education:
        return 0.0

    education = str(resume.education).lower()
    score = 0

    # PhD
    if "phd" in education or "doktor" in education:
        score += 40
    # Master's
    elif "master" in education or "magistr" in education:
        score += 30
    # Bachelor's
    elif "bachelor" in education or "bakalavr" in education:
        score += 20
    # Associate/Diploma
    elif "associate" in education or "diplom" in education:
        score += 10

    # University nufuzi (famous universities)
    top_universities = [
        "stanford",
        "mit",
        "harvard",
        "oxford",
        "cambridge",
        "berkeley",
        "caltech",
        "princeton",
        "yale",
        "columbia",
        "tuit",
        "tashkent",
        "inha",
        "westminster",
        "turkistan",
    ]
    if any(uni in education for uni in top_universities):
        score += 15

    return min(score, 50)


def calculate_experience_score(resume) -> float:
    """Tajriba bo'yicha ball hisoblash"""
    exp_years = resume.experience_years or 0

    # Yil bo'yicha ball
    if exp_years >= 10:
        score = 40
    elif exp_years >= 7:
        score = 35
    elif exp_years >= 5:
        score = 30
    elif exp_years >= 3:
        score = 20
    elif exp_years >= 1:
        score = 10
    else:
        score = 0

    # Resume has work experience details
    if resume.experience and len(str(resume.experience)) > 50:
        score += 10

    return min(score, 50)


@router.get("/best-candidates", response_model=List[CandidateRating])
async def get_best_candidates(
    min_score: float = Query(0, ge=0, le=100, description="Minimal moslik balli"),
    skills_filter: Optional[str] = Query(None, description="Skill bo'yicha filtr"),
    limit: int = Query(20, ge=1, le=100, description="Natija soni"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Eng yaxshi nomzodlarni reyting bo'yicha olish (employer va admin uchun)"""
    if current_user.role not in ["employer", "admin"]:
        raise HTTPException(status_code=403, detail="Ruxsat berilmagan")

    # Barcha resumelarni olish
    resumes = db.query(models.Resume).filter(models.Resume.is_analyzed == True).all()

    candidates_data = []

    for resume in resumes:
        # Foydalanuvchini olish
        user = db.query(models.User).filter(models.User.id == resume.user_id).first()
        if not user:
            continue

        # Ballarni hisoblash
        skills_score = calculate_skills_score(resume)
        education_score = calculate_education_score(resume)
        experience_score = calculate_experience_score(resume)

        # Umumiy ball (og'irliklar bilan)
        total_score = (
            skills_score * 0.40  # Skills: 40%
            + education_score * 0.25  # Education: 25%
            + experience_score * 0.35  # Experience: 35%
        )

        # Skill filter
        if skills_filter:
            user_skills = str(resume.skills or "").lower()
            if skills_filter.lower() not in user_skills:
                continue

        # Minimal ball filter
        if total_score < min_score:
            continue

        # User uchun resumelar soni
        resume_count = (
            db.query(models.Resume).filter(models.Resume.user_id == user.id).count()
        )

        candidates_data.append(
            {
                "id": user.id,
                "full_name": user.full_name or "Noma'lum",
                "email": user.email,
                "phone": user.phone,
                "bio": user.bio,
                "profile_image": user.profile_image,
                "skills_score": round(skills_score, 1),
                "education_score": round(education_score, 1),
                "experience_score": round(experience_score, 1),
                "total_score": round(total_score, 1),
                "skills": resume.skills,
                "education": resume.education,
                "experience_years": resume.experience_years or 0,
                "resume_count": resume_count,
            }
        )

    # Ball bo'yicha tartiblash (passing)
    candidates_data.sort(key=lambda x: x["total_score"], reverse=True)

    return candidates_data[:limit]


@router.get("/candidate/{user_id}", response_model=CandidateRating)
async def get_candidate_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Bitta nomzodning to'liq ma'lumotlari"""
    if current_user.role not in ["employer", "admin"]:
        raise HTTPException(status_code=403, detail="Ruxsat berilmagan")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    # Eng yangi resumeyi
    resume = (
        db.query(models.Resume)
        .filter(models.Resume.user_id == user_id, models.Resume.is_analyzed == True)
        .order_by(models.Resume.uploaded_at.desc())
        .first()
    )

    if not resume:
        raise HTTPException(status_code=404, detail="Analiz qilingan resume topilmadi")

    skills_score = calculate_skills_score(resume)
    education_score = calculate_education_score(resume)
    experience_score = calculate_experience_score(resume)
    total_score = skills_score * 0.40 + education_score * 0.25 + experience_score * 0.35

    resume_count = (
        db.query(models.Resume).filter(models.Resume.user_id == user_id).count()
    )

    return {
        "id": user.id,
        "full_name": user.full_name or "Noma'lum",
        "email": user.email,
        "phone": user.phone,
        "bio": user.bio,
        "profile_image": user.profile_image,
        "skills_score": round(skills_score, 1),
        "education_score": round(education_score, 1),
        "experience_score": round(experience_score, 1),
        "total_score": round(total_score, 1),
        "skills": resume.skills,
        "education": resume.education,
        "experience_years": resume.experience_years or 0,
        "resume_count": resume_count,
    }
