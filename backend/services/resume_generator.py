from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import io
import os
from datetime import datetime
from typing import Optional, Dict, Any


def generate_resume_pdf(data: Dict[str, Any], template: str = "modern") -> bytes:
    """
    Generate professional resume PDF

    Args:
        data: Dictionary containing resume data
        template: Template style (modern, classic, creative)

    Returns:
        PDF as bytes
    """

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm
    )

    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=24,
        textColor=colors.HexColor("#1e3a8a"),
        spaceAfter=3 * mm,
        alignment=TA_LEFT,
    )

    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.HexColor("#1e3a8a"),
        spaceBefore=6 * mm,
        spaceAfter=3 * mm,
        borderPadding=5,
    )

    normal_style = ParagraphStyle(
        "CustomNormal",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.black,
        spaceBefore=2 * mm,
        spaceAfter=2 * mm,
    )

    # Header Section
    name = data.get("full_name", "Your Name")
    title = data.get("title", "Professional Title")

    # Name and title
    story.append(Paragraph(name, title_style))
    story.append(
        Paragraph(
            title,
            ParagraphStyle(
                "SubTitle",
                fontSize=14,
                textColor=colors.HexColor("#4b5563"),
                spaceAfter=5 * mm,
            ),
        )
    )

    # Contact Info
    contact_info = []
    if data.get("email"):
        contact_info.append(f"✉ {data['email']}")
    if data.get("phone"):
        contact_info.append(f"📞 {data['phone']}")
    if data.get("location"):
        contact_info.append(f"📍 {data['location']}")
    if data.get("linkedin"):
        contact_info.append(f"🔗 {data['linkedin']}")

    if contact_info:
        story.append(Paragraph(" | ".join(contact_info), normal_style))

    story.append(Spacer(1, 5 * mm))

    # Summary
    if data.get("summary"):
        story.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
        story.append(Paragraph(data["summary"], normal_style))
        story.append(Spacer(1, 3 * mm))

    # Skills
    if data.get("skills"):
        story.append(Paragraph("SKILLS", heading_style))

        # Group skills by category
        skills_by_category = {}
        for skill in data["skills"]:
            if isinstance(skill, dict):
                category = skill.get("category", "Other")
                skill_name = skill.get("name", "")
            else:
                category = "Technical"
                skill_name = skill

            if category not in skills_by_category:
                skills_by_category[category] = []
            skills_by_category[category].append(skill_name)

        for category, skills in skills_by_category.items():
            story.append(
                Paragraph(f"<b>{category}:</b> {', '.join(skills)}", normal_style)
            )

        story.append(Spacer(1, 3 * mm))

    # Work Experience
    if data.get("experience"):
        story.append(Paragraph("WORK EXPERIENCE", heading_style))

        for exp in data["experience"]:
            company = exp.get("company", "")
            position = exp.get("position", "")
            duration = exp.get("duration", "")
            location = exp.get("location", "")

            # Company and duration
            if company:
                header = f"<b>{position}</b> at {company}"
                if duration:
                    header += f" | {duration}"
                story.append(Paragraph(header, normal_style))

            if location:
                story.append(
                    Paragraph(
                        f"<i>{location}</i>",
                        ParagraphStyle(
                            "Location",
                            fontSize=9,
                            textColor=colors.gray,
                            spaceBefore=1 * mm,
                        ),
                    )
                )

            # Responsibilities
            if exp.get("responsibilities"):
                for resp in exp["responsibilities"]:
                    story.append(Paragraph(f"• {resp}", normal_style))

            story.append(Spacer(1, 3 * mm))

    # Education
    if data.get("education"):
        story.append(Paragraph("EDUCATION", heading_style))

        for edu in data["education"]:
            degree = edu.get("degree", "")
            school = edu.get("school", "")
            year = edu.get("year", "")

            if degree and school:
                header = f"<b>{degree}</b> - {school}"
                if year:
                    header += f" | {year}"
                story.append(Paragraph(header, normal_style))

            if edu.get("gpa"):
                story.append(Paragraph(f"GPA: {edu['gpa']}", normal_style))

            story.append(Spacer(1, 2 * mm))

    # Certifications
    if data.get("certifications"):
        story.append(Paragraph("CERTIFICATIONS", heading_style))
        for cert in data["certifications"]:
            story.append(Paragraph(f"• {cert}", normal_style))
        story.append(Spacer(1, 3 * mm))

    # Languages
    if data.get("languages"):
        story.append(Paragraph("LANGUAGES", heading_style))
        langs = [
            f"{lang.get('name', '')} ({lang.get('level', '')})"
            for lang in data["languages"]
        ]
        story.append(Paragraph(", ".join(langs), normal_style))

    # Build PDF
    doc.build(story)

    return buffer.getvalue()


def generate_resume_from_template(
    user_data: Dict[str, Any], resume_data: Dict[str, Any], template: str = "modern"
) -> bytes:
    """Generate resume PDF from user and resume data"""

    # Combine data
    combined_data = {
        "full_name": user_data.get("full_name", "Your Name"),
        "title": resume_data.get("title", "Professional"),
        "email": user_data.get("email", ""),
        "phone": user_data.get("phone", ""),
        "location": resume_data.get("location", ""),
        "linkedin": user_data.get("linkedin", ""),
        "summary": resume_data.get("summary", ""),
        "skills": resume_data.get("skills", []),
        "experience": resume_data.get("experience", []),
        "education": resume_data.get("education", []),
        "certifications": resume_data.get("certifications", []),
        "languages": resume_data.get("languages", []),
    }

    return generate_resume_pdf(combined_data, template)


# Template presets
TEMPLATES = {
    "modern": {
        "name": "Modern",
        "description": "Clean and professional with blue accents",
        "primary_color": "#1e3a8a",
    },
    "classic": {
        "name": "Classic",
        "description": "Traditional layout with serif fonts",
        "primary_color": "#000000",
    },
    "creative": {
        "name": "Creative",
        "description": "Modern and eye-catching design",
        "primary_color": "#7c3aed",
    },
    "minimal": {
        "name": "Minimal",
        "description": "Simple and elegant design",
        "primary_color": "#374151",
    },
}


def get_template_list():
    """Get available templates"""
    return [
        {"id": key, "name": val["name"], "description": val["description"]}
        for key, val in TEMPLATES.items()
    ]
