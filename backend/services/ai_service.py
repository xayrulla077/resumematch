import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

async def analyze_resume_with_ai(resume_text: str, job_description: str):
    """
    Rezyume va ish e'lonini Gemini AI orqali semantic tahlil qilish.
    """
    prompt = f"""
    Siz professional HR va AI tahlilchisiz. Quyidagi rezyume matni va ish tavsifini (Job Description) solishtiring.
    
    Rezyume matni:
    {resume_text}
    
    Ish tavsifi:
    {job_description}
    
    Vazifangiz:
    1. Nomzodning ushbu ishga mosligini 0 dan 100 gacha bo'lgan ball (score) bilan baholang.
    2. Nomzodning kuchli tomonlarini (strengths) sanab o'ting.
    3. Nomzodda yetishmayotgan ko'nikmalarni (missing_skills) ko'rsating.
    4. Qisqacha xulosa (summary) bering.
    
    Natijani FAQAT quyidagi JSON formatida qaytaring, boshqa hech qanday izoh qo'shmang:
    {{
        "score": 85,
        "strengths": ["Python", "Problem solving", "Experience in fintech"],
        "missing_skills": ["AWS", "Docker"],
        "summary": "Nomzod backend bo'yicha kuchli tajribaga ega, lekin DevOps bilimlari biroz yetishmaydi."
    }}
    """
    
    try:
        response = await model.generate_content_async(prompt)
        # JSON qismini ajratib olish (ba'zida AI markdown formatda qaytaradi)
        content = response.text
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
            
        return json.loads(content.strip())
    except Exception as e:
        print(f"AI Analysis error: {e}")
        return {
            "score": 0,
            "strengths": [],
            "missing_skills": [],
            "summary": "AI tahlilida xatolik yuz berdi."
        }

async def generate_interview_questions(resume_text: str, job_description: str):
    """
    Gemini AI yordamida nomzod uchun maxsus texnik savollar generatsiya qilish.
    """
    prompt = f"""
    Siz professional texnik suhbatdoshingiz. Quyidagi rezyume va ish tavsifi asosida nomzod uchun 5 ta eng muhim texnik savolni tayyorlang.
    Savollar nomzodning tajribasini sinashga va ish talablariga mosligini aniqlashga qaratilgan bo'lishi kerak.
    
    Rezyume: {resume_text}
    Ish tavsifi: {job_description}
    
    Natijani FAQAT quyidagi JSON formatida qaytaring:
    {{
        "questions": [
            {{"id": 1, "question": "Savol matni..."}},
            ...
        ]
    }}
    """
    try:
        response = await model.generate_content_async(prompt)
        content = response.text
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        return json.loads(content.strip())
    except Exception as e:
        print(f"AI Question Generation error: {e}")
        return {"questions": []}

async def evaluate_interview_answers(questions_answers: list, job_requirements: str):
    """
    Nomzodning javoblarini Gemini AI orqali baholash.
    """
    prompt = f"""
    Siz professional texnik suhbatdoshingiz. Quyidagi savollar va nomzodning javoblarini tahlil qiling.
    Ish talablari: {job_requirements}
    
    Savollar va javoblar:
    {json.dumps(questions_answers, ensure_ascii=False)}
    
    Vazifangiz:
    1. Har bir javobni baholang.
    2. Umumiy ball (0-100) bering.
    3. Nomzodga batafsil feedback bering (kuchli va kuchsiz tomonlari haqida).
    
    Natijani FAQAT quyidagi JSON formatida qaytaring:
    {{
        "score": 75,
        "feedback": "Feedback matni...",
        "evaluations": [
            {{"question_id": 1, "comment": "Javob bo'yicha izoh", "score": 80}},
            ...
        ]
    }}
    """
    try:
        response = await model.generate_content_async(prompt)
        content = response.text
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        return json.loads(content.strip())
    except Exception as e:
        print(f"AI Answer Evaluation error: {e}")
        return {"score": 0, "feedback": "Baholashda xatolik yuz berdi.", "evaluations": []}

async def get_resume_feedback(resume_text: str):
    """
    Rezyumeni professional darajada ko'rib chiqish va maslahatlar berish.
    """
    prompt = f"""
    Siz professional Career Coach va HR mutaxassisisiz. Quyidagi rezyumeni tahlil qiling va uni yaxshilash uchun batafsil maslahatlar bering.
    
    Rezyume matni:
    {resume_text}
    
    Vazifangiz:
    1. Rezyumening umumiy sifatini 0-100 ball bilan baholang.
    2. Kuchli tomonlarini sanab o'ting.
    3. Yaxshilash kerak bo'lgan joylarini (vuzual, struktura, mazmun) ko'rsating.
    4. Sanoat standartlariga (ATS friendly) mosligi bo'yicha maslahatlar bering.
    
    Natijani FAQAT quyidagi JSON formatida qaytaring:
    {{
        "quality_score": 80,
        "pros": ["Tajriba aniq yoritilgan", "Texnologiyalar ro'yxati boy"],
        "cons": ["ATS uchun mos emas (ko'p grafiklar)", "Yutuqlar raqamlar bilan ko'rsatilmagan"],
        "advice": [
            "Ish tajribangizda 'Natijalar' qismiga ko'proq foizlar va raqamlar qo'shing.",
            "Summary qismini biroz qisqartirib, eng muhim yutuqlarni birinchi yozing."
        ],
        "ats_score": 75
    }}
    """
    try:
        response = await model.generate_content_async(prompt)
        content = response.text
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        return json.loads(content.strip())
    except Exception as e:
        print(f"AI Resume Feedback error: {e}")
        return {
            "quality_score": 0,
            "pros": [],
            "cons": [],
            "advice": ["Tahlil qilishda xatolik yuz berdi."],
            "ats_score": 0
        }
