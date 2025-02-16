from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import tempfile
import os
from app.services.document_processor import DocumentProcessor

router = APIRouter()

@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Upload knowledge base files (PDF or Markdown) to be processed and added to the vector store.
    """
    # Validate file types
    for file in files:
        if not (file.filename.endswith('.pdf') or file.filename.endswith('.md')):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type for {file.filename}. Only PDF and MD files are allowed."
            )

    try:
        # Create temporary directory to store files
        with tempfile.TemporaryDirectory() as temp_dir:
            # Save files to temporary directory
            file_paths = []
            for file in files:
                file_path = os.path.join(temp_dir, file.filename)
                with open(file_path, 'wb') as f:
                    content = await file.read()
                    f.write(content)
                file_paths.append(file_path)

            # Process documents
            processor = DocumentProcessor()
            await processor.process_documents(file_paths, clear_existing=False)

        return {"message": "Files processed successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing files: {str(e)}"
        ) 