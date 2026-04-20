from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api import models
from api.auth import get_current_active_user
from typing import List

router = APIRouter()


@router.post("/review")
async def create_review(
    company_name: str,
    rating: int,
    title: str = None,
    pros: str = None,
    cons: str = None,
    advice: str = None,
    is_anonymous: bool = True,
    work_type: str = "full_time",
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Kompaniyaga review yozish"""
    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=400, detail="Rating 1-5 oralig'ida bo'lishi kerak"
        )

    # Check if user already reviewed this company
    existing = (
        db.query(models.CompanyReview)
        .filter(
            models.CompanyReview.company_name == company_name,
            models.CompanyReview.user_id == current_user.id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400, detail="Siz allaqachon bu kompaniyaga review yozgansiz"
        )

    review = models.CompanyReview(
        company_name=company_name,
        user_id=current_user.id,
        rating=rating,
        title=title,
        pros=pros,
        cons=cons,
        advice=advice,
        is_anonymous=is_anonymous,
        work_type=work_type,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return {
        "id": review.id,
        "message": "Review muvaffaqiyatli qo'shildi",
        "is_anonymous": is_anonymous,
    }


@router.get("/company/{company_name}")
async def get_company_reviews(company_name: str, db: Session = Depends(get_db)):
    """Kompaniya reviews"""
    reviews = (
        db.query(models.CompanyReview)
        .filter(models.CompanyReview.company_name == company_name)
        .order_by(models.CompanyReview.created_at.desc())
        .all()
    )

    total_rating = sum(r.rating for r in reviews)
    avg_rating = round(total_rating / len(reviews), 1) if reviews else 0

    return {
        "company": company_name,
        "average_rating": avg_rating,
        "total_reviews": len(reviews),
        "reviews": [
            {
                "id": r.id,
                "rating": r.rating,
                "title": r.title,
                "pros": r.pros,
                "cons": r.cons,
                "advice": r.advice,
                "work_type": r.work_type,
                "is_anonymous": r.is_anonymous,
                "user_name": "Anonim"
                if r.is_anonymous
                else (r.user.full_name or r.user.username),
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reviews
        ],
    }


@router.get("/")
async def get_all_reviews(
    search: str = None, limit: int = 50, db: Session = Depends(get_db)
):
    """Barcha korxonalarni olish (izohlar bilan birga)"""
    # 1. Barcha/Qidirilgan korxonalarni CompanyProfile dan olamiz
    query = db.query(models.CompanyProfile)
    if search:
        query = query.filter(models.CompanyProfile.company_name.ilike(f"%{search}%"))
    
    profiles = query.limit(limit).all()
    
    # 2. Izohlar statistikani olish
    results = []
    for p in profiles:
        reviews = db.query(models.CompanyReview).filter(models.CompanyReview.company_name == p.company_name).all()
        count = len(reviews)
        avg = round(sum(r.rating for r in reviews) / count, 1) if count > 0 else 0
        
        results.append({
            "company": p.company_name,
            "average_rating": avg,
            "total_reviews": count,
            "industry": p.industry,
            "logo_url": p.logo_url
        })

    # 3. Agar CompanyProfile da yo'q lekin Review yozilgan bo'lsa ularni ham qo'shamiz (eskilar uchun)
    review_companies_query = db.query(models.CompanyReview.company_name).distinct()
    if search:
        review_companies_query = review_companies_query.filter(models.CompanyReview.company_name.ilike(f"%{search}%"))
    
    review_company_names = [r[0] for r in review_companies_query.all()]
    existing_names = [r["company"] for r in results]
    
    for name in review_company_names:
        if name not in existing_names:
            reviews = db.query(models.CompanyReview).filter(models.CompanyReview.company_name == name).all()
            count = len(reviews)
            avg = round(sum(r.rating for r in reviews) / count, 1) if count > 0 else 0
            results.append({
                "company": name,
                "average_rating": avg,
                "total_reviews": count,
                "industry": "Noma'lum",
                "logo_url": None
            })

    # Sort: Eng ko'p izohli yoki eng yuqori reytingli
    results.sort(key=lambda x: (x["total_reviews"], x["average_rating"]), reverse=True)

    return {"companies": results[:limit]}


@router.get("/stats")
async def get_review_stats(db: Session = Depends(get_db)):
    """Umumiy review statistikasi"""
    total_reviews = db.query(models.CompanyReview).count()
    total_companies = db.query(models.CompanyReview.company_name).distinct().count()
    avg_rating = db.query(models.CompanyReview).all()
    overall = (
        round(sum(r.rating for r in avg_rating) / len(avg_rating), 1)
        if avg_rating
        else 0
    )

    return {
        "total_reviews": total_reviews,
        "total_companies": total_companies,
        "average_rating": overall,
    }


# Salary Insights Endpoints
@router.post("/salary/add")
async def add_salary_data(
    company: str,
    job_title: str,
    salary_min: int,
    salary_max: int,
    location: str = None,
    employment_type: str = "full_time",
    experience_level: str = "mid",
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Maosh ma'lumotlarini qo'shish"""
    salary = models.SalaryData(
        company=company,
        job_title=job_title,
        location=location,
        employment_type=employment_type,
        salary_min=salary_min,
        salary_max=salary_max,
        experience_level=experience_level,
        submission_count=1,
    )
    db.add(salary)
    db.commit()
    db.refresh(salary)

    return {"message": "Maosh ma'lumotlari qo'shildi"}


@router.get("/salary/job/{job_title}")
async def get_job_salary(job_title: str, db: Session = Depends(get_db)):
    """Loyihaviy maosh ma'lumotlari"""
    salaries = (
        db.query(models.SalaryData)
        .filter(models.SalaryData.job_title.ilike(f"%{job_title}%"))
        .all()
    )

    if not salaries:
        return {"message": "Ma'lumot topilmadi", "data": None}

    all_min = [s.salary_min for s in salaries]
    all_max = [s.salary_max for s in salaries]

    return {
        "job_title": job_title,
        "salary_min": min(all_min),
        "salary_max": max(all_max),
        "average_min": sum(all_min) // len(all_min),
        "average_max": sum(all_max) // len(all_max),
        "total_data_points": len(salaries),
        "locations": list(set(s.location for s in salaries if s.location)),
        "experience_levels": list(set(s.experience_level for s in salaries)),
    }


@router.get("/salary/company/{company}")
async def get_company_salary(company: str, db: Session = Depends(get_db)):
    """Kompaniya maosh ma'lumotlari"""
    salaries = (
        db.query(models.SalaryData)
        .filter(models.SalaryData.company.ilike(f"%{company}%"))
        .all()
    )

    if not salaries:
        return {"message": "Ma'lumot topilmadi", "data": None}

    job_salaries = {}
    for s in salaries:
        key = s.job_title
        if key not in job_salaries:
            job_salaries[key] = {"min": [], "max": []}
        job_salaries[key]["min"].append(s.salary_min)
        job_salaries[key]["max"].append(s.salary_max)

    results = []
    for job, data in job_salaries.items():
        results.append(
            {
                "job_title": job,
                "salary_min": min(data["min"]),
                "salary_max": max(data["max"]),
                "average_min": sum(data["min"]) // len(data["min"]),
                "average_max": sum(data["max"]) // len(data["max"]),
                "data_points": len(data["min"]),
            }
        )

    return {"company": company, "jobs": results}


@router.get("/salary/top")
async def get_top_salaries(limit: int = 10, db: Session = Depends(get_db)):
    """Eng yuqori maoshli kasblar"""
    salaries = db.query(models.SalaryData).all()

    job_avg = {}
    for s in salaries:
        avg = (s.salary_min + s.salary_max) / 2
        if s.job_title not in job_avg:
            job_avg[s.job_title] = {"total": 0, "count": 0}
        job_avg[s.job_title]["total"] += avg
        job_avg[s.job_title]["count"] += 1

    sorted_jobs = sorted(
        [
            (job, data["total"] / data["count"], data["count"])
            for job, data in job_avg.items()
        ],
        key=lambda x: x[1],
        reverse=True,
    )[:limit]

    return {
        "top_salaries": [
            {"job_title": job, "average_salary": round(avg), "data_points": count}
            for job, avg, count in sorted_jobs
        ]
    }
