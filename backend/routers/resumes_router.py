from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from typing import List, Dict, Any
import os
import re
from datetime import datetime
from sqlalchemy.orm import Session
from api.database import get_db, SessionLocal
from api import models, schemas
from api.auth import get_current_active_user
from utils.helpers import safe_filename
from services.pdf_parser import extract_text_from_pdf, parse_resume_smart
from services.ai_service import get_resume_feedback
from sqlalchemy import or_
from utils.activity_logger import log_activity
from services.pdf_generator import generate_resume_pdf
import json


router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


async def process_resume_background(resume_id: int):
    """
    Rezyumeni fonda (background) tahlil qilish uchun yordamchi funksiya.
    OCR va AI tahlilini bajaradi va natijalarni bazaga saqlaydi.
    """
    db = SessionLocal()
    try:
        resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
        if not resume:
            print(f"ERROR Background Task: Resume {resume_id} topilmadi")
            return

        # Statusni o'zgartirish
        resume.status = "processing"
        db.commit()

        # 1. Text extraction (OCR bilan)
        print(f"BACKGROUND TASK: Extracting text from {resume.file_path}")
        text = extract_text_from_pdf(resume.file_path)

        if not text or len(text.strip()) < 10:
            resume.status = "failed"
            resume.summary = "Matn ajratishda xatolik yuz berdi yoki fayl bo'sh."
            db.commit()
            print(f"BACKGROUND TASK FAILED: Text extraction failed for {resume_id}")
            return

        # 2. Gemini AI Parsing
        print(f"BACKGROUND TASK: AI Smart Parsing for {resume_id}")
        try:
            analysis = await parse_resume_smart(text)

            # Natijalarni yangilash
            resume.full_name = analysis.get("full_name", resume.full_name)
            resume.email = analysis.get("email", resume.email)
            resume.phone = analysis.get("phone", resume.phone)
            resume.skills = analysis.get("skills", resume.skills)
            resume.summary = analysis.get("summary", resume.summary)

            exp_years = analysis.get("experience_years", 0)
            resume.experience = f"{exp_years} yil"

            resume.is_analyzed = True
            resume.status = "completed"
            resume.analyzed_at = datetime.now()

            print(f"BACKGROUND TASK SUCCESS: Resume {resume_id} analyzed successfully")
        except Exception as ai_err:
            resume.status = "failed"
            resume.summary = f"AI tahlilida xatolik: {str(ai_err)}"
            print(f"BACKGROUND TASK FAILED: AI Parsing error for {resume_id}: {ai_err}")

        db.commit()
    except Exception as e:
        print(f"CRITICAL BACKGROUND ERROR: {e}")
    finally:
        db.close()


@router.post("/{resume_id}/ai-feedback")
async def get_resume_ai_feedback(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Rezyume bo'yicha Gemini AI dan professional feedback olish"""
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume topilmadi")

    if current_user.role != "admin" and resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    # Extract text again or use stored data
    text = extract_text_from_pdf(resume.file_path)

    feedback = await get_resume_feedback(text)
    return feedback


@router.post("/build")
async def build_resume(
    data: schemas.ResumeBuilderData,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Foydalanuvchi ma'lumotlaridan to'g'ridan-to'g'ri yangi PDF va Resume yozuvi yaratish
    """
    timestr = datetime.now().strftime("%Y%m%d_%H%M%S")

    clean_filename = (
        safe_filename(f"{data.full_name}_resume.pdf")
        if data.full_name
        else f"resume_{timestr}.pdf"
    )
    unique_filename = f"{current_user.id}_{timestr}_{clean_filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # 1. Generate PDF
    try:
        generate_resume_pdf(data.model_dump(), file_path)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"PDF generatsiyada xatolik: {str(e)}"
        )

    if not os.path.exists(file_path):
        raise HTTPException(status_code=500, detail="Faylni saqlab bo'lmadi")

    file_size = os.path.getsize(file_path)

    # 2. Database entry
    new_resume = models.Resume(
        user_id=current_user.id,
        file_name=unique_filename,
        file_path=file_path,
        file_size=file_size,
        is_analyzed=True,
        status="completed",
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        skills=", ".join(data.skills),
        summary=data.summary,
        experience=json.dumps(
            [e.model_dump() for e in data.experience], ensure_ascii=False
        ),
        education=json.dumps(
            [e.model_dump() for e in data.education], ensure_ascii=False
        ),
        languages=json.dumps(data.languages, ensure_ascii=False)
        if data.languages
        else "[]",
        certifications=json.dumps(
            [c.model_dump() for c in data.certifications], ensure_ascii=False
        )
        if data.certifications
        else "[]",
        projects=json.dumps([p.model_dump() for p in data.projects], ensure_ascii=False)
        if data.projects
        else "[]",
        achievements=json.dumps(
            [a.model_dump() for a in data.achievements], ensure_ascii=False
        )
        if data.achievements
        else "[]",
        linkedin=data.linkedin,
        github=data.github,
        website=data.website,
        match_score=0.0,
        analyzed_at=datetime.now(),
    )

    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    # Log activity
    log_activity(
        db,
        current_user.id,
        "resume_build",
        f"Rezyume builder ustida yaratildi: {unique_filename}",
        {"resume_id": new_resume.id, "file": unique_filename},
    )

    return {
        "success": True,
        "message": "Rezyume muvaffaqiyatli yaratildi",
        "data": {
            "id": new_resume.id,
            "file_name": new_resume.file_name,
            "status": "completed",
            "uploaded_at": new_resume.uploaded_at,
        },
    }


@router.post("/upload")
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Resume yuklash (Fonda tahlil qilinadi).
    Faqat faylni saqlaydi va tahlilni BackgroundTask ga topshiradi.
    """

    # File type validation
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Faqat PDF fayl qabul qilinadi")

    # Read file content
    content = await file.read()

    # File size validation (10MB)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400, detail="Fayl hajmi 10MB dan oshmasligi kerak"
        )

    # Sanitize filename
    clean_filename = safe_filename(file.filename)

    # Unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{current_user.id}_{timestamp}_{clean_filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Faylni saqlashda xatolik")

    # 1. Create resume record with 'pending' status
    new_resume = models.Resume(
        user_id=current_user.id,
        file_name=unique_filename,
        file_path=file_path,
        file_size=len(content),
        is_analyzed=False,
        status="pending",
        full_name=current_user.full_name or "Tayyorlanmoqda...",
        email="",
        phone="",
        skills="",
        summary="Tahlil hali boshlanmadi...",
        experience="0 yil",
        match_score=0.0,
    )

    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    # 2. Background taskni ishga tushirish
    background_tasks.add_task(process_resume_background, new_resume.id)

    # Log activity
    log_activity(
        db,
        current_user.id,
        "resume_upload",
        f"Rezyume yuklandi (Background tahlil): {unique_filename}",
        {"resume_id": new_resume.id, "file": unique_filename},
    )

    return {
        "success": True,
        "message": "Fayl qabul qilindi va tahlil boshlandi. Bir necha soniyadan so'ng sahifani yangilang.",
        "data": {
            "id": new_resume.id,
            "file_name": new_resume.file_name,
            "status": "pending",
            "uploaded_at": new_resume.uploaded_at,
        },
    }


@router.get("/", response_model=schemas.PaginatedResumesResponse)
async def get_resumes(
    page: int = 1,
    limit: int = 10,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Rezyumalarni olish (paginatsiya va qidiruv bilan)"""
    skip = (page - 1) * limit

    query = db.query(models.Resume)
    if current_user.role != "admin":
        query = query.filter(models.Resume.user_id == current_user.id)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Resume.full_name.ilike(search_filter),
                models.Resume.email.ilike(search_filter),
                models.Resume.skills.ilike(search_filter),
            )
        )

    total = query.count()
    resumes = query.offset(skip).limit(limit).all()

    results = []
    for r in resumes:
        r_data = {
            "id": r.id,
            "file_name": r.file_name,
            "file_size": r.file_size,
            "full_name": r.full_name,
            "email": r.email,
            "phone": r.phone,
            "skills": r.skills.split(", ") if r.skills else [],
            "is_analyzed": r.is_analyzed,
            "status": r.status,
            "uploaded_at": r.uploaded_at,
            "match_score": r.match_score,
        }
        results.append(r_data)

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


@router.get("/{resume_id}", response_model=schemas.ResumeResponse)
async def get_resume(resume_id: int, db: Session = Depends(get_db)):
    """Bitta rezyumeni olish"""
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume topilmadi")
    return resume


@router.get("/{resume_id}/download")
async def download_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Rezyume faylini yuklab olish"""
    from fastapi.responses import FileResponse

    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume topilmadi")

    # Admin yoki resume egasi yuklashi mumkin
    if current_user.role != "admin" and resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    if not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="Fayl topilmadi")

    return FileResponse(
        path=resume.file_path, filename=resume.file_name, media_type="application/pdf"
    )


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Rezyumeni o'chirish — faqat egasi yoki admin"""
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume topilmadi")

    # Faqat egasi yoki admin o'chira oladi
    if current_user.role != "admin" and resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    # Faylni o'chirish
    if os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except:
            pass

    db.delete(resume)
    db.commit()

    return {"message": "Resume o'chirildi", "id": resume_id}
