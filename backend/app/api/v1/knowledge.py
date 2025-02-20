from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import tempfile
import os
from datetime import datetime
from app.services.document_processor import DocumentProcessor
from app.db.session import SessionLocal
from sqlalchemy import text
from langchain_community.vectorstores.pgvector import PGVector
from langchain_openai import OpenAIEmbeddings
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()
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
            await processor.process_documents(file_paths, clear_existing=True)

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
        # Initialize PGVector store
        vector_store = PGVector(
            collection_name="portfolio_chunks",
            connection_string=settings.get_database_url(),
            embedding_function=OpenAIEmbeddings(model="text-embedding-3-small")
        )
        
        # Use similarity_search with a general query to get documents
        # We'll use a dummy embedding to get all documents
        docs = vector_store.similarity_search(
            "",
            k=1000  # Adjust this number based on your needs
        )
        
        # Process documents to get unique sources with their latest document's metadata
        document_map = {}
        for doc in docs:
            source = doc.metadata.get('source')
            if source:
                # Update only if this is a new document or has a more recent created_at
                if source not in document_map or (
                    doc.metadata.get('created_at', datetime.min) > 
                    document_map[source].get('created_at', datetime.min)
                ):
                    document_map[source] = {
                        'filename': os.path.basename(source),
                        'created_at': doc.metadata.get('created_at', datetime.now())
                    }
        
        documents = [
            {
                "filename": data['filename'],
                "processed_date": data['created_at'].isoformat() if isinstance(data['created_at'], datetime) else data['created_at']
            }
            for data in document_map.values()
        ]
        
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
        
        # Find all chunks for this document, handling potential path prefixes
        result = db.execute(
            text("""
                SELECT 
                    e.uuid,
                    e.collection_id,
                    e.cmetadata->>'source' as source
                FROM langchain_pg_embedding e
                WHERE e.cmetadata->>'source' LIKE :filename_pattern
            """),
            {"filename_pattern": f"%{filename}"}  # Use pattern matching to find the filename anywhere in the source path
        ).fetchall()
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Document {filename} not found"
            )
            
        # Get unique collection IDs and chunk UUIDs
        chunk_uuids = [str(row.uuid) for row in result]
        collection_ids = list(set(str(row.collection_id) for row in result))
        
        # Delete the chunks
        deleted = db.execute(
            text("""
                DELETE FROM langchain_pg_embedding
                WHERE uuid = ANY(:chunk_uuids)
                RETURNING uuid
            """),
            {"chunk_uuids": chunk_uuids}
        )
        
        # Count deleted rows
        deleted_count = len(deleted.all())
        
        if deleted_count == 0:
            db.rollback()
            raise HTTPException(
                status_code=404,
                detail=f"No chunks found for document {filename}"
            )
            
        # Check if this was the last document in any collections
        for collection_id in collection_ids:
            remaining = db.execute(
                text("""
                    SELECT COUNT(*) 
                    FROM langchain_pg_embedding 
                    WHERE collection_id = :collection_id
                """),
                {"collection_id": collection_id}
            ).scalar()
            
            if remaining == 0:
                # Delete the empty collection
                db.execute(
                    text("""
                        DELETE FROM langchain_pg_collection 
                        WHERE uuid = :collection_id
                    """),
                    {"collection_id": collection_id}
                )
        
        db.commit()
            
        return {
            "message": f"Document {filename} deleted successfully",
            "deleted_chunks": deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting document: {str(e)}"
        )
    finally:
        db.close()