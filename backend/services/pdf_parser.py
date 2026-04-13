import warnings
import logging

warnings.filterwarnings("ignore", category=FutureWarning)

import os
import io
import PyPDF2
from pdf2image import convert_from_path
import pytesseract
from typing import Optional, Dict, Any
import google.generativeai as genai
import json
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

# Suppress FutureWarning globally
warnings.filterwarnings("ignore", category=FutureWarning, module="google")

# Configure Gemini
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-1.5-flash")


def extract_text_from_pdf(file_path: str) -> str:
    """PDF dan matn ajratish (OCR bilan)"""
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return ""

    text = ""
    try:
        # 1. Oddiy usulda matnni ajratish
        with open(file_path, "rb") as file:
            try:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            except Exception as pdf_err:
                logger.warning(f"PDF read error (might be image-only): {pdf_err}")

        # 2. Agar matn juda oz bo'lsa yoki bo'sh bo'lsa (Skanerlangan PDF)
        if len(text.strip()) < 50:
            logger.info(f"OCR ishga tushirildi: {file_path}")
            try:
                # Memory optimization: DPI ni kamaytiramiz va faqat birinchi bir necha sahifani o'qiymiz
                # Render Free tierda memory juda kam (512MB)
                try:
                    images = convert_from_path(
                        file_path, dpi=100, first_page=1, last_page=3
                    )  # Yanada kamaytirdik
                    for i, image in enumerate(images):
                        ocr_text = pytesseract.image_to_string(image, lang="eng+uzb")
                        text += ocr_text + "\n"
                        del image
                except MemoryError:
                    logger.error(f"Memory Error during OCR: {file_path}")
                    text += "\n[Xatolik: Fayl juda katta yoki xotira yetishmadi.]"
            except Exception as ocr_err:
                logger.error(f"OCR Process error: {ocr_err}")

    except Exception as e:
        logger.error(f"Critical PDF/OCR extraction error: {e}")

    return text


async def parse_resume_smart(text: str) -> Dict[str, Any]:
    """Gemini AI orqali rezyumeni 'aqlli' tahlil qilish (Parsing)"""
    if not text or len(text.strip()) < 10:
        return {
            "full_name": "Noma'lum",
            "email": "",
            "phone": "",
            "skills": "",
            "summary": "Matn ajratishda xatolik: PDF bo'sh bo'lishi mumkin.",
            "experience_years": 0,
        }

    try:
        # Prompt yaratamiz
        prompt = f"""
        Ushbu rezyume matnidan quyidagi ma'lumotlarni aniq ajratib oling va FAQAT JSON formatida qaytaring:
        {{
            "full_name": "Ism Familiya",
            "email": "email@example.com",
            "phone": "+998...",
            "skills": "Skill1, Skill2, Skill3",
            "summary": "Nomzod haqida qisqacha xulosa",
            "experience_years": 5
        }}
        
        Rezyume matni (ba'zi qilingan belgilar rasm yoki xato bo'lishi mumkin, ma'nosiga qarang):
        {text}
        """

        # Gemini modelini sozlash
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = await model.generate_content_async(prompt)

        # JSONni ajratib olish
        content = response.text
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        data = json.loads(content.strip())
        return data

    except Exception as e:
        print(f"Smart parsing error: {e}")
        return {
            "full_name": "Noma'lum",
            "email": "",
            "phone": "",
            "skills": "",
            "summary": "Tahlil jarayonida xatolik yuz berdi.",
            "experience_years": 0,
        }
