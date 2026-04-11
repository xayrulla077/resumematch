from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api import models
from api.auth import get_current_active_user
from services.ai_service import get_resume_feedback
from typing import Dict, Any, List
import json

router = APIRouter()


@router.get("/career-path")
async def get_career_path(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """AI Career Path Recommendations - foydalanuvchining resume asosida"""
    # Get user's resumes
    resumes = (
        db.query(models.Resume).filter(models.Resume.user_id == current_user.id).all()
    )

    if not resumes:
        return {"message": "Resume topilmadi", "recommendations": []}

    # Get latest resume with most data
    resume = max(resumes, key=lambda r: len(r.skills or ""))

    skills = resume.skills.split(",") if resume.skills else []
    experience = resume.experience or "0"
    summary = resume.summary or ""

    # Career path recommendations based on skills
    career_paths = {
        "developer": {
            "title": "Software Developer",
            "tracks": [
                "Junior Dev",
                "Mid-level Dev",
                "Senior Dev",
                "Tech Lead",
                "Architect",
            ],
            "skills_needed": ["System Design", "CI/CD", "Testing", "Documentation"],
            "salary_range": "$30,000 - $150,000",
        },
        "data": {
            "title": "Data Professional",
            "tracks": [
                "Data Analyst",
                "Data Engineer",
                "Data Scientist",
                "ML Engineer",
                "AI Researcher",
            ],
            "skills_needed": ["SQL", "Python", "ML", "Statistics", "Visualization"],
            "salary_range": "$25,000 - $180,000",
        },
        "design": {
            "title": "Design Professional",
            "tracks": [
                "UI Designer",
                "UX Designer",
                "Product Designer",
                "Design Lead",
                "Design Director",
            ],
            "skills_needed": [
                "Figma",
                "User Research",
                "Prototyping",
                "Design Systems",
            ],
            "salary_range": "$20,000 - $120,000",
        },
        "manager": {
            "title": "Product Manager",
            "tracks": [
                "Associate PM",
                "Product Manager",
                "Senior PM",
                "Director",
                "VP Product",
            ],
            "skills_needed": [
                "Roadmapping",
                "Analytics",
                "User Research",
                "Stakeholder Management",
            ],
            "salary_range": "$40,000 - $200,000",
        },
    }

    # Determine best fit based on skills
    skill_set = set(s.strip().lower() for s in skills)

    matched_paths = []
    for key, path in career_paths.items():
        matched_skills = []
        for skill in path["skills_needed"]:
            if any(skill.lower() in s for s in skill_set):
                matched_skills.append(skill)

        matched_paths.append(
            {
                "track_type": key,
                "title": path["title"],
                "match_score": len(matched_skills) / len(path["skills_needed"]) * 100,
                "tracks": path["tracks"],
                "skills_needed": path["skills_needed"],
                "matched_skills": matched_skills,
                "salary_range": path["salary_range"],
            }
        )

    # Sort by match score
    matched_paths.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "current_level": "Entry/Mid",
        "top_recommendations": matched_paths[:3],
        "all_paths": matched_paths,
        "skill_gap_analysis": {
            "your_skills": skills[:10],
            "recommended_focus": matched_paths[0]["skills_needed"][:3]
            if matched_paths
            else [],
        },
    }


@router.get("/learning-path/{skill}")
async def get_learning_path(
    skill: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """AI Learning Path - skill o'rganish uchun tavsiyalar"""

    learning_paths = {
        "python": {
            "beginner": ["Python Basics", "Data Types", "Functions", "OOP"],
            "intermediate": ["Decorators", "Generators", "Async", "Testing"],
            "advanced": ["Performance Optimization", "Design Patterns", "Cython"],
            "resources": ["Python.org", "Real Python", "FreeCodeCamp"],
        },
        "javascript": {
            "beginner": ["JS Basics", "DOM", "ES6+", "Async"],
            "intermediate": ["React/Vue", "Node.js", "API", "Testing"],
            "advanced": ["TypeScript", "Performance", "Architecture"],
            "resources": ["MDN", "JavaScript.info", "Frontend Mentor"],
        },
        "sql": {
            "beginner": ["SELECT", "WHERE", "JOIN", "GROUP BY"],
            "intermediate": ["Subqueries", "Window Functions", "Optimization"],
            "advanced": ["Query Plans", "Indexing", "Big Data"],
            "resources": ["SQLZoo", "Mode Analytics", "PostgreSQL Docs"],
        },
        "machine_learning": {
            "beginner": ["NumPy", "Pandas", "Linear Regression", "Classification"],
            "intermediate": ["Neural Networks", "CNN", "RNN", "Scikit-learn"],
            "advanced": ["Transformers", "Reinforcement Learning", "MLOps"],
            "resources": ["Fast.ai", "Coursera ML", "Kaggle"],
        },
    }

    skill_lower = skill.lower()

    for key, path in learning_paths.items():
        if key in skill_lower:
            return {
                "skill": skill,
                "learning_path": path,
                "estimated_time": "3-6 oylar",
                "next_step": path["beginner"][0]
                if path.get("beginner")
                else "Boshlang'ich resurslarni ko'ring",
            }

    return {
        "skill": skill,
        "message": "Learning path topilmadi",
        "general_tips": [
            "Rasmiy hujjatlarni o'qing",
            "Kod yozish amaliyotini qiling",
            "Loyiha yarating",
            "Community ga qo'shiling",
        ],
    }


@router.post("/career-assessment")
async def career_assessment(
    answers: Dict[str, str],
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Career Assessment - savollar asosida career yo'nalishini aniqlash"""

    # Simple scoring based on answers
    scores = {"technical": 0, "creative": 0, "management": 0, "analytical": 0}

    for question, answer in answers.items():
        if "code" in answer.lower() or "developer" in answer.lower():
            scores["technical"] += 2
        if "design" in answer.lower() or "creative" in answer.lower():
            scores["creative"] += 2
        if "manage" in answer.lower() or "lead" in answer.lower():
            scores["management"] += 2
        if "data" in answer.lower() or "analyze" in answer.lower():
            scores["analytical"] += 2

    # Find highest score
    top_score = max(scores.values())

    careers = {
        "technical": ["Software Developer", "DevOps Engineer", "Backend Developer"],
        "creative": ["UI/UX Designer", "Product Designer", "Graphic Designer"],
        "management": ["Product Manager", "Project Manager", "Team Lead"],
        "analytical": ["Data Analyst", "Business Analyst", "ML Engineer"],
    }

    for key, score in scores.items():
        if score == top_score:
            return {
                "primary_style": key,
                "recommended_careers": careers[key],
                "score_breakdown": scores,
                "advice": f"Siz {key} yo'nalishiga moyilsiz. Bu sohada ko'proq Tajriba va ko'nikmalar oshirish tavsiya etiladi.",
            }

    return {"message": "Assessment yakunlandi", "scores": scores}
