from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api import models
from api.auth import get_current_active_user
from typing import List
import json
from datetime import datetime

router = APIRouter()


@router.post("/job/{job_id}/test")
async def create_test(
    job_id: int,
    title: str,
    description: str = None,
    time_limit: int = 30,
    passing_score: int = 60,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Employer uchun test yaratish"""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Ish topilmadi")

    if job.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    test = models.JobTest(
        job_id=job_id,
        title=title,
        description=description,
        time_limit=time_limit,
        passing_score=passing_score,
        created_at=datetime.now(),
    )
    db.add(test)
    db.commit()
    db.refresh(test)

    return {
        "id": test.id,
        "title": test.title,
        "message": "Test muvaffaqiyatli yaratildi",
    }


@router.post("/{test_id}/questions")
async def add_question(
    test_id: int,
    question_text: str,
    question_type: str = "single",
    options: List[str] = None,
    correct_answer: str = None,
    points: int = 1,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Testga savol qo'shish"""
    test = db.query(models.JobTest).filter(models.JobTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test topilmadi")

    if test.job.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    # Get max order
    max_order = (
        db.query(models.TestQuestion)
        .filter(models.TestQuestion.test_id == test_id)
        .count()
    )

    question = models.TestQuestion(
        test_id=test_id,
        question_text=question_text,
        question_type=question_type,
        options=json.dumps(options, ensure_ascii=False) if options else None,
        correct_answer=correct_answer,
        points=points,
        order_index=max_order + 1,
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    return {"id": question.id, "message": "Savol qo'shildi"}


@router.get("/job/{job_id}/test")
async def get_job_test(
    job_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Ish uchun testni olish (savollar bilan)"""
    test = db.query(models.JobTest).filter(models.JobTest.job_id == job_id).first()
    if not test:
        return {"test": None}

    questions = (
        db.query(models.TestQuestion)
        .filter(models.TestQuestion.test_id == test.id)
        .order_by(models.TestQuestion.order_index)
        .all()
    )

    # Hide correct answers for non-creator
    question_list = []
    for q in questions:
        is_owner = (
            test.job.creator_id == current_user.id or current_user.role == "admin"
        )
        question_list.append(
            {
                "id": q.id,
                "question_text": q.question_text,
                "question_type": q.question_type,
                "options": json.loads(q.options) if q.options else [],
                "points": q.points,
                "correct_answer": q.correct_answer if is_owner else None,
            }
        )

    return {
        "test": {
            "id": test.id,
            "title": test.title,
            "description": test.description,
            "time_limit": test.time_limit,
            "passing_score": test.passing_score,
            "questions": question_list,
            "total_questions": len(question_list),
        }
    }


@router.post("/{test_id}/start")
async def start_test(
    test_id: int,
    application_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Testni boshlash"""
    test = db.query(models.JobTest).filter(models.JobTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test topilmadi")

    application = (
        db.query(models.Application)
        .filter(
            models.Application.id == application_id,
            models.Application.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Ariza topilmadi")

    # Check if already attempted
    existing = (
        db.query(models.TestAttempt)
        .filter(
            models.TestAttempt.test_id == test_id,
            models.TestAttempt.application_id == application_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400, detail="Siz allaqachon bu testni topshirgansiz"
        )

    # Create attempt
    attempt = models.TestAttempt(
        test_id=test_id,
        application_id=application_id,
        user_id=current_user.id,
        started_at=datetime.now(),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Get questions (without answers)
    questions = (
        db.query(models.TestQuestion)
        .filter(models.TestQuestion.test_id == test_id)
        .order_by(models.TestQuestion.order_index)
        .all()
    )

    return {
        "attempt_id": attempt.id,
        "test": {
            "title": test.title,
            "time_limit": test.time_limit,
            "passing_score": test.passing_score,
            "questions": [
                {
                    "id": q.id,
                    "question_text": q.question_text,
                    "question_type": q.question_type,
                    "options": json.loads(q.options) if q.options else [],
                    "points": q.points,
                }
                for q in questions
            ],
        },
    }


@router.post("/{test_id}/submit")
async def submit_test(
    test_id: int,
    attempt_id: int,
    answers: dict,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Testni topshirish va baholash"""
    attempt = (
        db.query(models.TestAttempt)
        .filter(
            models.TestAttempt.id == attempt_id,
            models.TestAttempt.test_id == test_id,
            models.TestAttempt.user_id == current_user.id,
        )
        .first()
    )

    if not attempt:
        raise HTTPException(status_code=404, detail="Topshiriq topilmadi")

    if attempt.completed_at:
        raise HTTPException(status_code=400, detail="Test allaqachon topshirilgan")

    # Get questions and check answers
    questions = (
        db.query(models.TestQuestion)
        .filter(models.TestQuestion.test_id == test_id)
        .all()
    )

    total_points = 0
    earned_points = 0

    results = []

    for q in questions:
        total_points += q.points
        user_answer = answers.get(str(q.id))

        is_correct = False
        if q.question_type == "single" or q.question_type == "multiple":
            if user_answer and user_answer.lower() == q.correct_answer.lower():
                is_correct = True
                earned_points += q.points
        elif q.question_type == "text":
            # For text answers, check if keyword exists
            if (
                user_answer
                and q.correct_answer
                and q.correct_answer.lower() in user_answer.lower()
            ):
                is_correct = True
                earned_points += q.points

        results.append(
            {
                "question_id": q.id,
                "user_answer": user_answer,
                "correct_answer": q.correct_answer,
                "is_correct": is_correct,
                "points": q.points if is_correct else 0,
            }
        )

    test = db.query(models.JobTest).filter(models.JobTest.id == test_id).first()
    score = (earned_points / total_points * 100) if total_points > 0 else 0
    passed = score >= test.passing_score

    attempt.answers = json.dumps(answers, ensure_ascii=False)
    attempt.score = score
    attempt.passed = passed
    attempt.completed_at = datetime.now()
    db.commit()

    # Update application status if passed
    if passed:
        application = (
            db.query(models.Application)
            .filter(models.Application.id == attempt.application_id)
            .first()
        )
        if application and application.status == "pending":
            application.status = "interview"
            db.commit()

    return {
        "score": round(score, 1),
        "passed": passed,
        "total_points": total_points,
        "earned_points": earned_points,
        "passing_score": test.passing_score,
        "results": results,
    }


@router.get("/attempt/{attempt_id}/result")
async def get_test_result(
    attempt_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Test natijasini olish"""
    attempt = (
        db.query(models.TestAttempt)
        .filter(
            models.TestAttempt.id == attempt_id,
            (models.TestAttempt.user_id == current_user.id)
            | (current_user.role == "admin"),
        )
        .first()
    )

    if not attempt:
        raise HTTPException(status_code=404, detail="Topshiriq topilmadi")

    test = db.query(models.JobTest).filter(models.JobTest.id == attempt.test_id).first()

    return {
        "test_title": test.title,
        "score": attempt.score,
        "passed": attempt.passed,
        "completed_at": attempt.completed_at.isoformat()
        if attempt.completed_at
        else None,
        "passing_score": test.passing_score,
    }
