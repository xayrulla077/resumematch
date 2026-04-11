import os
from datetime import datetime
from fpdf import FPDF


class PDF(FPDF):
    def header(self):
        pass

    def footer(self):
        pass


def generate_resume_pdf(data: dict, output_path: str):
    pdf = PDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font("Helvetica", "B", 24)
    pdf.cell(0, 10, data.get("full_name", "Resume"), ln=True, align="C")

    pdf.set_font("Helvetica", "", 12)
    contact_info = f"{data.get('email', '')} | {data.get('phone', '')}"
    pdf.cell(0, 10, contact_info, ln=True, align="C")

    pdf.ln(5)

    if data.get("summary"):
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Professional Summary", ln=True)
        pdf.set_font("Helvetica", "", 11)
        # Using multi_cell to handle line breaks properly
        pdf.multi_cell(
            0, 6, data["summary"].encode("latin-1", "replace").decode("latin-1")
        )
        pdf.ln(5)

    if data.get("skills"):
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Skills", ln=True)
        pdf.set_font("Helvetica", "", 11)
        skills_text = ", ".join(data.get("skills", []))
        pdf.multi_cell(0, 6, skills_text.encode("latin-1", "replace").decode("latin-1"))
        pdf.ln(5)

    if data.get("experience"):
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Experience", ln=True)
        for exp in data["experience"]:
            pdf.set_font("Helvetica", "B", 12)
            # Access dictionary fields properly
            title_comp = f"{exp.get('title', '')} at {exp.get('company', '')}"
            pdf.cell(
                0, 7, title_comp.encode("latin-1", "replace").decode("latin-1"), ln=True
            )
            pdf.set_font("Helvetica", "I", 11)
            pdf.cell(
                0,
                7,
                exp.get("date_range", "")
                .encode("latin-1", "replace")
                .decode("latin-1"),
                ln=True,
            )
            pdf.set_font("Helvetica", "", 11)
            pdf.multi_cell(
                0,
                6,
                exp.get("description", "")
                .encode("latin-1", "replace")
                .decode("latin-1"),
            )
            pdf.ln(3)

    if data.get("education"):
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Education", ln=True)
        for edu in data["education"]:
            pdf.set_font("Helvetica", "B", 12)
            deg = f"{edu.get('degree', '')}"
            pdf.cell(0, 7, deg.encode("latin-1", "replace").decode("latin-1"), ln=True)
            pdf.set_font("Helvetica", "", 11)
            inst_yr = f"{edu.get('institution', '')} - {edu.get('year', '')}"
            pdf.cell(
                0, 7, inst_yr.encode("latin-1", "replace").decode("latin-1"), ln=True
            )
            pdf.ln(3)

    pdf.output(output_path)
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
