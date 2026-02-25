from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List, Dict, Any
import os
import re
from datetime import datetime
from sqlalchemy.orm import Session
from api.database import get_db
from api import models, schemas
from api.auth import get_current_active_user
from utils.helpers import safe_filename
from services.pdf_parser import extract_text_from_pdf, parse_resume_smart
from services.ai_service import get_resume_feedback
from sqlalchemy import or_
from utils.activity_logger import log_activity

router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/{resume_id}/ai-feedback")
async def get_resume_ai_feedback(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
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


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Resume yuklash va tahlil qilish (OCR + Gemini Smart Parsing)"""

    # File type validation
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Faqat PDF fayl qabul qilinadi")

    # Read file content
    content = await file.read()
    
    # File size validation (10MB)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fayl hajmi 10MB dan oshmasligi kerak")

    # Sanitize filename for security
    clean_filename = safe_filename(file.filename)
    
    # Create unique filename to prevent overwrites
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{current_user.id}_{timestamp}_{clean_filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, 'wb') as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Faylni saqlashda xatolik")

    # 1. Extract text from PDF (Using OCR if needed)
    text = extract_text_from_pdf(file_path)

    if not text or len(text.strip()) < 10:
        # Clean up the file if extraction failed
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail="PDF dan matn ajratib bo'lmadi yoki fayl bo'sh")

    # 2. Analyze resume with Gemini Smart Parsing
    analysis = await parse_resume_smart(text)

    # Experience stringni saqlashga moslash
    exp_years = analysis.get("experience_years", 0)
    
    # Create resume record
    new_resume = models.Resume(
        user_id=current_user.id,
        file_name=unique_filename,
        file_path=file_path,
        file_size=len(content),
        is_analyzed=True,
        analyzed_at=datetime.now(),
        full_name=analysis.get("full_name", current_user.full_name),
        email=analysis.get("email", ""),
        phone=analysis.get("phone", ""),
        skills=analysis.get("skills", ""),
        summary=analysis.get("summary", ""),
        experience=f"{exp_years} yil",
        match_score=0.0
    )
    
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    # Log activity
    log_activity(
        db,
        current_user.id,
        "resume_upload",
        f"Yangi rezyume yuklandi: {new_resume.full_name}",
        {"resume_id": new_resume.id, "file": unique_filename}
    )

    return {
        "success": True,
        "message": "Resume muvaffaqiyatli yuklandi va tahlil qilindi",
        "data": {
            "id": new_resume.id,
            "file_name": new_resume.file_name,
            "full_name": new_resume.full_name,
            "email": new_resume.email,
            "skills": new_resume.skills,
            "uploaded_at": new_resume.uploaded_at
        }
    }


@router.get("/", response_model=schemas.PaginatedResumesResponse)
async def get_resumes(
    page: int = 1,
    limit: int = 10,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
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
                models.Resume.skills.ilike(search_filter)
            )
        )
    
    total = query.count()
    resumes = query.offset(skip).limit(limit).all()
    
    results = []
    for r in resumes:
        r_data = {
            "id": r.id,
            "file_name": r.file_name,
            "full_name": r.full_name,
            "email": r.email,
            "phone": r.phone,
            "skills": r.skills.split(", ") if r.skills else [],
            "is_analyzed": r.is_analyzed,
            "uploaded_at": r.uploaded_at,
            "match_score": r.match_score
        }
        results.append(r_data)
        
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


@router.get("/{resume_id}", response_model=schemas.ResumeResponse)
async def get_resume(resume_id: int, db: Session = Depends(get_db)):
    """Bitta rezyumeni olish"""
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume topilmadi")
    return resume


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
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