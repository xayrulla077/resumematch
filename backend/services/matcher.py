import re
from typing import List, Set, Dict, Any
from api import models

def calculate_hybrid_score(resume: models.Resume, job: models.Job) -> Dict[str, Any]:
    """
    Rezyume va ish o'rni o'rtasidagi muvofiqlikni ko'p bosqichli tahlil qilish.
    1. Ko'nikmalar (Skills) - 60%
    2. Tajriba yillari (Experience) - 20%
    3. Lavozim va Sarlavha (Title) - 15%
    4. Qo'shimcha (Completeness) - 5%
    """
    
    scores = {
        "skills": 0.0,
        "experience": 0.0,
        "title": 0.0,
        "overall": 0.0,
        "matched_skills": [],
        "missing_skills": []
    }

    # 1. Ko'nikmalar tahlili (Skills)
    if resume.skills and job.required_skills:
        # Resume va Job skilarini tozalash va listga aylantirish
        r_skills = set(s.strip().lower() for s in resume.skills.split(",") if s.strip())
        j_skills = set(s.strip().lower() for s in job.required_skills.split(",") if s.strip())

        if j_skills:
            matched = r_skills.intersection(j_skills)
            missing = j_skills.difference(r_skills)
            
            scores["matched_skills"] = list(matched)
            scores["missing_skills"] = list(missing)
            scores["skills"] = (len(matched) / len(j_skills)) * 100
    
    # 2. Tajriba yillari (Experience)
    # Rezyumedagi '5 yil' kabi matndan raqamni ajratish
    r_exp_match = re.search(r'(\d+)', str(resume.experience or "0"))
    r_exp_years = int(r_exp_match.group(1)) if r_exp_match else 0
    
    # Ish talabidagi '2+ yil' yoki 'junior' kabi matnlarni tahlil qilish
    j_exp_req = 0
    if job.experience_level:
        j_exp_match = re.search(r'(\d+)', job.experience_level)
        if j_exp_match:
            j_exp_req = int(j_exp_match.group(1))
        elif 'junior' in job.experience_level.lower():
            j_exp_req = 1
        elif 'middle' in job.experience_level.lower():
            j_exp_req = 3
        elif 'senior' in job.experience_level.lower():
            j_exp_req = 5

    if j_exp_req > 0:
        if r_exp_years >= j_exp_req:
            scores["experience"] = 100
        else:
            scores["experience"] = (r_exp_years / j_exp_req) * 100
    else:
        scores["experience"] = 100 # Agar tajriba talab qilinmagan bo'lsa

    # 3. Sarlavha va Tavsif (Title & Summary)
    if job.title and resume.summary:
        title_keywords = set(re.findall(r'\w+', job.title.lower()))
        summary_text = resume.summary.lower()
        
        found_keywords = sum(1 for word in title_keywords if word in summary_text)
        if title_keywords:
            scores["title"] = (found_keywords / len(title_keywords)) * 100

    # Umumiy natijani hisoblash (Vaznli o'rta arifmetik)
    overall = (
        (scores["skills"] * 0.60) +
        (scores["experience"] * 0.20) +
        (scores["title"] * 0.15) +
        (5.0 if resume.email and resume.phone else 0.0)
    )
    
    scores["overall"] = round(min(overall, 100), 1)
    return scores
