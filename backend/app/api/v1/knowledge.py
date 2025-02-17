from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import tempfile
import os
from datetime import datetime
from app.services.document_processor import DocumentProcessor
from app.db.session import SessionLocal
from sqlalchemy import text

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
            file_names = []
            for file in files:
                file_path = os.path.join(temp_dir, file.filename)
                with open(file_path, 'wb') as f:
                    content = await file.read()
                    f.write(content)
                file_paths.append(file_path)
                file_names.append(file.filename)

            # Process documents
            processor = DocumentProcessor()
            await processor.process_documents(file_paths, clear_existing=False)

        return {
            "message": "Files processed successfully",
            "details": {
                "processed_files": file_names,
                "count": len(file_names)
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing files: {str(e)}"
        )

@router.get("/documents")
async def list_documents():
    """
    Get a list of all processed documents in the vector store.
    """
    try:
        db = SessionLocal()
        # Query to get distinct documents with their latest processed date
        query = text("""
            SELECT DISTINCT ON (metadata->>'source') 
                metadata->>'source' as filename,
                created_at as processed_date
            FROM langchain_pg_embedding
            WHERE collection_name = 'portfolio_chunks'
            ORDER BY metadata->>'source', created_at DESC;
        """)
        
        result = db.execute(query)
        documents = [
            {
                "filename": row.filename,
                "processed_date": row.processed_date.isoformat()
            }
            for row in result
        ]
        db.close()
        return documents
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching documents: {str(e)}"
        )

@router.delete("/documents/{filename}")
async def delete_document(filename: str):
    """
    Delete a specific document and its chunks from the vector store.
    """
    try:
        db = SessionLocal()
        # Delete all chunks for the specified document
        query = text("""
            DELETE FROM langchain_pg_embedding
            WHERE collection_name = 'portfolio_chunks'
            AND metadata->>'source' = :filename;
        """)
        
        result = db.execute(query, {"filename": filename})
        db.commit()
        db.close()
        
        if result.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Document {filename} not found"
            )
            
        return {
            "message": f"Document {filename} deleted successfully",
            "deleted_chunks": result.rowcount
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting document: {str(e)}"
        ) 