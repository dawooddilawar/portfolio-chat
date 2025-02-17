import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

interface DocumentListItemProps {
  filename: string
  processedDate: string
  onDelete: (filename: string) => void
}

export function DocumentListItem({ filename, processedDate, onDelete }: DocumentListItemProps) {
  const formattedDate = formatDistanceToNow(new Date(processedDate), { addSuffix: true })

  return (
    <div className="flex items-center justify-between p-3 rounded border border-[var(--primary)] text-[var(--primary)]">
      <div className="flex flex-col">
        <span className="font-medium">{filename}</span>
        <span className="text-sm opacity-80">Processed {formattedDate}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(filename)}
        className="text-[var(--primary)] hover:bg-[var(--primary)]/10"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
} 