from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api import models, schemas
from api.auth import get_current_active_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class CompanyProfileBase(BaseModel):
    company_name: str
    industry: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    founded_year: Optional[int] = None
    linkedin: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None


class CompanyProfileCreate(CompanyProfileBase):
    pass


class CompanyProfileUpdate(CompanyProfileBase):
    pass


class CompanyProfileResponse(CompanyProfileBase):
    id: int
    user_id: int
    logo_url: Optional[str] = None
    cover_image: Optional[str] = None
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


@router.post("/profile", response_model=CompanyProfileResponse)
async def create_company_profile(
    profile: CompanyProfileCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Kompaniya profili yaratish"""
    if current_user.role != "employer":
        raise HTTPException(status_code=403, detail="Faqat employerlar uchun")

    # Old profile bormi?
    existing = (
        db.query(models.CompanyProfile)
        .filter(models.CompanyProfile.user_id == current_user.id)
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="Profile allaqachon mavjud")

    new_profile = models.CompanyProfile(
        user_id=current_user.id,
        company_name=profile.company_name,
        industry=profile.industry,
        company_size=profile.company_size,
        description=profile.description,
        website=profile.website,
        location=profile.location,
        founded_year=profile.founded_year,
        linkedin=profile.linkedin,
        facebook=profile.facebook,
        instagram=profile.instagram,
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


@router.get("/profile", response_model=CompanyProfileResponse)
async def get_company_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """O'z kompaniya profilini olish"""
    profile = (
        db.query(models.CompanyProfile)
        .filter(models.CompanyProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        raise HTTPException(status_code=404, detail="Profil topilmadi")

    return profile


@router.put("/profile", response_model=CompanyProfileResponse)
async def update_company_profile(
    profile: CompanyProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Kompaniya profilini yangilash"""
    existing = (
        db.query(models.CompanyProfile)
        .filter(models.CompanyProfile.user_id == current_user.id)
        .first()
    )

    if not existing:
        raise HTTPException(status_code=404, detail="Profil topilmadi")

    # Update fields
    for key, value in profile.model_dump(exclude_unset=True).items():
        setattr(existing, key, value)

    existing.updated_at = datetime.now()

    db.commit()
    db.refresh(existing)

    return existing


@router.post("/profile/logo")
async def upload_company_logo(
    logo_url: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Logo URL ni yangilash"""
    profile = (
        db.query(models.CompanyProfile)
        .filter(models.CompanyProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        raise HTTPException(status_code=404, detail="Profil topilmadi")

    profile.logo_url = logo_url
    db.commit()

    return {"success": True, "logo_url": logo_url}


@router.get("/company/{company_id}", response_model=CompanyProfileResponse)
async def get_public_company_profile(
    company_id: int,
    db: Session = Depends(get_db),
):
    """Ochiq kompaniya profili"""
    profile = (
        db.query(models.CompanyProfile)
        .filter(models.CompanyProfile.id == company_id)
        .first()
    )

    if not profile:
        raise HTTPException(status_code=404, detail="Kompaniya topilmadi")

    return profile


@router.get("/companies")
async def list_companies(
    industry: Optional[str] = None,
    size: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Kompaniyalar ro'yxati"""
    query = db.query(models.CompanyProfile)

    if industry:
        query = query.filter(models.CompanyProfile.industry == industry)
    if size:
        query = query.filter(models.CompanyProfile.company_size == size)

    companies = query.limit(limit).all()

    return [
        {
            "id": c.id,
            "company_name": c.company_name,
            "industry": c.industry,
            "company_size": c.company_size,
            "location": c.location,
            "logo_url": c.logo_url,
            "description": c.description[:100] + "..."
            if c.description and len(c.description) > 100
            else c.description,
        }
        for c in companies
    ]
