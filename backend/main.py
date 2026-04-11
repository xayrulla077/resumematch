from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import json
import logging
import traceback
from datetime import datetime
from typing import Any, Dict

# Sentry error tracking (optional)
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.1,
        environment=os.getenv("ENVIRONMENT", "development"),
    )
    print("Sentry error tracking enabled")


# Structured JSON logging
class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add extra fields
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data, ensure_ascii=False)


# Setup logging
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=logging.DEBUG,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/app.log", encoding="utf-8")
    ],
)

logger = logging.getLogger(__name__)

# Rate limiter - IP manziliga asoslangan
limiter = Limiter(key_func=get_remote_address)

from routers import (
    auth_router,
    resumes_router,
    jobs_router,
    applications_router,
    analytics,
    admin_router,
    notifications,
    messages_router,
    tests_router,
    skills_router,
    reviews_router,
    career_router,
    video_router,
    map_router,
    push_router,
    best_candidates_router,
    interview_scheduler_router,
    company_router,
    online_test_router,
    resume_generator_router,
    skills_verification_router,
    job_alerts_router,
    saved_jobs_router,
)
from api.database import engine, Base, get_db
from api import models
from sqlalchemy.orm import Session
from fastapi import Depends

# Database tables yaratish
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Resume Matcher API",
    description="AI-powered resume and job matching platform",
    version="1.0.0",
)

# Rate limiter state ni qo'shish
app.state.limiter = limiter


# Rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429, content={"detail": "Ko'p so'rovlar. Keyinroq urinib ko'ring."}
    )


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_detail = traceback.format_exc()
    logger.error(f"Unhandled error: {error_detail}")
    return JSONResponse(
        status_code=500, content={"detail": "Ichki server xatoligi yuz berdi."} # Hid traceback from client
    )

# CORS - faqat ruxsat berilgan originlar
CORS_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:3000,http://127.0.0.1:8000,http://localhost:8000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Create uploads directory
os.makedirs("uploads", exist_ok=True)

# Mount static files
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(resumes_router, prefix="/api/resumes", tags=["Resumes"])
app.include_router(jobs_router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(
    applications_router, prefix="/api/applications", tags=["Applications"]
)
app.include_router(analytics, prefix="/api/analytics", tags=["Analytics"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(notifications, prefix="/api/notifications", tags=["Notifications"])
app.include_router(messages_router, prefix="/api/messages", tags=["Messages"])
app.include_router(tests_router, prefix="/api/tests", tags=["Tests"])
app.include_router(skills_router, prefix="/api/skills", tags=["Skills"])
app.include_router(reviews_router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(career_router, prefix="/api/career", tags=["Career"])
app.include_router(video_router, prefix="/api/videos", tags=["Videos"])
app.include_router(map_router, prefix="/api/map", tags=["Map"])
app.include_router(push_router, prefix="/api/push", tags=["Push"])
app.include_router(
    best_candidates_router, prefix="/api/candidates", tags=["BestCandidates"]
)
app.include_router(
    interview_scheduler_router, prefix="/api/interviews", tags=["Interviews"]
)
app.include_router(company_router, prefix="/api/companies", tags=["Companies"])
app.include_router(online_test_router, prefix="/api/online-tests", tags=["OnlineTests"])
app.include_router(
    resume_generator_router, prefix="/api/resumes", tags=["ResumeGenerator"]
)
app.include_router(
    skills_verification_router,
    prefix="/api/skills/verification",
    tags=["SkillsVerification"],
)
app.include_router(job_alerts_router, prefix="/api/job-alerts", tags=["JobAlerts"])
app.include_router(saved_jobs_router, prefix="/api/user", tags=["SavedJobs"])


@app.get("/")
def root():
    return {"message": "Resume Matcher API", "version": "1.0.0", "status": "running"}


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    # Database connection check
    try:
        from sqlalchemy import text

        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    import psutil

    return {
        "status": "healthy",
        "database": db_status,
        "server_time": datetime.now().isoformat(),
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
    }


@app.get("/api/stats")
def stats(db: Session = Depends(get_db)):
    total_resumes = db.query(models.Resume).count()
    total_jobs = db.query(models.Job).count()
    total_users = db.query(models.User).count()

    return {
        "total_resumes": total_resumes,
        "total_jobs": total_jobs,
        "total_users": total_users,
        "total_matches": 0,  # Hozircha 0
    }


if __name__ == "__main__":
    import uvicorn

    # reload=True ni olib tashlang
    uvicorn.run(app, host="127.0.0.1", port=8000)
