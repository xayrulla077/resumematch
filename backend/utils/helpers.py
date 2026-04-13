"""Utility helper functions for the API"""

from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Type, TypeVar, Optional, List
from math import ceil

T = TypeVar("T")


def get_or_404(
    db: Session, model: Type[T], id: int, message: Optional[str] = None
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
    safe_name = re.sub(r"[^\w\s\.-]", "", safe_name)
    return safe_name


def paginate_query(
    db: Session, query, page: int = 1, limit: int = 20, max_limit: int = 100
) -> tuple[List[T], dict]:
    """
    Queryni paginatsiya qilish

    Returns: (items, metadata)
    """
    # Validate params
    page = max(1, page)
    limit = min(max(1, limit), max_limit)

    # Get total count
    total = query.count()
    total_pages = ceil(total / limit) if total > 0 else 0

    # Get items
    items = query.offset((page - 1) * limit).limit(limit).all()

    metadata = {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }

    return items, metadata
