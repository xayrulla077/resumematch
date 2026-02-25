import os
import io
import PyPDF2
from pdf2image import convert_from_path
import pytesseract
from typing import Optional, Dict, Any
import google.generativeai as genai
import json
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GOOGLE_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

model = genai.GenerativeModel('gemini-1.5-flash')

def extract_text_from_pdf(file_path: str) -> str:
    """PDF dan matn ajratish (OCR bilan)"""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return ""
        
    text = ""
    try:
        # 1. Oddiy usulda matnni ajratish
        with open(file_path, 'rb') as file:
            try:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            except Exception as pdf_err:
                print(f"Normal PDF read error (might be image-only): {pdf_err}")
        
        # 2. Agar matn juda oz bo'lsa yoki bo'sh bo'lsa (Skanerlangan PDF)
        if len(text.strip()) < 50:
            print(f"OCR ishga tushirildi: {file_path}")
            try:
                # Poppler va Tesseract o'rnatilgan bo'lishi kerak
                images = convert_from_path(file_path)
                for i, image in enumerate(images):
                    ocr_text = pytesseract.image_to_string(image, lang='eng+uzb')
                    text += ocr_text + "\n"
            except Exception as ocr_err:
                print(f"OCR Process error (Check Tesseract/Poppler): {ocr_err}")
                
    except Exception as e:
        print(f"Critical PDF/OCR extraction error: {e}")
    
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
            "experience_years": 0
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
        model = genai.GenerativeModel('gemini-1.5-flash')
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
            "experience_years": 0
        }
