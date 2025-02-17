import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DocumentListItem } from './DocumentListItem'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Document {
  filename: string
  processed_date: string
}

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/knowledge/documents`)
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Failed to load documents', {
        style: {
          border: '1px solid var(--primary)',
          color: 'var(--primary)',
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (filename: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/v1/knowledge/documents/${encodeURIComponent(filename)}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      const data = await response.json()
      toast.success(data.message, {
        style: {
          background: 'var(--primary)',
          color: 'black',
        },
      })

      // Update the documents list by removing the deleted document
      setDocuments(documents.filter(doc => doc.filename !== filename))
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document', {
        style: {
          border: '1px solid var(--primary)',
          color: 'var(--primary)',
        },
      })
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4 text-[var(--primary)]">
        Loading documents...
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-4 text-[var(--primary)] border border-dashed border-[var(--primary)] rounded">
        No documents have been processed yet.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map(doc => (
        <DocumentListItem
          key={doc.filename}
          filename={doc.filename}
          processedDate={doc.processed_date}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
} 