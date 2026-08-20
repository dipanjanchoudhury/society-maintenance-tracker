from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.models import SystemSetting, User
from app.schemas.schemas import SettingOut, SettingUpdate
from app.core.security import require_admin

router = APIRouter(prefix="/api/settings", tags=["System Settings"])

@router.get("", response_model=List[SettingOut])
def get_settings(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Ensure default settings exist
    default_settings = {
        "overdue_threshold_days": "5"
    }
    
    for key, val in default_settings.items():
        exists = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if not exists:
            db_setting = SystemSetting(key=key, value=val)
            db.add(db_setting)
            db.commit()
            
    settings = db.query(SystemSetting).all()
    return settings

@router.put("/{key}", response_model=SettingOut)
def update_setting(
    key: str,
    setting_in: SettingUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        # Create it if it doesn't exist
        setting = SystemSetting(key=key, value=setting_in.value)
        db.add(setting)
    else:
        setting.value = setting_in.value
        
    db.commit()
    db.refresh(setting)
    return setting
