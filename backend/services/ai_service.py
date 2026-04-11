import os
import json
from dotenv import load_dotenv

load_dotenv()

# OpenAI configuration
try:
    from openai import AsyncOpenAI

    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("WARNING: OPENAI_API_KEY not found in environment variables")
    client = None
elif not OPENAI_AVAILABLE:
    print("WARNING: openai package not installed")
    client = None
else:
    client = AsyncOpenAI(api_key=api_key)


async def analyze_resume_with_ai(resume_text: str, job_description: str):
    """
    Rezyume va ish e'lonini OpenAI GPT orqali semantic tahlil qilish.
    """
    if not client:
        return {
            "ai_score": 50,
            "ai_strengths": "AI konfiguratsiya yo'q",
            "ai_missing_skills": "",
            "ai_summary": "OPENAI_API_KEY ni .env fayliga qo'shing",
        }

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
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000,
        )

        result_text = response.choices[0].message.content

        # Parse JSON response
        try:
            # Try to find JSON in response
            if "{" in result_text and "}" in result_text:
                json_start = result_text.find("{")
                json_end = result_text.rfind("}") + 1
                result = json.loads(result_text[json_start:json_end])
            else:
                result = json.loads(result_text)
        except:
            result = {
                "score": 50,
                "strengths": [],
                "missing_skills": [],
                "summary": result_text[:200] if result_text else "Tahlil yakunlandi",
            }

        return {
            "ai_score": result.get("score", 50),
            "ai_strengths": ", ".join(result.get("strengths", [])),
            "ai_missing_skills": ", ".join(result.get("missing_skills", [])),
            "ai_summary": result.get("summary", "Tahlil yakunlandi"),
        }
    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "ai_score": 50,
            "ai_strengths": "Tahlil qilinmadi",
            "ai_missing_skills": "",
            "ai_summary": f"AI xatosi: {str(e)}",
        }


async def generate_interview_questions(resume_text: str, job_description: str):
    """
    OpenAI GPT yordamida nomzod uchun maxsus texnik savollar generatsiya qilish.
    """
    if not client:
        return {"questions": []}

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

    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000,
        )

        result_text = response.choices[0].message.content

        if "{" in result_text and "}" in result_text:
            json_start = result_text.find("{")
            json_end = result_text.rfind("}") + 1
            return json.loads(result_text[json_start:json_end])

        return {"questions": []}
    except Exception as e:
        print(f"AI Question Generation error: {e}")
        return {"questions": []}


async def evaluate_interview_answers(questions_answers: list, job_requirements: str):
    """
    Nomzodning javoblarini OpenAI AI orqali baholash.
    """
    if not client:
        return {"score": 0, "feedback": "AI konfiguratsiya yo'q", "evaluations": []}

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

    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1500,
        )

        result_text = response.choices[0].message.content

        if "{" in result_text and "}" in result_text:
            json_start = result_text.find("{")
            json_end = result_text.rfind("}") + 1
            return json.loads(result_text[json_start:json_end])

        return {
            "score": 0,
            "feedback": "Baholashda xatolik yuz berdi.",
            "evaluations": [],
        }
    except Exception as e:
        print(f"AI Answer Evaluation error: {e}")
        return {"score": 0, "feedback": f"Xato: {str(e)}", "evaluations": []}


async def get_resume_feedback(resume_text: str):
    """
    Rezyumeni professional darajada ko'rib chiqish va maslahatlar berish.
    """
    if not client:
        return {
            "quality_score": 0,
            "pros": [],
            "cons": [],
            "advice": ["AI konfiguratsiya yo'q"],
            "ats_score": 0,
        }

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

    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1500,
        )

        result_text = response.choices[0].message.content

        if "{" in result_text and "}" in result_text:
            json_start = result_text.find("{")
            json_end = result_text.rfind("}") + 1
            return json.loads(result_text[json_start:json_end])

        return {
            "quality_score": 0,
            "pros": [],
            "cons": [],
            "advice": ["Xatolik"],
            "ats_score": 0,
        }
    except Exception as e:
        print(f"AI Resume Feedback error: {e}")
        return {
            "quality_score": 0,
            "pros": [],
            "cons": [],
            "advice": [f"Xato: {str(e)}"],
            "ats_score": 0,
        }
