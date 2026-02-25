from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from sqlalchemy.orm import Session, joinedload
from api.database import get_db
from api import models, schemas
from api.auth import get_current_active_user
from datetime import datetime
from services.ai_service import analyze_resume_with_ai
import json
from utils.activity_logger import log_activity

router = APIRouter()


@router.post("/apply", response_model=schemas.ApplicationResponse)
async def apply_to_job(
    job_id: int,
    resume_id: int,
    cover_letter: str = None,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Ish joyiga ariza yuborish va AI tahlilini o'tkazish"""
    
    # Check if job exists
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Ish joyi topilmadi")
    
    # Check if resume exists and belongs to user
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume topilmadi")
    
    # Check if already applied
    existing = db.query(models.Application).filter(
        models.Application.user_id == current_user.id,
        models.Application.job_id == job_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Siz allaqachon bu ish joyiga murojaat qilgansiz")
    
    # Calculate simple match score
    match_score = calculate_match_score(resume, job)
    
    # NEW: AI Semantic Analysis
    ai_results = await analyze_resume_with_ai(
        resume_text=f"{resume.summary}\nSkills: {resume.skills}\nExp: {resume.experience}",
        job_description=f"{job.title}\n{job.description}\n{job.requirements}"
    )
    
    # Create application with AI insights
    application = models.Application(
        user_id=current_user.id,
        job_id=job_id,
        resume_id=resume_id,
        cover_letter=cover_letter,
        match_score=match_score,
        status="pending",
        ai_score=ai_results.get("score", 0.0),
        ai_strengths=json.dumps(ai_results.get("strengths", [])),
        ai_missing_skills=json.dumps(ai_results.get("missing_skills", [])),
        ai_summary=ai_results.get("summary", "")
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    
    # Log activity
    log_activity(
        db,
        current_user.id,
        "job_apply",
        f"Ishga ariza topshirildi: {job.title}",
        {"application_id": application.id, "job_id": job_id}
    )
    
    return application


@router.get("/my-applications", response_model=Dict[str, Any])
async def get_my_applications(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Foydalanuvchining barcha arizalari"""
    # Use joinedload to prevent N+1 query problem
    applications = db.query(models.Application)\
        .options(joinedload(models.Application.job))\
        .filter(models.Application.user_id == current_user.id)\
        .all()
    
    return {"success": True, "data": applications, "total": len(applications)}


@router.get("/job/{job_id}/applicants", response_model=schemas.PaginatedApplicantsResponse)
async def get_job_applicants(
    job_id: int,
    page: int = 1,
    limit: int = 20,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Ish joyiga ariza berganlar (paginatsiya bilan)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Faqat adminlar ko'ra oladi")
    
    skip = (page - 1) * limit
    
    query = db.query(models.Application).filter(models.Application.job_id == job_id)
    total = query.count()
    
    # Use joinedload to prevent N+1 queries
    applications = query\
        .options(
            joinedload(models.Application.user),
            joinedload(models.Application.resume)
        )\
        .order_by(models.Application.match_score.desc())\
        .offset(skip).limit(limit)\
        .all()
    
    results = []
    for app in applications:
        results.append({
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
            "ai_interview_data": app.ai_interview_data
        })
    
    total_pages = (total + limit - 1) // limit
    
    return {
        "items": results,
        "metadata": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    }


@router.put("/{application_id}/status", response_model=schemas.ApplicationResponse)
async def update_application_status(
    application_id: int,
    status: str,
    admin_notes: str = None,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Ariza statusini o'zgartirish (faqat admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Faqat adminlar o'zgartira oladi")
    
    application = db.query(models.Application).filter(
        models.Application.id == application_id
    ).first()
    
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
        "rejected": "Rad etildi"
    }
    
    create_notification(
        db, 
        user_id=application.user_id,
        title="Ariza holati o'zgardi",
        message=f"Sizning '{application.job.title}' ish o'rni uchun topshirgan arizangiz holati '{status_uz.get(status, status)}' ga o'zgardi.",
        n_type="status_update"
    )
    
    # Log activity
    log_activity(
        db,
        current_user.id,
        "application_status_update",
        f"Ariza statusi o'zgartirildi: {status}",
        {
            "application_id": application.id, 
            "status": status
        }
    )
    
    return application


@router.post("/{application_id}/generate-interview-questions")
async def generate_interview_questions_api(
    application_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Nomzod uchun AI dan intervyu savollarini olish"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Faqat adminlar savol generatsiya qila oladi")
    
    application = db.query(models.Application).options(
        joinedload(models.Application.resume),
        joinedload(models.Application.job)
    ).filter(models.Application.id == application_id).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Ariza topilmadi")
    
    # AI orqali savollar yaratish
    resume_text = f"Summary: {application.resume.summary}\nSkills: {application.resume.skills}"
    job_text = f"Title: {application.job.title}\nRequirements: {application.job.requirements}"
    
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
    answers: list, # List of {id: 1, answer: "..."}
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Nomzod javoblarini yuborish va AI orqali baholatish"""
    application = db.query(models.Application).options(
        joinedload(models.Application.job)
    ).filter(models.Application.id == application_id).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Ariza topilmadi")
    
    # AI orqali baholash
    from services.ai_service import evaluate_interview_answers
    evaluation = await evaluate_interview_answers(
        questions_answers=answers,
        job_requirements=application.job.requirements
    )
    
    # Natijani bazaga saqlash
    application.ai_interview_score = evaluation.get("score", 0.0)
    application.ai_interview_feedback = evaluation.get("feedback", "")
    application.ai_interview_data = json.dumps(answers, ensure_ascii=False)
    
    db.commit()
    
    return {
        "success": True,
        "score": application.ai_interview_score,
        "feedback": application.ai_interview_feedback
    }


@router.get("/notifications/count")
async def get_notifications_count(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Yangi (pending) arizalar sonini olish (faqat admin)"""
    if current_user.role != "admin":
        return {"count": 0}
        
    count = db.query(models.Application).filter(models.Application.status == "pending").count()
    return {"count": count}


def calculate_match_score(resume: models.Resume, job: models.Job) -> float:
    """Resume va Job o'rtasida matching score hisoblash"""
    score = 0.0
    
    # Skills matching
    if resume.skills and job.required_skills:
        # Split and clean skills
        resume_skills = set(s.strip().lower() for s in resume.skills.split(",") if s.strip())
        job_skills = set(s.strip().lower() for s in job.required_skills.split(",") if s.strip())
        
        if job_skills:
            matched = resume_skills.intersection(job_skills)
            skills_score = (len(matched) / len(job_skills)) * 100
            score += skills_score * 0.7  # 70% weight for skills
    
    # Job Title / Summary matching (simple keyword check)
    if resume.summary and job.title:
        title_words = set(job.title.lower().split())
        summary_lower = resume.summary.lower()
        title_matches = sum(1 for word in title_words if word in summary_lower)
        if title_words:
            title_score = (title_matches / len(title_words)) * 100
            score += title_score * 0.15  # 15% weight
            
    # Location matching (optional)
    if job.location and resume.summary: # If location mentioned in resume
        if job.location.lower() in resume.summary.lower():
            score += 10 # 10% weight
            
    # Basic completeness
    if resume.full_name and resume.email:
        score += 5  # 5% for complete contact info
    
    return round(min(score, 100), 1)
