from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text,
    ForeignKey,
    Boolean,
    Index,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from api.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    phone = Column(String)
    bio = Column(Text)
    profile_image = Column(String)  # Image URL or path
    role = Column(String, default="candidate", index=True)  # admin, employer, candidate
    company_name = Column(String)  # For employers
    company_logo = Column(String)  # For employers
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_active = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Security fields
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    resumes = relationship("Resume", back_populates="user")
    jobs = relationship("Job", back_populates="creator")
    notifications = relationship("Notification", back_populates="user")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)

    # Extracted data
    full_name = Column(String)
    email = Column(String)
    phone = Column(String)
    skills = Column(Text)  # JSON string
    experience = Column(Text)  # JSON string
    education = Column(Text)  # JSON string
    languages = Column(Text)  # JSON string
    summary = Column(Text)

    # Additional fields
    certifications = Column(Text)  # Certificates
    projects = Column(Text)  # Projects
    achievements = Column(Text)  # Achievements/Awards
    linkedin = Column(String)  # LinkedIn URL
    github = Column(String)  # GitHub URL
    website = Column(String)  # Personal website

    # Analysis
    is_analyzed = Column(Boolean, default=False)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    match_score = Column(Float, default=0.0)

    # AI Analysis
    ai_strengths = Column(Text)
    ai_missing_skills = Column(Text)
    ai_summary = Column(Text)

    # Metadata
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    analyzed_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="resumes")
    matches = relationship("Match", back_populates="resume")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), index=True)

    title = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False, index=True)
    location = Column(String, index=True)
    salary = Column(String)
    employment_type = Column(
        String, index=True
    )  # full_time, part_time, contract, internship

    description = Column(Text)
    requirements = Column(Text)  # JSON string or plain text

    # Extracted requirements for matching
    required_skills = Column(Text)  # JSON string
    experience_level = Column(String, index=True)

    # Metadata
    is_active = Column(Boolean, default=True, index=True)
    posted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    creator = relationship("User", back_populates="jobs")
    matches = relationship("Match", back_populates="job")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))

    # Match scores
    overall_score = Column(Float, default=0.0)
    skills_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)

    # Details
    matched_skills = Column(Text)  # JSON string
    missing_skills = Column(Text)  # JSON string

    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    resume = relationship("Resume", back_populates="matches")
    job = relationship("Job", back_populates="matches")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    action_type = Column(String)  # upload, analysis, job_post, match, etc.
    action_description = Column(String)
    details = Column(Text)  # JSON string

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship
    user = relationship("User")


class Application(Base):
    """Nomzodning ish joyiga arizasi"""

    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))

    status = Column(
        String, default="pending", index=True
    )  # pending, reviewed, accepted, rejected
    match_score = Column(Float, default=0.0)  # Matching score

    cover_letter = Column(Text)  # Optional cover letter
    admin_notes = Column(Text)  # Admin's notes

    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime)

    # AI Match insights
    ai_score = Column(Float, default=0.0)
    ai_strengths = Column(Text)  # JSON string
    ai_missing_skills = Column(Text)  # JSON string
    ai_summary = Column(Text)

    # AI Interview fields
    ai_interview_data = Column(Text)  # JSON string storing questions/answers
    ai_interview_score = Column(Float, default=0.0)
    ai_interview_feedback = Column(Text)

    # Relationships
    user = relationship("User")
    job = relationship("Job")
    resume = relationship("Resume")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String)  # status_update, welcome, info

    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship
    user = relationship("User", back_populates="notifications")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)

    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    application = relationship("Application")


class JobTest(Base):
    __tablename__ = "job_tests"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    time_limit = Column(Integer, default=30)  # minutes
    passing_score = Column(Integer, default=60)  # percentage
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    job = relationship("Job")
    questions = relationship(
        "TestQuestion", back_populates="test", cascade="all, delete-orphan"
    )


class TestQuestion(Base):
    __tablename__ = "test_questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("job_tests.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default="single")  # single, multiple, text
    options = Column(Text)  # JSON string for choices
    correct_answer = Column(Text)  # JSON string
    points = Column(Integer, default=1)
    order_index = Column(Integer, default=0)

    # Relationships
    test = relationship("JobTest", back_populates="questions")


class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("job_tests.id"), nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    answers = Column(Text)  # JSON string
    score = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime)

    # Relationships
    test = relationship("JobTest")
    application = relationship("Application")


class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_name = Column(String, nullable=False)
    verified = Column(Boolean, default=False)
    badge_type = Column(String, default="none")  # none, gold, silver, bronze
    issued_by = Column(String)  # Company or platform
    earned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime)
    credential_id = Column(String)  # External credential ID

    user = relationship("User")


class InterviewSchedule(Base):
    """Interview scheduling"""

    __tablename__ = "interview_schedules"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)

    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    meeting_link = Column(String)
    notes = Column(Text)
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    application = relationship("Application")


class CompanyProfile(Base):
    """Employer company profile"""

    __tablename__ = "company_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Employer user

    company_name = Column(String, nullable=False)
    industry = Column(String)
    company_size = Column(String)  # 1-10, 11-50, 51-200, 201-500, 500+
    description = Column(Text)
    website = Column(String)
    location = Column(String)
    founded_year = Column(Integer)

    logo_url = Column(String)
    cover_image = Column(String)

    # Social links
    linkedin = Column(String)
    facebook = Column(String)
    instagram = Column(String)

    # Verification
    is_verified = Column(Boolean, default=False)
    verification_doc = Column(String)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User")


class JobAlert(Base):
    """Job alert preferences for candidates"""

    __tablename__ = "job_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    enabled = Column(Boolean, default=True)
    skills = Column(Text)  # JSON string
    locations = Column(Text)  # JSON string
    job_types = Column(Text)  # JSON string
    min_salary = Column(Integer)

    notify_email = Column(Boolean, default=True)
    notify_push = Column(Boolean, default=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User")


class SalaryData(Base):
    __tablename__ = "salary_data"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String)
    job_title = Column(String)
    location = Column(String)
    employment_type = Column(String)
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    experience_level = Column(String)
    submission_count = Column(Integer, default=1)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    endpoint = Column(String, nullable=False)
    keys = Column(Text)  # JSON string with p256dh and auth
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")


class SavedJob(Base):
    """Saved jobs for candidates"""

    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)

    notes = Column(Text)  # User notes about why saved
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])
    job = relationship("Job")


class CompanyFollow(Base):
    """Companies that users follow"""

    __tablename__ = "company_follows"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_name = Column(String, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
