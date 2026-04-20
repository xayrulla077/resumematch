"""Xavfsizlik va input tozalash utility funksiyalari"""

import re
import html
import os
from typing import Optional, Any


def sanitize_input(text: str, max_length: int = 1000) -> str:
    """
    Inputni tozalash - XSS va boshqa xavfli contentlarni olib tashlash
    """
    if not text:
        return ""

    if not isinstance(text, str):
        text = str(text)

    # Script va style taglarni olib tashlash (html.escape olib tashlandi, matn buzulmasligi uchun)

    # Script va style taglarni olib tashlash
    text = re.sub(
        r"<script[^>]*>.*?</script>", "", text, flags=re.IGNORECASE | re.DOTALL
    )
    text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<\?xml[^>]*>.*?</\?>", "", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<!DOCTYPE[^>]*>", "", text, flags=re.IGNORECASE)

    # JavaScript URI schemelari
    text = re.sub(r"javascript:", "", text, flags=re.IGNORECASE)
    text = re.sub(r"data:", "", text, flags=re.IGNORECASE)
    text = re.sub(r"vbscript:", "", text, flags=re.IGNORECASE)

    # Event handlerlar
    text = re.sub(r"on\w+\s*=", "", text, flags=re.IGNORECASE)

    # Uzunlikni cheklash
    if len(text) > max_length:
        text = text[:max_length]

    return text.strip()


def sanitize_html_content(text: str, max_length: int = 50000) -> str:
    """
    HTML contentni tozalash (resume, job description kabi uchun)
    """
    if not text:
        return ""

    if not isinstance(text, str):
        text = str(text)

    # XSS vectors
    text = re.sub(
        r"<script[^>]*>.*?</script>", "", text, flags=re.IGNORECASE | re.DOTALL
    )
    text = re.sub(
        r"<iframe[^>]*>.*?</iframe>", "", text, flags=re.IGNORECASE | re.DOTALL
    )
    text = re.sub(
        r"<object[^>]*>.*?</object>", "", text, flags=re.IGNORECASE | re.DOTALL
    )
    text = re.sub(r"<embed[^>]*>", "", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'on\w+\s*=\s*["\']', "", text, flags=re.IGNORECASE)
    text = re.sub(r"javascript:", "", text, flags=re.IGNORECASE)
    text = re.sub(r"data:", "", text, flags=re.IGNORECASE)

    if len(text) > max_length:
        text = text[:max_length]

    return text.strip()


ALLOWED_FILE_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
}


def sanitize_filename(filename: str) -> str:
    """
    Filename ni tozalash - path traversal oldini olish
    """
    if not filename:
        return "unnamed"

    # Base name ni olish
    filename = filename.split("/")[-1]
    filename = filename.split("\\")[-1]

    # Faqat xavfsiz belgilar
    filename = re.sub(r"[^\w\s\.-]", "", filename)
    filename = filename[:200]  # Uzunlik chek

    if not filename:
        return "unnamed"

    return filename


def validate_file_extension(filename: str) -> bool:
    """
    Fayl extensionni tekshirish - xavfli fayllar oldini olish
    """
    if not filename:
        return False

    # Get extension (lower case)
    ext = os.path.splitext(filename)[1].lower()

    return ext in ALLOWED_FILE_EXTENSIONS


def validate_mime_type(content_type: str) -> bool:
    """
    MIME type tekshirish
    """
    if not content_type:
        return False

    content_type = content_type.lower().split(";")[0].strip()

    return content_type in ALLOWED_MIME_TYPES


def validate_file_content(
    content: bytes, max_size: int = 10 * 1024 * 1024
) -> tuple[bool, str]:
    """
    Fayl contentni tekshirish - magic bytes orqali

    Returns: (is_valid, error_message)
    """
    if not content or len(content) == 0:
        return False, "Fayl bo'sh"

    if len(content) > max_size:
        return False, f"Fayl hajmi {max_size // (1024 * 1024)}MB dan oshmasligi kerak"

    # PDF magic bytes
    if content[:5] == b"%PDF-":
        return True, ""

    # Images
    if content[:2] == b"\xff\xd8":  # JPEG
        return True, ""
    if content[:4] == b"\x89PNG":  # PNG
        return True, ""
    if content[:4] == b"GIF8":  # GIF
        return True, ""
    if content[:4] == b"RIFF" and content[8:12] == b"WEBP":  # WebP
        return True, ""

    # DOCX (ZIP)
    if content[:2] == b"PK":
        return True, ""

    # Text
    try:
        content[:100].decode("utf-8")
        return True, ""
    except:
        pass

    return False, "Noma'lum fayl formati"


def sanitize_email(email: str) -> str:
    """
    Email manzilini tozalash va validatsiya qilish
    """
    if not email:
        return ""

    email = email.lower().strip()

    # Email format validation
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, email):
        raise HTTPException(status_code=400, detail="Email manzil noto'g'ri formatda")

    return email


def sanitize_username(username: str) -> str:
    """
    Usernamesani tozalash
    """
    if not username:
        return ""

    username = username.strip()

    # Faqat alphanumeric, underscore va hyphen
    username = re.sub(r"[^a-zA-Z0-9_-]", "", username)

    if len(username) < 3 or len(username) > 30:
        raise HTTPException(
            status_code=400, detail="Username 3-30 ta belgidan iborat bo'lishi kerak"
        )

    return username


def sanitize_phone(phone: str) -> str:
    """
    Phone raqamni tozalash
    """
    if not phone:
        return ""

    # Faqat raqamlar, + va -
    phone = re.sub(r"[^\d+\-()]", "", phone)

    return phone.strip()


def sanitize_url(url: str) -> str:
    """
    URLni tozalash
    """
    if not url:
        return ""

    url = url.strip()

    # Faqat xavfsiz schemalar
    allowed_schemes = ["http", "https"]

    if not any(url.lower().startswith(scheme + "://") for scheme in allowed_schemes):
        raise HTTPException(
            status_code=400, detail="URL faqat http yoki https bo'lishi kerak"
        )

    return url


def sanitize_search_query(query: str, max_length: int = 200) -> str:
    """
    Qidiruv querysini tozalash
    """
    if not query:
        return ""

    query = query.strip()

    # HTML tags
    query = re.sub(r"<[^>]+>", "", query)

    # Max uzunlik
    if len(query) > max_length:
        query = query[:max_length]

    return query


def validate_sql_injection(text: str) -> bool:
    """
    SQL injection urinishlarini aniqlash
    """
    if not text:
        return True

    sql_patterns = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)",
        r"(--|#|\/\*|\*\/)",
        r"(\bUNION\b\s+\bSELECT\b)",
        r"(\bOR\b\s+\b\d+\s*=\s*\d+)",
        r"(\bAND\b\s+\b\d+\s*=\s*\d+)",
    ]

    for pattern in sql_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return False

    return True


def require_sanitize(*fields):
    """
    Decorator - fieldlarni avtomatik tozalash
    """

    def decorator(func):
        def wrapper(*args, **kwargs):
            for field in fields:
                if field in kwargs and kwargs[field]:
                    kwargs[field] = sanitize_input(kwargs[field])
            return func(*args, **kwargs)

        return wrapper

    return decorator
