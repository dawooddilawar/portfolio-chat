"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, X, FileText, Check } from 'lucide-react'

interface FileWithPreview extends File {
  preview?: string
}

export function UploadKnowledge() {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const isValid = file.type === 'application/pdf' || file.name.endsWith('.md')
      if (!isValid) {
        toast.error(`Invalid file type: ${file.name}. Only PDF and MD files are allowed.`)
      }
      return isValid
    })

    setFiles(prevFiles => [
      ...prevFiles,
      ...validFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }))
    ])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md']
    }
  })

  const removeFile = (name: string) => {
    setFiles(files => files.filter(file => file.name !== name))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await fetch('/api/v1/knowledge/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Upload failed')
      }

      const data = await response.json()
      
      // Show success message with file details
      toast.success(
        <div className="space-y-1">
          <p>{data.message}</p>
          <p className="text-sm text-muted">
            Processed {data.details.count} file(s): {data.details.processed_files.join(', ')}
          </p>
        </div>
      )

      // Clear all files after successful upload
      setFiles([])
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload files')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`p-8 border-2 border-dashed cursor-pointer transition-colors
          ${isDragActive ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--primary)]'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload className="w-12 h-12 text-[var(--primary)]" />
          <div className="text-center">
            <p className="text-lg font-medium text-[var(--primary)]">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-[var(--primary)]">
              or click to select files
            </p>
          </div>
          <p className="text-xs text-[var(--primary)]">
            Supported formats: PDF, MD
          </p>
        </div>
      </Card>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.name}
                className="flex items-center justify-between p-2 bg-[var(--primary)]/5 rounded"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-sm text-[var(--primary)]">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file.name)}
                  className="text-[var(--primary)] hover:text-[var(--primary-hover)]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            className="w-full border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span className="mr-2">Uploading...</span>
                <span className="animate-spin">⚪</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Upload Files
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
} 