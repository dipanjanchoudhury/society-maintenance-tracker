from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta
import os

from app.database import get_db
from app.models.models import Complaint, ComplaintStatusHistory, User, SystemSetting
from app.schemas.schemas import ComplaintOut, ComplaintUpdate, DashboardStats, StatusHistoryOut
from app.core.security import get_current_user, require_admin
from app.services.storage import StorageService
from app.services.notifications import NotificationService

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

def get_overdue_threshold(db: Session) -> int:
    setting = db.query(SystemSetting).filter(SystemSetting.key == "overdue_threshold_days").first()
    if setting:
        try:
            return int(setting.value)
        except ValueError:
            pass
    return 5  # default is 5 days

def serialize_history(history_entries) -> List[StatusHistoryOut]:
    result = []
    for h in history_entries:
        result.append(StatusHistoryOut(
            id=h.id,
            complaint_id=h.complaint_id,
            status=h.status,
            priority=h.priority,
            note=h.note,
            actor_id=h.actor_id,
            created_at=h.created_at,
            actor_name=h.actor.full_name if h.actor else "System"
        ))
    return result

def check_overdue(created_at: datetime, status_str: str, threshold_days: int) -> bool:
    if status_str == "Resolved":
        return False
    delta = datetime.utcnow() - created_at
    return delta.days >= threshold_days

def map_to_complaint_out(c: Complaint, threshold_days: int) -> ComplaintOut:
    is_overdue = check_overdue(c.created_at, c.status, threshold_days)
    history = serialize_history(c.status_history)
    # Sort history oldest to newest
    history.sort(key=lambda x: x.created_at)
    
    return ComplaintOut(
        id=c.id,
        title=c.title,
        description=c.description,
        category=c.category,
        photo_url=c.photo_url,
        status=c.status,
        priority=c.priority,
        creator_id=c.creator_id,
        created_at=c.created_at,
        updated_at=c.updated_at,
        creator_name=c.creator.full_name if c.creator else "Unknown",
        creator_unit=c.creator.unit_number if c.creator else None,
        is_overdue=is_overdue,
        status_history=history
    )

@router.post("", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
def create_complaint(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    photo_url = None
    if photo and photo.filename:
        photo_url = StorageService.save_image(photo)
        
    db_complaint = Complaint(
        title=title,
        description=description,
        category=category,
        photo_url=photo_url,
        status="Open",
        priority="Medium",
        creator_id=current_user.id
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    
    # Save initial history
    history = ComplaintStatusHistory(
        complaint_id=db_complaint.id,
        status="Open",
        priority="Medium",
        note="Complaint submitted by resident.",
        actor_id=current_user.id
    )
    db.add(history)
    db.commit()
    
    threshold_days = get_overdue_threshold(db)
    return map_to_complaint_out(db_complaint, threshold_days)

@router.get("", response_model=List[ComplaintOut])
def list_complaints(
    category: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    
    # Non-admins can only see their own complaints
    if current_user.role != "admin":
        query = query.filter(Complaint.creator_id == current_user.id)
        
    if category:
        query = query.filter(Complaint.category == category)
    if status:
        query = query.filter(Complaint.status == status)
    if date_from:
        query = query.filter(Complaint.created_at >= date_from)
    if date_to:
        query = query.filter(Complaint.created_at <= date_to)
        
    complaints = query.all()
    threshold_days = get_overdue_threshold(db)
    
    serialized = [map_to_complaint_out(c, threshold_days) for c in complaints]
    
    # Sorting logic:
    # Admin gets overdue complaints first, then by created_at descending.
    # Residents get complaints by created_at descending.
    if current_user.role == "admin":
        serialized.sort(key=lambda x: (not x.is_overdue, x.created_at), reverse=True)
    else:
        serialized.sort(key=lambda x: x.created_at, reverse=True)
        
    return serialized

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    complaints = db.query(Complaint).all()
    threshold_days = get_overdue_threshold(db)
    
    total = len(complaints)
    open_count = sum(1 for c in complaints if c.status == "Open")
    in_progress = sum(1 for c in complaints if c.status == "In_Progress")
    resolved = sum(1 for c in complaints if c.status == "Resolved")
    
    overdue_count = sum(
        1 for c in complaints 
        if check_overdue(c.created_at, c.status, threshold_days)
    )
    
    # Category breakdown
    category_counts = {}
    for c in complaints:
        category_counts[c.category] = category_counts.get(c.category, 0) + 1
        
    return DashboardStats(
        total_complaints=total,
        open_complaints=open_count,
        in_progress_complaints=in_progress,
        resolved_complaints=resolved,
        overdue_complaints=overdue_count,
        category_counts=category_counts
    )

@router.get("/{id}", response_model=ComplaintOut)
def get_complaint(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if current_user.role != "admin" and complaint.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this complaint")
        
    threshold_days = get_overdue_threshold(db)
    return map_to_complaint_out(complaint, threshold_days)

@router.put("/{id}/status", response_model=ComplaintOut)
def update_complaint_status(
    id: int,
    update: ComplaintUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    # Standardize statuses
    valid_statuses = {"Open", "In_Progress", "Resolved"}
    valid_priorities = {"Low", "Medium", "High"}
    
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
    if update.priority not in valid_priorities:
        raise HTTPException(status_code=400, detail=f"Invalid priority. Must be one of {valid_priorities}")
        
    # Check if there is an actual change to prevent redundant logging
    status_changed = complaint.status != update.status
    priority_changed = complaint.priority != update.priority
    
    if status_changed or priority_changed or update.note:
        complaint.status = update.status
        complaint.priority = update.priority
        complaint.updated_at = datetime.utcnow()
        
        # Log to history
        history = ComplaintStatusHistory(
            complaint_id=complaint.id,
            status=update.status,
            priority=update.priority,
            note=update.note,
            actor_id=current_user.id
        )
        db.add(history)
        db.commit()
        db.refresh(complaint)
        
        # Send email update to resident in background
        if complaint.creator and complaint.creator.email:
            NotificationService.notify_complaint_status_change(
                complaint=complaint,
                history=history,
                resident_email=complaint.creator.email,
                resident_name=complaint.creator.full_name
            )
            
    threshold_days = get_overdue_threshold(db)
    return map_to_complaint_out(complaint, threshold_days)
