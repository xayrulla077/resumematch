from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
from api.database import get_db
from api import models, schemas
from api.auth import get_current_active_user
from services.resume_generator import generate_resume_pdf, get_template_list

router = APIRouter()


@router.get("/generate-templates")
async def get_templates():
    """Available PDF templates"""
    return get_template_list()


@router.post("/generate-pdf")
async def generate_resume_pdf_endpoint(
    request: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Generate PDF resume from form data"""
    try:
        user_data = request.get("user_data", {})
        resume_data = request.get("resume_data", {})
        template = request.get("template", "modern")

        pdf_bytes = generate_resume_from_template(user_data, resume_data, template)

        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=resume.pdf"},
        )
    except Exception as e:
        print(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
