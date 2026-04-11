from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api import models, schemas
from api.auth import get_current_active_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone

router = APIRouter()


# Test Questions Schema
class TestQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_answer: int
    points: int
    category: str

    model_config = {"from_attributes": True}


class TestQuestionCreate(BaseModel):
    question: str
    options: List[str]
    correct_answer: int
    points: int = 10
    category: str = "general"


class TestAnswer(BaseModel):
    question_id: int
    answer: int  # Index of selected option


class TestSubmission(BaseModel):
    answers: List[TestAnswer]


# Pre-defined questions bank
QUESTIONS_BANK = [
    {
        "id": 1,
        "question": "Python dasturlash tilida 'list' nima?",
        "options": ["Ma'lumotlar turi", "Funktsiya", "Sikl", "Modul"],
        "correct_answer": 0,
        "points": 10,
        "category": "python",
    },
    {
        "id": 2,
        "question": "JavaScriptda 'const' kalit so'zi nima uchun ishlatiladi?",
        "options": [
            "O'zgaruvchi e'lon qilish (o'zgarmas)",
            "Funktsiya e'lon qilish",
            "Sikl yaratish",
            "Massiv yaratish",
        ],
        "correct_answer": 0,
        "points": 10,
        "category": "javascript",
    },
    {
        "id": 3,
        "question": "SQLda 'SELECT' buyrug'i nima uchun ishlatiladi?",
        "options": [
            "Ma'lumot olish",
            "Ma'lumot kiritish",
            "Ma'lumot o'chirish",
            "Ma'lumot yangilash",
        ],
        "correct_answer": 0,
        "points": 10,
        "category": "sql",
    },
    {
        "id": 4,
        "question": "Git nima?",
        "options": [
            "Version control tizimi",
            "Dasturlash tili",
            "Ma'lumotlar bazasi",
            "Web server",
        ],
        "correct_answer": 0,
        "points": 10,
        "category": "devops",
    },
    {
        "id": 5,
        "question": "REST API nima?",
        "options": [
            "Web xizmatlar arxitekturasi",
            "Ma'lumotlar bazasi",
            "Dasturlash tili",
            "Operatsion tizim",
        ],
        "correct_answer": 0,
        "points": 10,
        "category": "api",
    },
    {
        "id": 6,
        "question": "OOP (Object-Oriented Programming) da 'class' nima?",
        "options": ["Ob'ektlar shabloni", "Funktsiya", "Sikl", "O'zgaruvchi"],
        "correct_answer": 0,
        "points": 10,
        "category": "oop",
    },
    {
        "id": 7,
        "question": "React da 'useState' nima?",
        "options": ["Holat boshqaruvi hook", "Router", "API so'rov", "Styling"],
        "correct_answer": 0,
        "points": 10,
        "category": "react",
    },
    {
        "id": 8,
        "question": "Docker nima uchun ishlatiladi?",
        "options": ["Konteynerlash", "Version control", "Testlash", "Monitoring"],
        "correct_answer": 0,
        "points": 10,
        "category": "devops",
    },
    {
        "id": 9,
        "question": "Algoritm nima?",
        "options": [
            "Muammoni hal qilish qadami",
            "Dasturlash tili",
            "Ma'lumotlar tuzilmasi",
            "Operatsion tizim",
        ],
        "correct_answer": 0,
        "points": 10,
        "category": "general",
    },
    {
        "id": 10,
        "question": "API nima?",
        "options": [
            "Application Programming Interface",
            "Advanced Programming Interface",
            "Automatic Program Integration",
            "Application Process Integration",
        ],
        "correct_answer": 0,
        "points": 10,
        "category": "general",
    },
]


@router.get("/questions", response_model=List[TestQuestion])
async def get_test_questions(
    category: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """Test savollarini olish"""
    questions = [q for q in QUESTIONS_BANK]

    if category:
        questions = [q for q in questions if q["category"] == category]

    return questions[:limit]


@router.post("/submit")
async def submit_test(
    submission: TestSubmission,
    job_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Test javoblarini tekshirish"""
    # Calculate score
    correct = 0
    total_points = 0
    earned_points = 0

    for answer in submission.answers:
        question = next(
            (q for q in QUESTIONS_BANK if q["id"] == answer.question_id), None
        )
        if question:
            total_points += question["points"]
            if answer.answer == question["correct_answer"]:
                correct += 1
                earned_points += question["points"]

    score_percentage = (earned_points / total_points * 100) if total_points > 0 else 0

    result = {
        "total_questions": len(submission.answers),
        "correct_answers": correct,
        "score_percentage": round(score_percentage, 1),
        "total_points": total_points,
        "earned_points": earned_points,
        "passed": score_percentage >= 70,
    }

    # Save test attempt if job_id provided
    if job_id:
        application = (
            db.query(models.Application)
            .filter(
                models.Application.user_id == current_user.id,
                models.Application.job_id == job_id,
            )
            .first()
        )

        if application:
            test_attempt = models.TestAttempt(
                application_id=application.id,
                score=earned_points,
                max_score=total_points,
                passed=result["passed"],
                answers_data=submission.model_dump_json(),
            )
            db.add(test_attempt)
            db.commit()

    return result


@router.get("/categories")
async def get_test_categories():
    """Test kategorialarini olish"""
    categories = list(set(q["category"] for q in QUESTIONS_BANK))
    return [
        {
            "id": cat,
            "name": cat.capitalize(),
            "count": len([q for q in QUESTIONS_BANK if q["category"] == cat]),
        }
        for cat in categories
    ]


@router.get("/my-results")
async def get_my_test_results(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Foydalanuvchining test natijalari"""
    applications = (
        db.query(models.Application)
        .filter(models.Application.user_id == current_user.id)
        .all()
    )

    app_ids = [a.id for a in applications]

    if not app_ids:
        return []

    attempts = (
        db.query(models.TestAttempt)
        .filter(models.TestAttempt.application_id.in_(app_ids))
        .all()
    )

    results = []
    for attempt in attempts:
        app = (
            db.query(models.Application)
            .filter(models.Application.id == attempt.application_id)
            .first()
        )
        job = (
            db.query(models.Job).filter(models.Job.id == app.job_id).first()
            if app
            else None
        )

        results.append(
            {
                "id": attempt.id,
                "job_title": job.title if job else "Noma'lum",
                "score": attempt.score,
                "max_score": attempt.max_score,
                "percentage": round(attempt.score / attempt.max_score * 100, 1)
                if attempt.max_score > 0
                else 0,
                "passed": attempt.passed,
                "attempted_at": attempt.attempted_at.isoformat()
                if attempt.attempted_at
                else None,
            }
        )

    return results
