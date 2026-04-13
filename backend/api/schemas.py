from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
    ConfigDict,
    model_validator,
)
from typing import Optional, List, Dict, Any
from datetime import datetime
from utils.security import (
    sanitize_input,
    sanitize_html_content,
    sanitize_filename,
    sanitize_url,
    sanitize_phone,
)


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=30)
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None

    @field_validator("username", mode="before")
    @classmethod
    def sanitize_username(cls, v: Any) -> str:
        if v is None:
            return v
        return sanitize_input(str(v), max_length=30)

    @field_validator("full_name", "bio", mode="before")
    @classmethod
    def sanitize_text_fields(cls, v: Any) -> Optional[str]:
        if v is None:
            return v
        return sanitize_input(str(v), max_length=2000)

    @field_validator("phone", mode="before")
    @classmethod
    def sanitize_phone_field(cls, v: Any) -> Optional[str]:
        if v is None:
            return v
        return sanitize_phone(str(v))

    @field_validator("profile_image", mode="before")
    @classmethod
    def sanitize_url_field(cls, v: Any) -> Optional[str]:
        if v is None:
            return v
        return sanitize_url(str(v))


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: Optional[str] = "candidate"  # candidate, employer
    company_name: Optional[str] = None  # For employers

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
        if not any(c.isupper() for c in v):
            raise ValueError("Parol kamida 1 ta katta harf bo'lishi kerak")
        if not any(c.isdigit() for c in v):
            raise ValueError("Parol kamida 1 ta raqam bo'lishi kerak")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        """Validate role"""
        if v not in [None, "candidate", "employer"]:
            raise ValueError("Role must be 'candidate' or 'employer'")
        return v or "candidate"


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    role: str
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_active: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class GoogleToken(BaseModel):
    token: str


# Resume Schemas
class ResumeBase(BaseModel):
    file_name: str

    @field_validator("file_name", mode="before")
    @classmethod
    def sanitize_file_name(cls, v: Any) -> str:
        if v is None:
            return "unnamed"
        return sanitize_filename(str(v))


class ResumeCreate(ResumeBase):
    pass


class ResumeResponse(ResumeBase):
    id: int
    file_size: Optional[int]
    full_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    skills: List[str] = []
    is_analyzed: bool
    status: str
    match_score: float
    uploaded_at: datetime

    # Additional fields
    certifications: Optional[str] = None
    projects: Optional[str] = None
    achievements: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None

    # AI Analysis
    ai_strengths: Optional[str] = None
    ai_missing_skills: Optional[str] = None
    ai_summary: Optional[str] = None

    @field_validator("skills", mode="before")
    @classmethod
    def parse_skills(cls, v):
        """Skills stringni listga aylantirish"""
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return []

    model_config = ConfigDict(from_attributes=True)


class ResumeAnalysisResult(BaseModel):
    resume_id: int
    full_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    skills: List[str]
    experience: str
    education: str
    languages: List[str]
    summary: str


# Job Schemas
class JobBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    company: str = Field(..., min_length=2, max_length=200)
    location: Optional[str] = None
    salary: Optional[str] = None
    employment_type: str
    description: Optional[str] = None
    requirements: Optional[str] = None

    @field_validator("title", "company", mode="before")
    @classmethod
    def sanitize_required_fields(cls, v: Any) -> str:
        return sanitize_input(str(v), max_length=200)

    @field_validator("location", "salary", mode="before")
    @classmethod
    def sanitize_optional_text(cls, v: Any) -> Optional[str]:
        if v is None:
            return v
        return sanitize_input(str(v), max_length=200)

    @field_validator("description", "requirements", mode="before")
    @classmethod
    def sanitize_html_fields(cls, v: Any) -> Optional[str]:
        if v is None:
            return v
        return sanitize_html_content(str(v), max_length=50000)


class JobCreate(JobBase):
    pass


class JobUpdate(JobBase):
    pass


class JobResponse(JobBase):
    id: int
    creator_id: int
    is_active: bool
    posted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobWithApplicationsCount(JobBase):
    id: int
    creator_id: int
    is_active: bool
    posted_at: datetime
    applications_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# Match Schemas
class MatchBase(BaseModel):
    resume_id: int
    job_id: int


class MatchCreate(MatchBase):
    pass


class MatchResponse(MatchBase):
    id: int
    overall_score: float
    skills_score: float
    experience_score: float
    matched_skills: Optional[str]
    missing_skills: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Analytics Schemas
class AnalyticsOverview(BaseModel):
    total_resumes: int
    total_jobs: int
    total_matches: int
    total_users: int
    active_users: int
    avg_match_score: float
    changes: Dict[str, str] = {}


class TopSkill(BaseModel):
    skill: str
    count: int
    demand: float


class MonthlyStats(BaseModel):
    month: str
    resumes: int
    jobs: int
    matches: int


class MatchDistribution(BaseModel):
    name: str
    value: int
    color: str


class MatchStats(BaseModel):
    distribution: List[MatchDistribution]


# Activity Log Schemas
class ActivityLogBase(BaseModel):
    action_type: str
    action_description: str
    details: Optional[str]


class ActivityLogCreate(ActivityLogBase):
    user_id: int


# Application Schemas
class ApplicationBase(BaseModel):
    job_id: int
    resume_id: int
    cover_letter: Optional[str] = None

    @field_validator("cover_letter", mode="before")
    @classmethod
    def sanitize_cover_letter(cls, v: Any) -> Optional[str]:
        if v is None:
            return v
        return sanitize_html_content(str(v), max_length=10000)


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None


class ApplicationResponse(ApplicationBase):
    id: int
    user_id: int
    status: str
    match_score: float = Field(0.0)
    admin_notes: Optional[str] = None
    applied_at: datetime
    reviewed_at: Optional[datetime] = None

    # AI Insights
    ai_score: float = 0.0
    ai_strengths: Optional[List[str]] = Field(default_factory=list)
    ai_missing_skills: Optional[List[str]] = Field(default_factory=list)
    ai_summary: Optional[str] = None

    @field_validator("ai_strengths", "ai_missing_skills", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        """JSON stringni listga aylantirish"""
        import json

        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return []

    # AI Interview
    ai_interview_data: Optional[str] = None  # JSON string
    ai_interview_score: float = 0.0
    ai_interview_feedback: Optional[str] = None

    # Optional nested data for detail views
    job: Optional[JobResponse] = None
    resume: Optional[ResumeResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Pagination Schemas
class PaginationMetadata(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int


class PaginatedJobsResponse(BaseModel):
    items: List[JobResponse]
    metadata: PaginationMetadata


class PaginatedResumesResponse(BaseModel):
    items: List[ResumeResponse]
    metadata: PaginationMetadata


# Phase 3: Admin & Monitoring Schemas
class SystemStatsResponse(BaseModel):
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    uptime: str
    server_time: datetime


class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    action_type: str
    action_description: str
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicantListResponse(BaseModel):
    id: int
    applicant_name: str
    applicant_email: str
    resume_file: str
    match_score: float
    status: str
    applied_at: datetime
    cover_letter: Optional[str] = None
    ai_score: Optional[float] = None
    ai_summary: Optional[str] = None

    # AI Interview fields for admin view
    ai_interview_score: Optional[float] = 0.0
    ai_interview_feedback: Optional[str] = None
    ai_interview_data: Optional[str] = None


class PaginatedApplicantsResponse(BaseModel):
    items: List[ApplicantListResponse]
    metadata: PaginationMetadata


class DBOverviewResponse(BaseModel):
    resumes_count: int
    jobs_count: int
    matches_count: int
    users_count: int
    applications_count: int


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    @field_validator("title", "message", mode="before")
    @classmethod
    def sanitize_notification_fields(cls, v: Any) -> str:
        return sanitize_input(str(v), max_length=2000)

    model_config = ConfigDict(from_attributes=True)


# Resume Builder Schemas
class ExperienceItem(BaseModel):
    title: str
    company: str
    date_range: str
    description: str


class EducationItem(BaseModel):
    degree: str
    institution: str
    year: str


class CertificationItem(BaseModel):
    name: str
    issuer: str
    date: str
    credential_id: Optional[str] = None


class ProjectItem(BaseModel):
    name: str
    description: str
    technologies: List[str] = []
    link: Optional[str] = None


class AchievementItem(BaseModel):
    title: str
    description: str
    date: str


class ResumeBuilderData(BaseModel):
    full_name: str
    email: str
    phone: str
    summary: str
    skills: List[str]
    experience: List[ExperienceItem]
    education: List[EducationItem]
    languages: List[str] = []
    certifications: List[CertificationItem] = []
    projects: List[ProjectItem] = []
    achievements: List[AchievementItem] = []
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
