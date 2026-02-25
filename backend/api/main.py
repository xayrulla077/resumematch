from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from api.database import engine, get_db, Base
from api import models

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI
app = FastAPI(
    title="Resume Matcher API",
    description="AI-powered resume and job matching platform",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # React dev server
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
    # Production URL qo'shing:
    # "https://your-frontend-domain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory
os.makedirs("uploads", exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Import routers (keyinroq yaratamiz)
# from api.routers import auth, resumes, jobs, analytics, activities
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])
# app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
# app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
# app.include_router(activities.router, prefix="/api/activities", tags=["Activities"])


@app.get("/")
async def root():
    return {
        "message": "Resume Matcher API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": "2025-01-19T12:00:00"
    }


@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get basic statistics"""
    total_resumes = db.query(models.Resume).count()
    total_jobs = db.query(models.Job).count()
    total_users = db.query(models.User).count()
    total_matches = db.query(models.Match).count()

    return {
        "total_resumes": total_resumes,
        "total_jobs": total_jobs,
        "total_users": total_users,
        "total_matches": total_matches
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )