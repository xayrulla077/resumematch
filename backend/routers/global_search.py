from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from api.database import get_db
from api import models
from api.auth import get_current_active_user
from typing import Optional

router = APIRouter()


@router.get("/search")
async def global_search(
    q: str = Query(..., min_length=2),
    type: Optional[str] = None,  # jobs, resumes, companies, users
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Global search across all content"""

    results = {"jobs": [], "resumes": [], "companies": [], "users": []}

    search_term = f"%{q}%"

    # Search Jobs
    if not type or type == "jobs":
        jobs = (
            db.query(models.Job)
            .filter(models.Job.is_active == True)
            .filter(
                (models.Job.title.ilike(search_term))
                | (models.Job.company.ilike(search_term))
                | (models.Job.description.ilike(search_term))
                | (models.Job.required_skills.ilike(search_term))
            )
            .limit(limit)
            .all()
        )
        results["jobs"] = [
            {
                "id": j.id,
                "title": j.title,
                "company": j.company,
                "location": j.location,
                "salary": j.salary,
                "employment_type": j.employment_type,
            }
            for j in jobs
        ]

    # Search Resumes
    if not type or type == "resumes":
        resumes = (
            db.query(models.Resume)
            .filter(
                (models.Resume.summary.ilike(search_term))
                | (models.Resume.skills.ilike(search_term))
                | (models.Resume.experience.ilike(search_term))
            )
            .limit(limit)
            .all()
        )
        results["resumes"] = [
            {
                "id": r.id,
                "user_id": r.user_id,
                "title": r.title or "Untitled Resume",
                "skills": r.skills[:100] if r.skills else "",
            }
            for r in resumes
        ]

    # Search Companies
    if not type or type == "companies":
        # From jobs company names
        companies = (
            db.query(models.Job.company)
            .filter(models.Job.company.ilike(search_term))
            .distinct()
            .limit(limit)
            .all()
        )
        results["companies"] = [{"name": c[0]} for c in companies]

        # Also from company profiles
        profiles = (
            db.query(models.CompanyProfile)
            .filter(models.CompanyProfile.name.ilike(search_term))
            .limit(limit)
            .all()
        )
        for p in profiles:
            if {"name": p.name} not in results["companies"]:
                results["companies"].append(
                    {"name": p.name, "description": p.description}
                )

    # Search Users
    if not type or type == "users":
        users = (
            db.query(models.User)
            .filter(
                (models.User.full_name.ilike(search_term))
                | (models.User.username.ilike(search_term))
            )
            .filter(models.User.role == "candidate")
            .limit(limit)
            .all()
        )
        results["users"] = [
            {
                "id": u.id,
                "full_name": u.full_name,
                "username": u.username,
                "location": u.location,
                "bio": u.bio[:100] if u.bio else "",
            }
            for u in users
        ]

    # Calculate total
    total = sum(len(v) for v in results.values())

    return {"query": q, "total_results": total, "results": results}


@router.get("/suggestions")
async def search_suggestions(
    q: str = Query(..., min_length=1),
    limit: int = 5,
    db: Session = Depends(get_db),
):
    """Quick search suggestions"""

    suggestions = []
    search_term = f"{q}%"

    # Job titles
    jobs = (
        db.query(models.Job.title)
        .filter(models.Job.title.ilike(search_term), models.Job.is_active == True)
        .distinct()
        .limit(limit)
        .all()
    )
    for j in jobs:
        suggestions.append({"type": "job", "value": j[0]})

    # Skills
    skills = (
        db.query(models.UserSkill.skill_name)
        .filter(models.UserSkill.skill_name.ilike(search_term))
        .distinct()
        .limit(limit)
        .all()
    )
    for s in skills:
        suggestions.append({"type": "skill", "value": s[0]})

    # Companies
    companies = (
        db.query(models.Job.company)
        .filter(models.Job.company.ilike(search_term))
        .distinct()
        .limit(limit)
        .all()
    )
    for c in companies:
        suggestions.append({"type": "company", "value": c[0]})

    return {"suggestions": suggestions[: limit * 3]}
