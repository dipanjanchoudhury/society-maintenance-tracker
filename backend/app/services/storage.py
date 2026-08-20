import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

class StorageService:
    @staticmethod
    def validate_image(file: UploadFile):
        # 1. Validate Extension
        filename = file.filename or ""
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file extension. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # 2. Validate Size (approximate check by reading, but be careful not to consume stream fully without seek)
        # For simplicity, we assume frontend does size validation, and we also check on backend:
        # Note: file.file is a SpooledTemporaryFile or similar. We can check actual size:
        file.file.seek(0, 2)
        size_bytes = file.file.tell()
        file.file.seek(0)
        
        max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if size_bytes > max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB."
            )

    @staticmethod
    def save_image(file: UploadFile) -> str:
        StorageService.validate_image(file)
        
        filename = file.filename or "image.jpg"
        ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
        unique_filename = f"{uuid.uuid4().hex}.{ext}"
        
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not save file: {str(e)}"
            )
            
        # Return path that can be served statically (e.g. /uploads/filename.jpg)
        return f"/uploads/{unique_filename}"

    @staticmethod
    def delete_image(photo_path: str):
        if not photo_path:
            return
            
        filename = photo_path.replace("/uploads/", "")
        full_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except Exception:
                # Log error or ignore
                pass
