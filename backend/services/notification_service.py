import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

# Email configuration from environment
SMTP_SERVER = os.getenv("SMTP_SERVER", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@resumematcher.com")
FROM_NAME = os.getenv("FROM_NAME", "Resume Matcher")

# Enable/disable email sending
EMAIL_ENABLED = bool(SMTP_SERVER and SMTP_USERNAME)

logger.info(f"Email config: enabled={EMAIL_ENABLED}, server={SMTP_SERVER}")


def send_email(to_email: str, subject: str, body: str, html: bool = False) -> bool:
    """Send email to recipient"""
    if not EMAIL_ENABLED:
        logger.debug(f"Email disabled - would send to {to_email}: {subject}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg["Date"] = datetime.now().strftime("%a, %d %b %Y %H:%M:%S %z")

        if html:
            msg.attach(MIMEText(body, "html"))
        else:
            msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Email send error: {e}")
        return False


# Email Templates
new_application_template = Template("""
Yangi ariza keldi!

Kompaniya: {{company}}
Lavozim: {{job_title}}
Nomzod: {{candidate_name}}
Match score: {{match_score}}%

{{message}}

---
Resume Matcher - AI-Powered Hiring Platform
""")

application_status_template = Template("""
Arizangiz holati o'zgardi!

Lavozim: {{job_title}}
Kompaniya: {{company}}
Yangi holat: {{status}}

{{message}}

---
Resume Matcher - AI-Powered Hiring Platform
""")

new_job_alert_template = Template("""
Yangi vakansiya - {{title}}

Kompaniya: {{company}}
Joylashuv: {{location}}
Maosh: {{salary}}

{{description[:200]}}...

Skill talablari: {{skills}}

Batafsil: {{job_url}}

---
Resume Matcher - AI Job Alerts
""")

interview_invite_template = Template("""
Intervyu taklifi!

Lavozim: {{job_title}}
Kompaniya: {{company}}
Vaqt: {{scheduled_time}}

{{message}}

Intervyuga ro'yxatdan o'tish: {{interview_url}}

---
Resume Matcher - AI Interview System
""")


def send_new_application_email(
    employer_email: str, employer_name: str, data: dict
) -> bool:
    """Email to employer when new application received"""
    body = new_application_template.render(
        company=data.get("company", ""),
        job_title=data.get("job_title", ""),
        candidate_name=data.get("candidate_name", ""),
        match_score=data.get("match_score", 0),
        message=data.get("message", ""),
    )
    return send_email(
        employer_email, f"Yangi ariza - {data.get('candidate_name', 'Nomzod')}", body
    )


def send_application_status_email(
    candidate_email: str, candidate_name: str, data: dict
) -> bool:
    """Email to candidate when application status changes"""
    status_emoji = {
        "pending": "⏳",
        "reviewed": "👀",
        "interview": "📅",
        "accepted": "✅",
        "rejected": "❌",
    }
    emoji = status_emoji.get(data.get("status", "pending"), "📋")

    body = application_status_template.render(
        job_title=data.get("job_title", ""),
        company=data.get("company", ""),
        status=f"{emoji} {data.get('status', '').capitalize()}",
        message=data.get("message", ""),
    )
    return send_email(
        candidate_email, f"Arizangiz {data.get('status', 'yangilandi')}", body
    )


def send_job_alert_email(candidate_email: str, candidate_name: str, data: dict) -> bool:
    """Email to candidate when matching job is posted"""
    body = new_job_alert_template.render(
        title=data.get("title", ""),
        company=data.get("company", ""),
        location=data.get("location", ""),
        salary=data.get("salary", "Koorilamagan"),
        description=data.get("description", ""),
        skills=data.get("skills", ""),
        job_url=data.get("job_url", ""),
    )
    return send_email(
        candidate_email, f"Yangi vakansiya: {data.get('title', '')}", body
    )


def send_interview_invite_email(candidate_email: str, data: dict) -> bool:
    """Email to candidate for interview invitation"""
    body = interview_invite_template.render(
        job_title=data.get("job_title", ""),
        company=data.get("company", ""),
        scheduled_time=data.get("scheduled_time", ""),
        message=data.get("message", ""),
        interview_url=data.get("interview_url", ""),
    )
    return send_email(candidate_email, "Intervyu taklifi!", body)


# In-app notification functions
def create_notification(
    db, user_id: int, title: str, message: str, notif_type: str = "info", link: str = ""
) -> None:
    """Create in-app notification"""
    from api import models

    notification = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        notif_type=notif_type,
        link=link,
        is_read=False,
    )
    db.add(notification)
    db.commit()
