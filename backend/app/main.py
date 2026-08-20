import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app.models.models import User, SystemSetting, Complaint, ComplaintStatusHistory
from app.core.security import get_password_hash
from app.core.config import settings
from app.routers import auth, complaints, notices, settings as settings_router
from datetime import datetime, timedelta

# Create Database tables (simple alternative to Alembic migrations for fast deployment)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Society Maintenance Tracker API",
    description="Backend service for tracking resident complaints and society notice board.",
    version="1.0.0"
)

# CORS middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify settings.FRONTEND_URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files statically
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(notices.router)
app.include_router(settings_router.router)

# Database seeding function
def seed_database():
    db: Session = SessionLocal()
    try:
        # 1. Seed System Settings
        overdue_setting = db.query(SystemSetting).filter(SystemSetting.key == "overdue_threshold_days").first()
        if not overdue_setting:
            db.add(SystemSetting(key="overdue_threshold_days", value="3")) # Default to 3 days for demo
            
        # 2. Seed Users
        admin = db.query(User).filter(User.email == "admin@society.com").first()
        if not admin:
            admin = User(
                email="admin@society.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin Manager",
                role="admin",
                unit_number="Office 1A"
            )
            db.add(admin)
            
        resident = db.query(User).filter(User.email == "resident@society.com").first()
        if not resident:
            resident = User(
                email="resident@society.com",
                hashed_password=get_password_hash("resident123"),
                full_name="Dipanjan Choudhury",
                role="resident",
                unit_number="Flat 402"
            )
            db.add(resident)
            
        db.commit()
        db.refresh(admin)
        db.refresh(resident)
        
        # 3. Seed some demo complaints if empty
        complaints_count = db.query(Complaint).count()
        if complaints_count == 0:
            # Active normal complaint
            c1 = Complaint(
                title="Leaking pipe in bathroom",
                description="The main drain pipe under the bathroom sink is leaking slowly and dripping onto the cabinet floor.",
                category="Plumbing",
                status="Open",
                priority="Medium",
                creator_id=resident.id,
                created_at=datetime.utcnow() - timedelta(hours=10)
            )
            db.add(c1)
            
            # Overdue complaint
            c2 = Complaint(
                title="Elevator B fan broken",
                description="The ventilation fan in Elevator B has ceased working. It gets extremely hot and suffocating.",
                category="Common Area",
                status="Open",
                priority="High",
                creator_id=resident.id,
                created_at=datetime.utcnow() - timedelta(days=5)  # Older than 3 days threshold
            )
            db.add(c2)
            
            # In progress complaint
            c3 = Complaint(
                title="Sparks from corridor light switch",
                description="When turning on the light on the 4th-floor corridor, small sparks are visible from the switch plate.",
                category="Electrical",
                status="In_Progress",
                priority="High",
                creator_id=resident.id,
                created_at=datetime.utcnow() - timedelta(days=2)
            )
            db.add(c3)
            
            db.commit()
            db.refresh(c1)
            db.refresh(c2)
            db.refresh(c3)
            
            # Log history
            db.add(ComplaintStatusHistory(
                complaint_id=c1.id, status="Open", priority="Medium", note="Complaint submitted.", actor_id=resident.id, created_at=c1.created_at
            ))
            db.add(ComplaintStatusHistory(
                complaint_id=c2.id, status="Open", priority="High", note="Complaint submitted.", actor_id=resident.id, created_at=c2.created_at
            ))
            db.add(ComplaintStatusHistory(
                complaint_id=c3.id, status="Open", priority="High", note="Complaint submitted.", actor_id=resident.id, created_at=c3.created_at - timedelta(hours=12)
            ))
            db.add(ComplaintStatusHistory(
                complaint_id=c3.id, status="In_Progress", priority="High", note="Electrician scheduled for inspection.", actor_id=admin.id, created_at=c3.created_at
            ))
            
            db.commit()
            
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    seed_database()

@app.get("/")
def read_root():
    return {"message": "Society Maintenance Tracker API is running."}
