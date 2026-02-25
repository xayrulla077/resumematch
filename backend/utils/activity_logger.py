from sqlalchemy.orm import Session
from api import models
import json
from typing import Optional, Any

def log_activity(
    db: Session,
    user_id: int,
    action_type: str,
    action_description: str,
    details: Optional[Any] = None
):
    """
    Log a user activity to the database.
    details can be a dict, list, or string (will be converted to JSON string if needed).
    """
    details_str = None
    if details is not None:
        if isinstance(details, (dict, list)):
            details_str = json.dumps(details, ensure_ascii=False)
        else:
            details_str = str(details)
            
    new_log = models.ActivityLog(
        user_id=user_id,
        action_type=action_type,
        action_description=action_description,
        details=details_str
    )
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log
