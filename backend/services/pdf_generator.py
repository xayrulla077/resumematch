import os
from datetime import datetime
from fpdf import FPDF


class PDF(FPDF):
    def header(self):
        pass

    def footer(self):
        pass


def generate_resume_from_template(data: dict, template: str = "modern"):
    """
    Turli xil dizayn shablonlari asosida Resume PDF yaratish.
    template: 'modern', 'classic', 'creative'
    """
    pdf = PDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Ranglar palitrasi
    colors = {
        "modern": {"primary": (99, 102, 241), "text": (31, 41, 55), "muted": (107, 114, 128)},
        "classic": {"primary": (0, 0, 0), "text": (0, 0, 0), "muted": (80, 80, 80)},
        "creative": {"primary": (236, 72, 153), "text": (17, 24, 39), "muted": (75, 85, 99)}
    }
    
    style = colors.get(template, colors["modern"])
    p_color = style["primary"]
    t_color = style["text"]
    m_color = style["muted"]

    # --- Header ---
    if template == "modern":
        pdf.set_fill_color(p_color[0], p_color[1], p_color[2])
        pdf.rect(0, 0, 210, 40, "F")
        pdf.set_text_color(255, 255, 255)
        pdf.set_y(15)
        pdf.set_font("Helvetica", "B", 26)
        pdf.cell(0, 10, data.get("full_name", "Resume"), ln=True, align="C")
        pdf.set_font("Helvetica", "", 10)
        contact = f"{data.get('email', '')}  |  {data.get('phone', '')}  |  {data.get('location', '')}"
        pdf.cell(0, 8, contact, ln=True, align="C")
        pdf.set_y(45)
    else:
        pdf.set_text_color(p_color[0], p_color[1], p_color[2])
        pdf.set_font("Helvetica", "B", 24)
        pdf.cell(0, 12, data.get("full_name", "Resume"), ln=True, align="C")
        pdf.set_text_color(m_color[0], m_color[1], m_color[2])
        pdf.set_font("Helvetica", "", 10)
        contact = f"{data.get('email', '')} | {data.get('phone', '')} | {data.get('location', '')}"
        pdf.cell(0, 8, contact, ln=True, align="C")
        pdf.ln(5)

    # --- Content ---
    pdf.set_text_color(t_color[0], t_color[1], t_color[2])
    
    # Sections helper
    def add_section_header(title):
        pdf.ln(5)
        pdf.set_text_color(p_color[0], p_color[1], p_color[2])
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 8, title.upper(), ln=True)
        # Line below header
        pdf.set_draw_color(p_color[0], p_color[1], p_color[2])
        pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 190, pdf.get_y())
        pdf.ln(3)
        pdf.set_text_color(t_color[0], t_color[1], t_color[2])

    # Summary
    if data.get("summary"):
        add_section_header("Professional Summary")
        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(0, 6, str(data["summary"]))

    # Experience
    if data.get("experience"):
        add_section_header("Experience")
        for exp in data["experience"]:
            pdf.set_font("Helvetica", "B", 12)
            pdf.cell(0, 7, f"{exp.get('title', '')} at {exp.get('company', '')}", ln=True)
            pdf.set_font("Helvetica", "I", 10)
            pdf.set_text_color(m_color[0], m_color[1], m_color[2])
            pdf.cell(0, 6, exp.get("date_range", ""), ln=True)
            pdf.set_text_color(t_color[0], t_color[1], t_color[2])
            pdf.set_font("Helvetica", "", 11)
            pdf.multi_cell(0, 5, exp.get("description", ""))
            pdf.ln(2)

    # Skills
    if data.get("skills"):
        add_section_header("Skills")
        pdf.set_font("Helvetica", "", 11)
        skills = data.get("skills", [])
        if isinstance(skills, str): skills = skills.split(", ")
        pdf.multi_cell(0, 6, ", ".join(skills))

    # Education
    if data.get("education"):
        add_section_header("Education")
        for edu in data["education"]:
            pdf.set_font("Helvetica", "B", 11)
            pdf.cell(0, 6, edu.get("degree", ""), ln=True)
            pdf.set_font("Helvetica", "", 10)
            pdf.cell(0, 5, f"{edu.get('institution', '')}  ({edu.get('year', '')})", ln=True)
            pdf.ln(1)

    return pdf.output(dest="S").encode("latin-1", "replace")


def generate_resume_pdf(data: dict, output_path: str):
    """
    Sodda ko'rinishda Resume PDF yaratish va faylga saqlash.
    """
    pdf_content = generate_resume_from_template(data)
    with open(output_path, "wb") as f:
        f.write(pdf_content)
    return output_path


def generate_applicant_report_pdf(
    job_title: str, applicants: list, output_path: str = None
):
    """Generate PDF report for job applicants"""
    pdf = PDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 10, f"Applicant Report: {job_title}", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(
        0,
        10,
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        ln=True,
        align="C",
    )
    pdf.ln(10)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(80, 10, "Name", 1)
    pdf.cell(30, 10, "Match Score", 1)
    pdf.cell(30, 10, "Status", 1)
    pdf.cell(40, 10, "Interview Score", 1)
    pdf.ln()

    pdf.set_font("Helvetica", "", 10)
    for app in applicants:
        name = (
            (app.get("name", "Unknown")[:35] or "Unknown")
            .encode("latin-1", "replace")
            .decode("latin-1")
        )
        score = f"{app.get('score', 0)}%"
        status = (app.get("status", "pending") or "pending").capitalize()[:15]
        int_score = str(app.get("interview_score", "-"))

        pdf.cell(80, 10, name, 1)
        pdf.cell(30, 10, score, 1)
        pdf.cell(30, 10, status, 1)
        pdf.cell(40, 10, int_score, 1)
        pdf.ln()

    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 8)
    pdf.cell(0, 10, "Resume Matcher - AI Powered Recruitment", ln=True, align="C")

    if output_path:
        pdf.output(output_path)
        return output_path
    else:
        return pdf.output(dest="S").encode("latin-1")
