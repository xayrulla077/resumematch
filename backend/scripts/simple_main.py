from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from routers import resumes_router, jobs_router, applications_router, analytics, admin_router, notifications
from api import auth_router
from api.database import engine, Base, get_db
from api import models
from sqlalchemy.orm import Session
from fastapi import Depends

# Database tables yaratish
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Resume Matcher API",
    description="AI-powered resume and job matching platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
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
app.include_router(auth_router.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(resumes_router.router, prefix="/api/resumes", tags=["Resumes"])
app.include_router(jobs_router.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(applications_router.router, prefix="/api/applications", tags=["Applications"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(admin_router.router, prefix="/api/admin", tags=["Admin"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])

@app.get("/")
def root():
    return {
        "message": "Resume Matcher API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "database": "sqlite",
        "message": "Backend is running successfully!"
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
        "total_matches": 0 # Hozircha 0
    }

if __name__ == "__main__":
    import uvicorn
    # reload=True ni olib tashlang
    uvicorn.run(app, host="127.0.0.1", port=8000)