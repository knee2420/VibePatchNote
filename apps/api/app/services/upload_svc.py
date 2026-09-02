import os
import shutil
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = "uploads"

def save_uploaded_file(file: UploadFile) -> str:
    """
    Saves an UploadFile to the local filesystem.
    Returns the absolute path to the saved file.
    """
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    return os.path.abspath(file_path)
