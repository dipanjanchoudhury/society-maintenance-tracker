from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime

# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    unit_number: Optional[str] = None
    role: Optional[str] = "resident"  # "resident" or "admin" (for demo convenience)

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    unit_number: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

# --- HISTORY SCHEMAS ---
class StatusHistoryOut(BaseModel):
    id: int
    complaint_id: int
    status: str
    priority: str
    note: Optional[str] = None
    actor_id: int
    created_at: datetime
    actor_name: str

    class Config:
        from_attributes = True

# --- COMPLAINT SCHEMAS ---
class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str

class ComplaintOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    photo_url: Optional[str] = None
    status: str
    priority: str
    creator_id: int
    created_at: datetime
    updated_at: datetime
    creator_name: str
    creator_unit: Optional[str] = None
    is_overdue: bool = False
    status_history: List[StatusHistoryOut] = []

    class Config:
        from_attributes = True

class ComplaintUpdate(BaseModel):
    status: str  # "Open", "In_Progress", "Resolved"
    priority: str  # "Low", "Medium", "High"
    note: Optional[str] = None

# --- NOTICE SCHEMAS ---
class NoticeCreate(BaseModel):
    title: str
    content: str
    is_important: Optional[bool] = False

class NoticeOut(BaseModel):
    id: int
    title: str
    content: str
    is_important: bool
    author_id: int
    created_at: datetime
    author_name: str

    class Config:
        from_attributes = True

# --- SETTING SCHEMAS ---
class SettingOut(BaseModel):
    key: str
    value: str

    class Config:
        from_attributes = True

class SettingUpdate(BaseModel):
    value: str

# --- DASHBOARD SCHEMAS ---
class DashboardStats(BaseModel):
    total_complaints: int
    open_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    overdue_complaints: int
    category_counts: Dict[str, int]
