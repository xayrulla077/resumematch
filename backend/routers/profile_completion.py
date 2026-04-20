from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from api.database import get_db
from api import models, schemas
from api.auth import get_current_active_user
from typing import List

router = APIRouter()


@router.get("/profile-completion", response_model=schemas.ProfileCompletionResponse)
async def get_profile_completion(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Profil to'liqligini kengaytirilgan qoidalar asosida hisoblash"""

    # 1. Basic Info (10%)
    basic_fields = [current_user.full_name, current_user.phone, current_user.location]
    filled_basic = sum(1 for v in basic_fields if v)
    basic_percentage = round((filled_basic / len(basic_fields)) * 10) if basic_fields else 0

    # 2. About/Bio (10%)
    bio_percentage = 10 if current_user.bio and len(current_user.bio) > 20 else 0

    # 3. Photo (5%)
    photo_percentage = 5 if current_user.profile_image else 0

    # 4. Experience (25%)
    exp_count = db.query(models.UserExperience).filter(models.UserExperience.user_id == current_user.id).count()
    experience_percentage = min(25, exp_count * 12.5) # 1 entry = 12.5%, 2 entries = 25%

    # 5. Education (20%)
    edu_count = db.query(models.UserEducation).filter(models.UserEducation.user_id == current_user.id).count()
    education_percentage = min(20, edu_count * 20) # 1 entry = 20%

    # 6. Skills (15%)
    skills_count = db.query(models.UserSkill).filter(models.UserSkill.user_id == current_user.id).count()
    skills_percentage = min(15, skills_count * 5) # 3 skills = 15%

    # 7. Languages (10%)
    lang_count = db.query(models.UserLanguage).filter(models.UserLanguage.user_id == current_user.id).count()
    languages_percentage = min(10, lang_count * 10)

    # 8. Resume (5%)
    resume = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).first()
    resume_percentage = 5 if resume else 0

    total = (
        basic_percentage + bio_percentage + photo_percentage + 
        experience_percentage + education_percentage + 
        skills_percentage + languages_percentage + resume_percentage
    )

    # Missing fields
    missing = []
    if not current_user.full_name: missing.append({"field": "basic", "label": t("fullName", "Full Name")})
    if exp_count == 0: missing.append({"field": "experience", "label": t("experience", "Work Experience")})
    if edu_count == 0: missing.append({"field": "education", "label": t("education", "Education")})
    if skills_count < 3: missing.append({"field": "skills", "label": t("skills", "Skills")})
    if lang_count == 0: missing.append({"field": "languages", "label": t("languages", "Languages")})

    return {
        "total_percentage": int(total),
        "breakdown": {
            "basic": int(basic_percentage),
            "bio": int(bio_percentage),
            "experience": int(experience_percentage),
            "education": int(education_percentage),
            "skills": int(skills_percentage),
            "languages": int(languages_percentage),
            "resume": int(resume_percentage)
        },
        "is_complete": total >= 90,
        "missing_fields": missing,
        "next_step": missing[0] if missing else None,
    }

def t(key, default):
    # Bu yerda translation logic bo'lishi mumkin, hozircha sodda
    return default


@router.get("/profile-wizard-steps", response_model=schemas.ProfileWizardResponse)
async def get_wizard_steps(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Profile wizard uchun barcha qadamma-qadam ma'lumotlari"""

    steps = [
        {
            "id": "basic",
            "title": "Asosiy ma'lumotlar",
            "description": "Ismingiz, telefon raqamingiz va manzilingiz",
            "completed": bool(current_user.full_name and current_user.phone),
            "fields": [
                {"key": "full_name", "label": "To'liq ism", "type": "text", "filled": bool(current_user.full_name)},
                {"key": "phone", "label": "Telefon", "type": "tel", "filled": bool(current_user.phone)},
                {"key": "location", "label": "Manzil", "type": "text", "filled": bool(current_user.location)},
            ]
        },
        {
            "id": "experience",
            "title": "Ish tajribasi",
            "description": "Qayerda va qancha ishlaganingiz haqida ma'lumot",
            "completed": db.query(models.UserExperience).filter(models.UserExperience.user_id == current_user.id).count() > 0,
            "fields": []
        },
        {
            "id": "education",
            "title": "Ta'lim",
            "description": "O'qigan joyingiz va diplom darajangiz",
            "completed": db.query(models.UserEducation).filter(models.UserEducation.user_id == current_user.id).count() > 0,
            "fields": []
        },
        {
            "id": "skills",
            "title": "Ko'nikmalar",
            "description": "Siz biladigan texnologiyalar va mahoratlar",
            "completed": db.query(models.UserSkill).filter(models.UserSkill.user_id == current_user.id).count() >= 3,
            "fields": []
        },
        {
            "id": "languages",
            "title": "Tillar",
            "description": "Qaysi tillarni va qaysi darajada bilasiz?",
            "completed": db.query(models.UserLanguage).filter(models.UserLanguage.user_id == current_user.id).count() > 0,
            "fields": []
        },
        {
            "id": "resume",
            "title": "Rezyume",
            "description": "Tayyor rezyumeyingizni yuklang (PDF/DOCX)",
            "completed": db.query(models.Resume).filter(models.Resume.user_id == current_user.id).first() is not None,
            "fields": []
        }
    ]

    completed_steps = sum(1 for s in steps if s["completed"])
    progress = round((completed_steps / len(steps)) * 100)

    return {
        "steps": steps,
        "progress": progress,
        "completed_steps": completed_steps,
        "total_steps": len(steps)
    }

# POST Endpoints for saving data
@router.post("/experience", response_model=schemas.ExperienceResponse)
async def add_experience(
    exp: schemas.ExperienceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_exp = models.UserExperience(**exp.model_dump(), user_id=current_user.id)
    db.add(db_exp)
    db.commit()
    db.refresh(db_exp)
    return db_exp

@router.post("/education", response_model=schemas.EducationResponse)
async def add_education(
    edu: schemas.EducationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_edu = models.UserEducation(**edu.model_dump(), user_id=current_user.id)
    db.add(db_edu)
    db.commit()
    db.refresh(db_edu)
    return db_edu

@router.post("/languages", response_model=schemas.LanguageResponse)
async def add_language(
    lang: schemas.LanguageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_lang = models.UserLanguage(**lang.model_dump(), user_id=current_user.id)
    db.add(db_lang)
    db.commit()
    db.refresh(db_lang)
    return db_lang
