from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks
from app.models import HealthResponse
from app.services.embeddings import embedding_service
from app.config import settings
import pandas as pd
import subprocess
import os
from typing import List

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.post("/upload-medical-data")
async def upload_medical_data(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Upload new medical data CSV file
    
    - Accepts CSV file with medical information
    - Validates file format
    - Triggers background job to rebuild embeddings
    - Returns status
    """
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="Only CSV files are accepted"
            )
        
        # Save uploaded file
        data_path = "Data/dataset.csv"
        backup_path = "Data/dataset_backup.csv"
        
        # Backup existing file
        if os.path.exists(data_path):
            os.rename(data_path, backup_path)
        
        # Save new file
        content = await file.read()
        with open(data_path, "wb") as f:
            f.write(content)
        
        # Validate CSV structure
        try:
            df = pd.read_csv(data_path)
            if df.empty:
                raise ValueError("CSV file is empty")
            
            # Check required columns (adjust based on your needs)
            # Example: if 'disease' not in df.columns or 'symptoms' not in df.columns:
            #     raise ValueError("CSV must contain 'disease' and 'symptoms' columns")
            
        except Exception as e:
            # Restore backup if validation fails
            if os.path.exists(backup_path):
                os.rename(backup_path, data_path)
            raise HTTPException(
                status_code=400,
                detail=f"Invalid CSV format: {str(e)}"
            )
        
        # Schedule background task to rebuild embeddings
        background_tasks.add_task(rebuild_embeddings)
        
        return {
            "status": "success",
            "message": "File uploaded successfully. Rebuilding embeddings in background...",
            "filename": file.filename,
            "rows": len(df)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )

@router.post("/rebuild-embeddings")
async def trigger_rebuild_embeddings(background_tasks: BackgroundTasks):
    """
    Manually trigger embedding rebuild
    
    - Runs prepare_chunks.py and build_embeddings.py
    - Happens in background
    - Returns immediately
    """
    try:
        background_tasks.add_task(rebuild_embeddings)
        return {
            "status": "success",
            "message": "Embedding rebuild started in background"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error triggering rebuild: {str(e)}"
        )

@router.get("/embedding-stats")
async def get_embedding_stats():
    """
    Get statistics about current embeddings
    
    Returns:
        - Total documents
        - Collection name
        - Storage path
    """
    try:
        return {
            "collection_name": settings.COLLECTION_NAME,
            "storage_path": settings.CHROMA_PERSIST_PATH,
            "total_documents": embedding_service.get_document_count(),
            "status": "ready" if embedding_service.is_ready() else "not_ready"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting stats: {str(e)}"
        )

# Background task function
def rebuild_embeddings():
    """Rebuild embeddings from scratch"""
    try:
        print("🔄 Starting embedding rebuild...")
        
        # Run prepare_chunks.py
        print("📝 Preparing chunks...")
        subprocess.run(
            ["python", "scripts/prepare_chunks.py"],
            check=True,
            cwd=os.getcwd()
        )
        
        # Run build_embeddings.py
        print("🧠 Building embeddings...")
        subprocess.run(
            ["python", "scripts/build_embeddings.py"],
            check=True,
            cwd=os.getcwd()
        )
        
        print("✅ Embedding rebuild completed!")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error rebuilding embeddings: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
