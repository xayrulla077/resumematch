from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Dict, Any, List
from sqlalchemy.orm import Session, joinedload
from api.database import get_db, SessionLocal
from api import models, schemas
from api.auth import get_current_active_user
from datetime import datetime
from services.ai_service import analyze_resume_with_ai
from services.matcher import calculate_hybrid_score
import json
from utils.activity_logger import log_activity

router = APIRouter()


async def process_application_ai_background(application_id: int):
    """
    Ishga ariza berilganda AI tahlilini fonda (background) bajarish.
    Semantic match score, kuchli tomonlar va yetishmayotgan ko'nikmalarni aniqlaydi.
    """
    db = SessionLocal()
    try:
        # Arizani barcha bog'liqliklari bilan olish
        application = (
            db.query(models.Application)
            .options(
                joinedload(models.Application.resume),
                joinedload(models.Application.job),
            )
            .filter(models.Application.id == application_id)
            .first()
        )

        if not application:
            print(f"ERROR Background Application AI: Ariza {application_id} topilmadi")
            return

        print(f"BACKGROUND TASK: AI Analysis for Application {application_id}")

        # Resume va Job matnlarini tayyorlash
        resume = application.resume
        job = application.job

        resume_text = f"Summary: {resume.summary}\nSkills: {resume.skills}\nExp: {resume.experience}"
        job_description = f"Title: {job.title}\nDescription: {job.description}\nRequirements: {job.requirements}"

        # AI tahlilini chaqirish
        ai_results = await analyze_resume_with_ai(
            resume_text=resume_text, job_description=job_description
        )

        # Bazadagi arizani yangilash
        application.ai_score = ai_results.get("score", 0.0)
        application.ai_strengths = json.dumps(
            ai_results.get("strengths", []), ensure_ascii=False
        )
        application.ai_missing_skills = json.dumps(
            ai_results.get("missing_skills", []), ensure_ascii=False
        )
        application.ai_summary = ai_results.get("summary", "Tahlil yakunlandi.")

        # Agar AI bali juda yuqori bo'lsa, match_score ni biroz oshirish (hybrid approach)
        if application.ai_score > 80:
            application.match_score = min(
                (application.match_score + application.ai_score) / 2, 100
            )

        db.commit()
        print(f"BACKGROUND TASK SUCCESS: Application {application_id} analyzed by AI")

    except Exception as e:
        print(f"CRITICAL ERROR in Application AI Task: {e}")
    finally:
        db.close()


@router.post("/apply", response_model=schemas.ApplicationResponse)
async def apply_to_job(
    background_tasks: BackgroundTasks,
    job_id: int,
    resume_id: int,
    cover_letter: str = None,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Ish joyiga ariza yuborish va AI tahlilini fonda o'tkazish"""

    # 1. Check if job exists
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Ish joyi topilmadi")

    # 2. Check if resume exists and belongs to user
    resume = (
        db.query(models.Resume)
        .filter(models.Resume.id == resume_id, models.Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(status_code=404, detail="Resume topilmadi")

    # 3. Check if already applied
    existing = (
        db.query(models.Application)
        .filter(
            models.Application.user_id == current_user.id,
            models.Application.job_id == job_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Siz allaqachon bu ish joyiga murojaat qilgansiz"
        )

    # 4. Hybrid match score hisoblash (Darhol natija beradi)
    match_results = calculate_hybrid_score(resume, job)

    # AI natijalari uchun bo'sh joy bilan ariza yaratish
    application = models.Application(
        user_id=current_user.id,
        job_id=job_id,
        resume_id=resume_id,
        cover_letter=cover_letter,
        match_score=match_results["overall"],
        status="pending",
        ai_score=0.0,
        ai_strengths="[]",
        ai_missing_skills="[]",
        ai_summary="AI tahlili kutilmoqda...",
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    # 5. Background taskni ishga tushirish (Semantic tahlil uchun)
    background_tasks.add_task(process_application_ai_background, application.id)

    # Log activity
    log_activity(
        db,
        current_user.id,
        "job_apply",
        f"Ishga ariza topshirildi: {job.title}",
        {"application_id": application.id, "job_id": job_id},
    )

    return application


@router.get("/my-applications", response_model=Dict[str, Any])
async def get_my_applications(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Foydalanuvchining barcha arizalari"""
    applications = (
        db.query(models.Application)
        .options(joinedload(models.Application.job))
        .filter(models.Application.user_id == current_user.id)
        .all()
    )

    results = []
    for app in applications:
        results.append(
            {
                "id": app.id,
                "job_id": app.job_id,
                "resume_id": app.resume_id,
                "status": app.status,
                "match_score": app.match_score,
                "cover_letter": app.cover_letter,
                "applied_at": app.applied_at,
                "job": {
                    "id": app.job.id,
                    "title": app.job.title,
                    "company": app.job.company,
                }
                if app.job
                else None,
            }
        )

    return {"success": True, "data": results, "total": len(results)}


@router.get(
    "/job/{job_id}/applicants", response_model=schemas.PaginatedApplicantsResponse
)
async def get_job_applicants(
    job_id: int,
    page: int = 1,
    limit: int = 20,
    status: str = None,
    min_score: float = None,
    max_score: float = None,
    sort_by: str = "match_score",
    sort_order: str = "desc",
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Ish joyiga ariza berganlar (paginatsiya va filterlar bilan)"""
    # Check if admin OR employer who created the job
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Ish joyi topilmadi")

    if current_user.role != "admin" and job.creator_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Faqat ish beruvchi yoki adminlar ko'ra oladi"
        )

    skip = (page - 1) * limit

    query = db.query(models.Application).filter(models.Application.job_id == job_id)

    # Apply filters
    if status:
        query = query.filter(models.Application.status == status)
    if min_score is not None:
        query = query.filter(models.Application.match_score >= min_score)
    if max_score is not None:
        query = query.filter(models.Application.match_score <= max_score)

    # Apply sorting
    if sort_by == "match_score":
        order_col = models.Application.match_score
    elif sort_by == "applied_at":
        order_col = models.Application.applied_at
    elif sort_by == "ai_score":
        order_col = models.Application.ai_score
    else:
        order_col = models.Application.match_score

    if sort_order == "asc":
        query = query.order_by(order_col.asc())
    else:
        query = query.order_by(order_col.desc())

    total = query.count()

    # Use joinedload to prevent N+1 queries
    applications = (
        query.options(
            joinedload(models.Application.user), joinedload(models.Application.resume)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []
    for app in applications:
        results.append(
            {
                "id": app.id,
                "applicant_name": app.user.full_name if app.user else "Noma'lum",
                "applicant_email": app.user.email if app.user else "",
                "resume_file": app.resume.file_name if app.resume else "",
                "match_score": app.match_score,
                "status": app.status,
                "applied_at": app.applied_at,
                "cover_letter": app.cover_letter,
                "ai_score": app.ai_score,
                "ai_summary": app.ai_summary,
                "ai_interview_score": app.ai_interview_score,
                "ai_interview_feedback": app.ai_interview_feedback,
                "ai_interview_data": app.ai_interview_data,
            }
        )

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


@router.put("/{application_id}/status", response_model=schemas.ApplicationResponse)
async def update_application_status(
    application_id: int,
    status: str,
    admin_notes: str = None,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Ariza statusini o'zgartirish (faqat admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Faqat adminlar o'zgartira oladi")

    application = (
        db.query(models.Application)
        .filter(models.Application.id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Ariza topilmadi")

    application.status = status
    application.admin_notes = admin_notes
    application.reviewed_at = datetime.now()

    db.commit()
    db.refresh(application)

    # Create notification for the user
    from routers.notifications import create_notification

    status_uz = {
        "pending": "Kutilmoqda",
        "screening": "Saralanmoqda",
        "interview": "Suhbatga taklif qilindi",
        "accepted": "Qabul qilindi",
        "rejected": "Rad etildi",
    }

    create_notification(
        db,
        user_id=application.user_id,
        title="Ariza holati o'zgardi",
        message=f"Sizning '{application.job.title}' ish o'rni uchun topshirgan arizangiz holati '{status_uz.get(status, status)}' ga o'zgardi.",
        n_type="status_update",
    )

    # Log activity
    log_activity(
        db,
        current_user.id,
        "application_status_update",
        f"Ariza statusi o'zgartirildi: {status}",
        {"application_id": application.id, "status": status},
    )

    return application


@router.post("/{application_id}/generate-interview-questions")
async def generate_interview_questions_api(
    application_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Nomzod uchun AI dan intervyu savollarini olish"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Faqat adminlar savol generatsiya qila oladi"
        )

    application = (
        db.query(models.Application)
        .options(
            joinedload(models.Application.resume), joinedload(models.Application.job)
        )
        .filter(models.Application.id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Ariza topilmadi")

    # AI orqali savollar yaratish
    resume_text = (
        f"Summary: {application.resume.summary}\nSkills: {application.resume.skills}"
    )
    job_text = (
        f"Title: {application.job.title}\nRequirements: {application.job.requirements}"
    )

    from services.ai_service import generate_interview_questions

    result = await generate_interview_questions(resume_text, job_text)

    # Natijani bazaga saqlash
    questions = result.get("questions", [])
    application.ai_interview_data = json.dumps(questions, ensure_ascii=False)
    db.commit()

    return {"success": True, "questions": questions}


@router.post("/{application_id}/submit-interview-answers")
async def submit_interview_answers_api(
    application_id: int,
    answers: list,  # List of {id: 1, answer: "..."}
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Nomzod javoblarini yuborish va AI orqali baholatish"""
    application = (
        db.query(models.Application)
        .options(joinedload(models.Application.job))
        .filter(models.Application.id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Ariza topilmadi")

    # AI orqali baholash
    from services.ai_service import evaluate_interview_answers

    evaluation = await evaluate_interview_answers(
        questions_answers=answers, job_requirements=application.job.requirements
    )

    # Natijani bazaga saqlash
    application.ai_interview_score = evaluation.get("score", 0.0)
    application.ai_interview_feedback = evaluation.get("feedback", "")
    application.ai_interview_data = json.dumps(answers, ensure_ascii=False)

    db.commit()

    return {
        "success": True,
        "score": application.ai_interview_score,
        "feedback": application.ai_interview_feedback,
    }


@router.get("/notifications/count")
async def get_notifications_count(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Yangi (pending) arizalar sonini olish (faqat admin)"""
    if current_user.role != "admin":
        return {"count": 0}

    count = (
        db.query(models.Application)
        .filter(models.Application.status == "pending")
        .count()
    )
    return {"count": count}
