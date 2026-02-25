from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
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
    role = Column(String, default="user")  # admin, hr, user
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)

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

    # Analysis
    is_analyzed = Column(Boolean, default=False)
    match_score = Column(Float, default=0.0)

    # Metadata
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    analyzed_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="resumes")
    matches = relationship("Match", back_populates="resume")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"))

    title = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False)
    location = Column(String)
    salary = Column(String)
    employment_type = Column(String)  # full_time, part_time, contract, internship

    description = Column(Text)
    requirements = Column(Text)  # JSON string or plain text

    # Extracted requirements for matching
    required_skills = Column(Text)  # JSON string
    experience_level = Column(String)

    # Metadata
    is_active = Column(Boolean, default=True)
    posted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.utcnow)

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

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User")


class Application(Base):
    """Nomzodning ish joyiga arizasi"""
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    
    status = Column(String, default="pending")  # pending, reviewed, accepted, rejected
    match_score = Column(Float, default=0.0)  # Matching score
    
    cover_letter = Column(Text)  # Optional cover letter
    admin_notes = Column(Text)  # Admin's notes
    
    applied_at = Column(DateTime, default=datetime.utcnow)
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
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="notifications")