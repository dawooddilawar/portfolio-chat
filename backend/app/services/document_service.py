# backend/app/services/document_service.py

from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import HTTPException
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class DocumentService:
    """
    Service for handling document-related operations including deletion
    from the vector store.
    """
    
    @staticmethod
    async def delete_document(db: Session, filename: str) -> Dict[str, Any]:
        """
        Delete a specific document and its chunks from the vector store.
        
        Args:
            db: Database session
            filename: Document filename to delete
            
        Returns:
            Dict with message and deletion info
        """
        try:
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
                {"filename_pattern": f"%{filename}"}
            ).fetchall()
            
            if not result:
                raise HTTPException(
                    status_code=404,
                    detail=f"Document {filename} not found"
                )
                
            # Get unique collection IDs and chunk UUIDs
            chunk_uuids = [str(row.uuid) for row in result]
            collection_ids = list(set(str(row.collection_id) for row in result))
            
            # Delete the chunks using proper UUID casting
            deleted = db.execute(
                text("""
                    DELETE FROM langchain_pg_embedding
                    WHERE uuid = ANY(SELECT CAST(UNNEST(:chunk_uuids) AS UUID))
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
                        WHERE collection_id = CAST(:collection_id AS UUID)
                    """),
                    {"collection_id": collection_id}
                )
                count = remaining.scalar()
                
                if count == 0:
                    # Delete the empty collection
                    db.execute(
                        text("""
                            DELETE FROM langchain_pg_collection 
                            WHERE uuid = CAST(:collection_id AS UUID)
                        """),
                        {"collection_id": collection_id}
                    )
            
            db.commit()
            
            logger.info(f"Successfully deleted document {filename} with {deleted_count} chunks")
                
            return {
                "message": f"Document {filename} deleted successfully",
                "deleted_chunks": deleted_count
            }
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting document: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error deleting document: {str(e)}"
            )
    
    @staticmethod
    async def delete_documents_by_filenames(db: Session, filenames: List[str]) -> Dict[str, Any]:
        """
        Delete multiple documents by their filenames.
        
        Args:
            db: Database session
            filenames: List of document filenames to delete
            
        Returns:
            Dict with results of deletion operation
        """
        results = {
            "deleted": [],
            "not_found": []
        }
        
        for filename in filenames:
            try:
                await DocumentService.delete_document(db, filename)
                results["deleted"].append(filename)
            except HTTPException as e:
                if e.status_code == 404:
                    results["not_found"].append(filename)
                else:
                    raise
        
        return results