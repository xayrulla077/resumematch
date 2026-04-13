import os
import json
from dotenv import load_dotenv

load_dotenv()

# AI configuration
OPENAI_AVAILABLE = False
GEMINI_AVAILABLE = False

# OpenAI setup
openai_api_key = os.getenv("OPENAI_API_KEY")
client = None
if openai_api_key:
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=openai_api_key)
        OPENAI_AVAILABLE = True
    except ImportError:
        print("WARNING: openai package not installed")

# Gemini setup
gemini_api_key = os.getenv("GOOGLE_API_KEY")
gemini_model = None
if gemini_api_key:
    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_api_key)
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        GEMINI_AVAILABLE = True
    except ImportError:
        print("WARNING: google-generativeai package not installed")

async def call_ai(prompt: str, temperature: float = 0.7, max_tokens: int = 1000):
    """
    OpenAI yoki Gemini orqali javob olish. 
    Avval OpenAI, keyin Gemini va nihoyat xatolik.
    """
    # 1. OpenAI orqali harakat
    if OPENAI_AVAILABLE and client:
        try:
            response = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI error, falling back to Gemini if available: {e}")

    # 2. Gemini orqali harakat
    if GEMINI_AVAILABLE and gemini_model:
        try:
            # Gemini async emas, lekin biz uni thread-da ishlatishimiz mumkin yoki oddiygina await-siz chaqirishimiz mumkin
            # (FastAPI-da async funksiyalar ichida bloklovchi kodni loop-da ishlatish tavsiya qilinmaydi,
            # lekin bu yerda oddiylik uchun shunday qoldiramiz)
            response = gemini_model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini error: {e}")

    return None

def parse_json_safely(text: str, default_val: dict):
    """Matndan JSONni xavfsiz ajratib olish"""
    if not text:
        return default_val
    try:
        # Kod bloklarini olib tashlash (Gemini ko'pincha ```json ... ``` qaytaradi)
        text = re.sub(r'```json\s*|\s*```', '', text).strip()
        
        if "{" in text and "}" in text:
            json_start = text.find("{")
            json_end = text.rfind("}") + 1
            return json.loads(text[json_start:json_end])
        return json.loads(text)
    except:
        return default_val

import re


async def analyze_resume_with_ai(resume_text: str, job_description: str):
    """
    Rezyume va ish e'lonini OpenAI GPT orqali semantic tahlil qilish.
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

    result_text = await call_ai(prompt)
    if not result_text:
        return {
            "ai_score": 50,
            "ai_strengths": "AI javob bermadi",
            "ai_missing_skills": "",
            "ai_summary": "AI bilan bog'lanib bo'lmadi. Kalitlarni tekshiring.",
        }

    result = parse_json_safely(result_text, {"score": 50, "strengths": [], "missing_skills": [], "summary": "Tahlil tugallandi"})

    return {
        "ai_score": result.get("score", 50),
        "ai_strengths": ", ".join(result.get("strengths", [])) if isinstance(result.get("strengths"), list) else str(result.get("strengths", "")),
        "ai_missing_skills": ", ".join(result.get("missing_skills", [])) if isinstance(result.get("missing_skills"), list) else str(result.get("missing_skills", "")),
        "ai_summary": result.get("summary", "Tahlil yakunlandi"),
    }


async def generate_interview_questions(resume_text: str, job_description: str):
    """
    OpenAI GPT yordamida nomzod uchun maxsus texnik savollar generatsiya qilish.
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
        {{"id": 2, "question": "Savol matni..."}},
        {{"id": 3, "question": "Savol matni..."}},
        {{"id": 4, "question": "Savol matni..."}},
        {{"id": 5, "question": "Savol matni..."}}
    ]
}}
"""

    result_text = await call_ai(prompt)
    return parse_json_safely(result_text, {"questions": []})


async def evaluate_interview_answers(questions_answers: list, job_requirements: str):
    """
    Nomzodning javoblarini OpenAI AI orqali baholash.
    """
    prompt = f"""
Siz professional texnik suhbatdoshingiz. Quyidagi savollar va nomzodning javoblarini tahlil qiling.
Ish talablari: {job_requirements}

Savollar va javoblar:
{json.dumps(questions_answers, ensure_ascii=False)}

Vazifangiz:
1. Har bir javobni baholang.
2. Umumiy ball (0-100) bering.
3. Nomzodga batafsil feedback bering.

Natijani FAQAT quyidagi JSON formatida qaytaring:
{{
    "score": 75,
    "feedback": "Feedback matni...",
    "evaluations": [
        {{"question_id": 1, "comment": "Javob bo'yicha izoh", "score": 80}}
    ]
}}
"""

    result_text = await call_ai(prompt, max_tokens=1500)
    return parse_json_safely(result_text, {"score": 0, "feedback": "Xatolik", "evaluations": []})


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
3. Yaxshilash kerak bo'lgan joylarini ko'rsating.
4. ATS friendlyligi bo'yicha maslahatlar bering.

Natijani FAQAT quyidagi JSON formatida qaytaring:
{{
    "quality_score": 80,
    "pros": ["Tajriba aniq yoritilgan", "Texnologiyalar ro'yxati boy"],
    "cons": ["ATS uchun mos emas", "Yutuqlar raqamlar bilan ko'rsatilmagan"],
    "advice": ["Natijalar qismiga raqamlar qo'shing"],
    "ats_score": 75
}}
"""

    result_text = await call_ai(prompt, max_tokens=1500)
    return parse_json_safely(result_text, {
        "quality_score": 0,
        "pros": [],
        "cons": [],
        "advice": ["Xatolik"],
        "ats_score": 0,
    })


async def generate_cover_letter(resume_text: str, job_description: str):
    """
    Rezyume va ish e'loni asosida professional 'Cover Letter' tayyorlash.
    """
    prompt = f"""
Siz professional HR va Career Coach-siz. Quyidagi rezyume va ish tavsifi asosida professional, 
ta'sirchan va ish beruvchini qiziqtira oladigan 'Cover Letter' (muqova xati) yozing.

Rezyume: {resume_text}
Ish tavsifi: {job_description}

Ko'rsatmalar:
1. Xat professional va ehtirosli bo'lsin.
2. Nomzodning kuchli tomonlarini ish talablariga bog'lang.
3. O'zbek tilida yozing.
4. Natijani FAQAT JSON formatida qaytaring:
{{
    "cover_letter": "Xat matni bu yerda...",
    "tips": ["Ushbu xatni qanday moslashtirish bo'yicha maslahat..."]
}}
"""
    result_text = await call_ai(prompt, max_tokens=2000)
    return parse_json_safely(result_text, {
        "cover_letter": "AI xat tayyorlay olmadi.",
        "tips": []
    })


async def analyze_skill_gap(resume_skills: str, required_skills: str):
    """
    Nomzodda yetishmayotgan ko'nikmalarni va ularni o'rganish uchun yo'llarni tahlil qilish.
    """
    prompt = f"""
Nomzodning ko'nikmalari: {resume_skills}
Ish uchun talab qilinadigan ko'nikmalar: {required_skills}

Vazifangiz:
1. Aynan qaysi muhim ko'nikmalar yetishmayotganini aniqlang.
2. Ushbu ko'nikmalarni o'rganish uchun qisqa yo'l (learning path) taklif qiling.
3. O'zbek tilida javob bering.

Natijani FAQAT JSON formatida qaytaring:
{{
    "missing_skills": ["Skill 1", "Skill 2"],
    "learning_path": [
        {{"skill": "Skill 1", "resources": ["Resource 1", "Resource 2"], "time_estimate": "2 hafta"}}
    ],
    "alternative_skills": ["Agar Skill 1 bo'lmasa, Skill 3 ham ketaveradi"]
}}
"""
    result_text = await call_ai(prompt, max_tokens=1500)
    return parse_json_safely(result_text, {
        "missing_skills": [],
        "learning_path": [],
        "alternative_skills": []
    })
