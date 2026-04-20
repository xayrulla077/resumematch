from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from api.database import get_db
from api import models, schemas
from api.auth import get_current_active_user
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
import pandas as pd
import io
import json
from datetime import datetime, timedelta, timezone
from services.pdf_generator import generate_applicant_report_pdf

router = APIRouter()


@router.get("/overview", response_model=schemas.AnalyticsOverview)
async def get_analytics_overview(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Barcha asosiy statistikalarni olish"""

    now = datetime.now(timezone.utc)
    date_limit = now - timedelta(days=days)
    prev_date_limit = now - timedelta(days=days * 2)

    # Current period
    total_resumes = (
        db.query(models.Resume).filter(models.Resume.uploaded_at >= date_limit).count()
    )
    total_jobs = db.query(models.Job).filter(models.Job.posted_at >= date_limit).count()
    total_users = (
        db.query(models.User).filter(models.User.created_at >= date_limit).count()
    )
    total_applications = (
        db.query(models.Application)
        .filter(models.Application.applied_at >= date_limit)
        .count()
    )
    active_users = (
        db.query(models.User).filter(models.User.last_active >= date_limit).count()
    )
    avg_score = (
        db.query(func.avg(models.Application.match_score))
        .filter(models.Application.applied_at >= date_limit)
        .scalar()
        or 0.0
    )

    # Previous period for change calculation
    p_resumes = (
        db.query(models.Resume)
        .filter(
            models.Resume.uploaded_at >= prev_date_limit,
            models.Resume.uploaded_at < date_limit,
        )
        .count()
    )
    p_jobs = (
        db.query(models.Job)
        .filter(
            models.Job.posted_at >= prev_date_limit, models.Job.posted_at < date_limit
        )
        .count()
    )
    p_apps = (
        db.query(models.Application)
        .filter(
            models.Application.applied_at >= prev_date_limit,
            models.Application.applied_at < date_limit,
        )
        .count()
    )
    p_users = (
        db.query(models.User)
        .filter(
            models.User.created_at >= prev_date_limit,
            models.User.created_at < date_limit,
        )
        .count()
    )

    def calc_change(curr, prev):
        if prev == 0:
            return "+100%" if curr > 0 else "0%"
        diff = ((curr - prev) / prev) * 100
        return f"{'+' if diff >= 0 else ''}{round(diff)}%"

    changes = {
        "resumes": calc_change(total_resumes, p_resumes),
        "jobs": calc_change(total_jobs, p_jobs),
        "matches": calc_change(total_applications, p_apps),
        "users": calc_change(total_users, p_users),
    }

    return {
        "total_resumes": total_resumes,
        "total_jobs": total_jobs,
        "total_matches": total_applications,
        "total_users": total_users,
        "active_users": active_users,
        "avg_match_score": round(float(avg_score), 2),
        "changes": changes,
    }


@router.get("/match-stats", response_model=schemas.MatchStats)
async def get_match_stats(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Rezyumalarning moslik foizlari bo'yicha taqsimoti"""

    date_limit = datetime.now(timezone.utc) - timedelta(days=days)
    apps = (
        db.query(models.Application.match_score)
        .filter(models.Application.applied_at >= date_limit)
        .all()
    )

    dist = {
        "A'lo (80-100%)": 0,
        "Yaxshi (60-79%)": 0,
        "O'rtacha (40-59%)": 0,
        "Past (0-39%)": 0,
    }

    for app in apps:
        score = app.match_score
        if score >= 80:
            dist["A'lo (80-100%)"] += 1
        elif score >= 60:
            dist["Yaxshi (60-79%)"] += 1
        elif score >= 40:
            dist["O'rtacha (40-59%)"] += 1
        else:
            dist["Past (0-39%)"] += 1

    colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"]
    results = []
    for i, (name, val) in enumerate(dist.items()):
        results.append({"name": name, "value": val, "color": colors[i]})

    return {"distribution": results}


@router.get("/top-skills", response_model=List[schemas.TopSkill])
async def get_top_skills(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Eng ko'p talab qilingan ko'nikmalar"""
    # Removed admin check to allow candidates to see trends
    date_limit = datetime.now(timezone.utc) - timedelta(days=days)
    all_jobs = (
        db.query(models.Job.required_skills)
        .filter(models.Job.posted_at >= date_limit)
        .all()
    )
    skill_counts = {}

    for job in all_jobs:
        if job.required_skills:
            try:
                # Skilllar JSON formatida yoki vergul bilan ajratilgan qator bo'lishi mumkin
                skills_data = json.loads(job.required_skills)
                if isinstance(skills_data, list):
                    skills = [str(s).strip().lower() for s in skills_data if s]
                elif isinstance(skills_data, str):
                    skills = [
                        s.strip().lower() for s in skills_data.split(",") if s.strip()
                    ]
                else:
                    skills = []
            except (json.JSONDecodeError, TypeError):
                # JSON emas bo'lsa, oddiy vergul bilan ajratilgan deb qaraymiz
                skills = [
                    s.strip().lower()
                    for s in str(job.required_skills).split(",")
                    if s.strip()
                ]

            for s in skills:
                skill_counts[s] = skill_counts.get(s, 0) + 1

    top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    results = []
    total_jobs = len(all_jobs) if all_jobs else 1
    for skill, count in top_skills:
        results.append(
            {
                "skill": skill.capitalize(),
                "count": count,
                "demand": round((count / total_jobs) * 100, 1),
            }
        )

    return results


@router.get("/monthly-stats", response_model=List[schemas.MonthlyStats])
async def get_monthly_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Oylik o'sish statistikasi"""

    stats = []
    # Oxirgi 6 oyni olish
    for i in range(5, -1, -1):
        # Oyni hisoblash
        d = datetime.now(timezone.utc)
        # i oy oldingi sanani topish
        month_date = (d.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        next_month = (month_date + timedelta(days=32)).replace(day=1)

        month_name = month_date.strftime("%B")

        resumes = (
            db.query(models.Resume)
            .filter(
                models.Resume.uploaded_at >= month_date,
                models.Resume.uploaded_at < next_month,
            )
            .count()
        )
        jobs = (
            db.query(models.Job)
            .filter(
                models.Job.posted_at >= month_date, models.Job.posted_at < next_month
            )
            .count()
        )
        apps = (
            db.query(models.Application)
            .filter(
                models.Application.applied_at >= month_date,
                models.Application.applied_at < next_month,
            )
            .count()
        )

        stats.append(
            {"month": month_name, "resumes": resumes, "jobs": jobs, "matches": apps}
        )

    return stats


# NOTE: Bu route oxirda — /overview, /top-skills, /monthly-stats bilan path chalkashmasligi uchun
@router.get("/export/{job_id}")
async def export_applicants_to_excel(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Tanlangan ish joyi nomzodlarini Excel formatida yuklab olish"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Faqat adminlar eksport qila oladi")

    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Ish joyi topilmadi")

    applicants = (
        db.query(models.Application).filter(models.Application.job_id == job_id).all()
    )

    if not applicants:
        raise HTTPException(status_code=400, detail="Ushbu ishda hali nomzodlar yo'q")

    data = []
    for app in applicants:
        user = db.query(models.User).filter(models.User.id == app.user_id).first()
        data.append(
            {
                "Nomzod": user.full_name if user else "Noma'lum",
                "Email": user.email if user else "",
                "Match Score": f"{app.ai_score or app.match_score}%",
                "Status": app.status.capitalize(),
                "AI Xulosa": app.ai_summary,
                "Intervyu Ball": app.ai_interview_score,
                "Topshirilgan vaqt": app.applied_at.strftime("%Y-%m-%d %H:%M"),
            }
        )

    df = pd.DataFrame(data)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Nomzodlar")

    output.seek(0)

    headers = {
        "Content-Disposition": f'attachment; filename="applicants_{job.title.replace(" ", "_")}.xlsx"'
    }

    return StreamingResponse(
        output,
        headers=headers,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/export-resumes")
async def export_resumes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Barcha rezyumalarni Excel formatida yuklab olish"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Faqat adminlar eksport qila oladi")

    resumes = db.query(models.Resume).all()
    data = []
    for r in resumes:
        data.append(
            {
                "Fayl nomi": r.file_name,
                "Hajmi": f"{r.file_size // 1024} KB" if r.file_size else "0",
                "Nomzod": r.full_name,
                "Email": r.email,
                "Ko'nikmalar": r.skills,
                "Match Score": f"{r.match_score}%",
                "Yuklangan vaqt": r.uploaded_at.strftime("%Y-%m-%d %H:%M"),
            }
        )

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Resumes")
    output.seek(0)
    return StreamingResponse(
        output,
        headers={"Content-Disposition": 'attachment; filename="all_resumes.xlsx"'},
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/export-jobs")
async def export_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Barcha ish o'rinlarini Excel formatida yuklab olish"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Faqat adminlar eksport qila oladi")

    jobs = db.query(models.Job).all()
    data = []
    for j in jobs:
        data.append(
            {
                "Lavozim": j.title,
                "Kompaniya": j.company,
                "Manzil": j.location,
                "Maosh": j.salary,
                "Bandlik turi": j.employment_type,
                "Holati": "Faol" if j.is_active else "Nofaol",
                "Joylashtirilgan": j.posted_at.strftime("%Y-%m-%d %H:%M"),
            }
        )

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Jobs")
    output.seek(0)
    return StreamingResponse(
        output,
        headers={"Content-Disposition": 'attachment; filename="all_jobs.xlsx"'},
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/export-all")
async def export_all_data(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Barcha arizalar va natijalarni Excel formatida yuklab olish"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Faqat adminlar eksport qila oladi")

    apps = db.query(models.Application).all()
    data = []
    for app in apps:
        user = db.query(models.User).filter(models.User.id == app.user_id).first()
        job = db.query(models.Job).filter(models.Job.id == app.job_id).first()
        data.append(
            {
                "ID": app.id,
                "Nomzod": user.full_name if user else "Noma'lum",
                "Lavozim": job.title if job else "Noma'lum",
                "Match Score": f"{app.ai_score or app.match_score}%",
                "Status": app.status,
                "Suhbat Balli": app.ai_interview_score,
                "Applied At": app.applied_at.strftime("%Y-%m-%d %H:%M"),
            }
        )

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)
    return StreamingResponse(
        output,
        headers={"Content-Disposition": 'attachment; filename="full_report.xlsx"'},
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/export/{job_id}/pdf")
async def export_applicants_pdf(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Nomzodlar ro'yxatini PDF formatida yuklab olish"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Faqat adminlar eksport qila oladi")

    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Ish joyi topilmadi")

    applicants = (
        db.query(models.Application).filter(models.Application.job_id == job_id).all()
    )

    if not applicants:
        raise HTTPException(status_code=400, detail="Ushbu ishda hali nomzodlar yo'q")

    apps_data = []
    for app in applicants:
        user = db.query(models.User).filter(models.User.id == app.user_id).first()
        apps_data.append(
            {
                "name": user.full_name if user else "Noma'lum",
                "score": app.ai_score or app.match_score or 0,
                "status": app.status or "pending",
                "interview_score": app.ai_interview_score or "-",
            }
        )

    pdf_bytes = generate_applicant_report_pdf(job_title=job.title, applicants=apps_data)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        headers={
            "Content-Disposition": f'attachment; filename="applicants_{job.title.replace(" ", "_")}.pdf"'
        },
        media_type="application/pdf",
    )
