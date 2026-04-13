import re
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


def normalize_skill(skill: str) -> str:
    """Skill nomini standartlashtirish"""
    if not skill:
        return ""
    skill = skill.lower().strip()
    alias_map = {
        "js": "javascript",
        "reactjs": "react",
        "nodejs": "node.js",
        "ts": "typescript",
        "py": "python",
        "postgres": "postgresql",
        "aws": "amazon web services",
        "ml": "machine learning",
        "ai": "artificial intelligence",
        "react native": "react",
        "react.js": "react",
        "vue.js": "vue",
        "angular.js": "angular",
        "next.js": "nextjs",
        "express.js": "express",
        "fastapi": "fastapi",
        "django": "django",
        "flask": "flask",
        "sql": "sql",
        "nosql": "nosql",
        "mongodb": "mongodb",
    }
    return alias_map.get(skill, skill)


def parse_experience_years(exp_text: str) -> float:
    """Tajriba yillarini ajratib olish"""
    if not exp_text:
        return 0.0
    exp_text = str(exp_text).lower()
    patterns = [
        r"(\d+)\s*(?:yil|year|лет)",
        r"(\d+)\s*(?:oy|month|мес)",
    ]
    for pattern in patterns:
        match = re.search(pattern, exp_text)
        if match:
            value = int(match.group(1))
            if "oy" in pattern or "month" in pattern or "мес" in pattern:
                return value / 12
            return float(value)
    return 0.0


async def get_ai_match_score(resume_data: Dict, job_data: Dict) -> Dict[str, Any]:
    """
    AI orqali match score hisoblash.
    Resume va Job ma'lumotlarini solishtirib, aniq ball va feedback beradi.
    """
    from services.ai_service import call_ai, parse_json_safely

    resume_text = f"""
    Name: {resume_data.get("full_name", "N/A")}
    Email: {resume_data.get("email", "N/A")}
    Phone: {resume_data.get("phone", "N/A")}
    Skills: {resume_data.get("skills", "N/A")}
    Experience: {resume_data.get("experience", "N/A")}
    Education: {resume_data.get("education", "N/A")}
    Summary: {resume_data.get("summary", "N/A")}
    """

    job_text = f"""
    Title: {job_data.get("title", "N/A")}
    Company: {job_data.get("company", "N/A")}
    Location: {job_data.get("location", "N/A")}
    Requirements: {job_data.get("requirements", "N/A")}
    Required Skills: {job_data.get("required_skills", "N/A")}
    Experience Level: {job_data.get("experience_level", "N/A")}
    Description: {job_data.get("description", "N/A")}
    """

    prompt = f"""
    Siz professional HR va AI Matching Engine-siz. Quyidagi resume va job tavsifini solishtirib, 
    0-100% oralig'ida aniq match score hisoblang.
    
    RESUME:
    {resume_text}
    
    JOB:
    {job_text}
    
    QUYIDAGI JSON FORMATIDA JAVOB QAYTARING (faqat JSON):
    {{
        "match_score": 85,
        "matched_skills": ["Python", "FastAPI", "PostgreSQL"],
        "missing_skills": ["Docker", "AWS"],
        "strengths": ["Tajribali Python dasturchi", "Database bilimlari kuchli"],
        "weaknesses": ["Cloud tajriba yetishmaydi"],
        "recommendation": "Jiddiy nomzod, interviewga chaqirish tavsiya etiladi",
        "match_reasons": "Python va FastAPI bilimlari to'liq mos keladi"
    }}
    """

    try:
        result_text = await call_ai(prompt, max_tokens=1500)
        result = parse_json_safely(
            result_text,
            {
                "match_score": 0,
                "matched_skills": [],
                "missing_skills": [],
                "strengths": [],
                "weaknesses": [],
                "recommendation": "",
                "match_reasons": "",
            },
        )
        return result
    except Exception as e:
        logger.error(f"AI match scoring error: {e}")
        return {
            "match_score": 0,
            "matched_skills": [],
            "missing_skills": [],
            "strengths": [],
            "weaknesses": [],
            "recommendation": "",
            "match_reasons": f"AI scoring xatosi: {str(e)}",
        }


def calculate_hybrid_score(resume, job) -> Dict[str, Any]:
    """
    Rezyume va ish o'rni o'rtasidagi muvofiqlikni ko'p bosqichli tahlil qilish.
    Yaxshilangan versiya:
    """
    scores = {
        "skills": 0.0,
        "experience": 0.0,
        "title": 0.0,
        "location": 0.0,
        "completeness": 0.0,
        "overall": 0.0,
        "matched_skills": [],
        "missing_skills": [],
    }

    # 1. Ko'nikmalar tahloli
    r_skills_raw = []
    if resume.skills:
        r_skills_raw = [
            s.strip() for s in re.split(r"[,\n;]", resume.skills) if s.strip()
        ]
    r_skills = set(normalize_skill(s) for s in r_skills_raw if s.strip())

    j_skills_raw = []
    if job.required_skills:
        j_skills_raw = [
            s.strip() for s in re.split(r"[,\n;]", job.required_skills) if s.strip()
        ]
    j_skills = set(normalize_skill(s) for s in j_skills_raw if s.strip())

    if j_skills:
        matched = r_skills.intersection(j_skills)
        missing = j_skills.difference(r_skills)

        for j_s in list(missing):
            for r_s in r_skills:
                if j_s and r_s and (j_s in r_s or r_s in j_s):
                    matched.add(j_s)
                    if j_s in missing:
                        missing.remove(j_s)
                    break

        scores["matched_skills"] = list(matched)
        scores["missing_skills"] = list(missing)
        scores["skills"] = (len(matched) / len(j_skills)) * 100 if j_skills else 100

    # 2. Tajriba yillari
    r_exp_years = (
        parse_experience_years(resume.experience) if resume.experience else 0.0
    )

    j_exp_req = 0.0
    if job.experience_level:
        level = str(job.experience_level).lower()
        match = re.search(r"(\d+)", level)
        if match:
            j_exp_req = float(match.group(1))
        elif "junior" in level or "entry" in level:
            j_exp_req = 1.0
        elif "middle" in level or "mid" in level:
            j_exp_req = 3.0
        elif "senior" in level or "lead" in level:
            j_exp_req = 5.0

    if j_exp_req > 0:
        if r_exp_years >= j_exp_req:
            scores["experience"] = 100.0
        elif r_exp_years >= j_exp_req * 0.7:
            scores["experience"] = 80.0
        elif r_exp_years >= j_exp_req * 0.5:
            scores["experience"] = 60.0
        else:
            scores["experience"] = min((r_exp_years / j_exp_req) * 100, 50)
    else:
        scores["experience"] = 100.0

    # 3. Sarlavha (Title)
    if job.title and resume.summary:
        job_title_words = set(re.findall(r"\w+", str(job.title).lower()))
        resume_text = (
            str(resume.summary or "") + " " + str(resume.full_name or "")
        ).lower()

        found_count = sum(
            1 for word in job_title_words if len(word) > 2 and word in resume_text
        )
        if job_title_words:
            scores["title"] = min((found_count / len(job_title_words)) * 200, 100.0)

    # 4. Joylashuv (Location)
    if job.location and resume.summary:
        job_loc = str(job.location).lower()
        resume_loc = str(resume.summary or "").lower()

        if job_loc in resume_loc:
            scores["location"] = 100.0

    # 5. To'liqlik (Completeness)
    completeness = 0
    if resume.email:
        completeness += 20
    if resume.phone:
        completeness += 20
    if resume.skills:
        completeness += 20
    if resume.summary:
        completeness += 20
    if resume.experience:
        completeness += 20
    scores["completeness"] = completeness

    # Umumiy natija (og'irliklar)
    weights = {
        "skills": 0.40,
        "experience": 0.25,
        "title": 0.15,
        "location": 0.10,
        "completeness": 0.10,
    }

    overall = (
        (scores["skills"] * weights["skills"])
        + (scores["experience"] * weights["experience"])
        + (scores["title"] * weights["title"])
        + (scores["location"] * weights["location"])
        + (completeness * weights["completeness"])
    )

    scores["overall"] = round(min(overall, 100), 1)
    return scores


def get_match_percentage_text(score: float) -> str:
    """Match score ni matnli ko'rinishga o'girish"""
    if score >= 80:
        return "A'lo darajada mos"
    elif score >= 60:
        return "Yaxshi mos"
    elif score >= 40:
        return "O'rtacha mos"
    elif score >= 20:
        return "Kam mos"
    else:
        return "Mos emas"


def get_match_color(score: float) -> str:
    """Match score uchun rang"""
    if score >= 80:
        return "text-green-600"
    elif score >= 60:
        return "text-blue-600"
    elif score >= 40:
        return "text-yellow-600"
    else:
        return "text-red-600"
