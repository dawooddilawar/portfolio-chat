import { UploadKnowledge } from '@/components/upload/UploadKnowledge'

export default function UploadPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-3xl text-[var(--primary)]">
        <h1 className="mb-8 text-3xl font-bold text-center">Upload Knowledge Base</h1>
        <UploadKnowledge />
      </div>
    </main>
  )
} 