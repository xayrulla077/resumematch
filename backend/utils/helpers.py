"""Utility helper functions for the API"""
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Type, TypeVar, Optional

T = TypeVar('T')


def get_or_404(
    db: Session,
    model: Type[T],
    id: int,
    message: Optional[str] = None
) -> T:
    """Get an object by ID or raise 404 error"""
    obj = db.query(model).filter(model.id == id).first()
    if not obj:
        detail = message or f"{model.__name__} topilmadi"
        raise HTTPException(status_code=404, detail=detail)
    return obj


def safe_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal attacks"""
    import os
    import re
    # Get just the basename (no path components)
    safe_name = os.path.basename(filename)
    # Remove any remaining dangerous characters
    safe_name = re.sub(r'[^\w\s\.-]', '', safe_name)
    return safe_name
