from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.models import Notice, User
from app.schemas.schemas import NoticeCreate, NoticeOut
from app.core.security import get_current_user, require_admin
from app.services.notifications import NotificationService

router = APIRouter(prefix="/api/notices", tags=["Notice Board"])

@router.post("", response_model=NoticeOut, status_code=status.HTTP_201_CREATED)
def create_notice(
    notice_in: NoticeCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    db_notice = Notice(
        title=notice_in.title,
        content=notice_in.content,
        is_important=notice_in.is_important,
        author_id=current_user.id
    )
    db.add(db_notice)
    db.commit()
    db.refresh(db_notice)
    
    # If marked as important, notify all residents via email
    if db_notice.is_important:
        residents = db.query(User).filter(User.role == "resident").all()
        resident_emails = [r.email for r in residents if r.email]
        if resident_emails:
            NotificationService.notify_important_notice(
                notice=db_notice,
                resident_emails=resident_emails
            )
            
    return NoticeOut(
        id=db_notice.id,
        title=db_notice.title,
        content=db_notice.content,
        is_important=db_notice.is_important,
        author_id=db_notice.author_id,
        created_at=db_notice.created_at,
        author_name=current_user.full_name
    )

@router.get("", response_model=List[NoticeOut])
def list_notices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notices = db.query(Notice).all()
    
    # Format and serialize
    serialized = []
    for n in notices:
        serialized.append(NoticeOut(
            id=n.id,
            title=n.title,
            content=n.content,
            is_important=n.is_important,
            author_id=n.author_id,
            created_at=n.created_at,
            author_name=n.author.full_name if n.author else "System"
        ))
        
    # Sort: important (pinned) first, then newest notices
    serialized.sort(key=lambda x: (x.is_important, x.created_at), reverse=True)
    return serialized
