import { Check, Sparkles, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface BulkActionBarProps {
  count: number
  onMarkContacted: () => void
  onSendAI: () => void
  onDelete: () => void
  onClear: () => void
  sending?: boolean
}

export function BulkActionBar({
  count,
  onMarkContacted,
  onSendAI,
  onDelete,
  onClear,
  sending,
}: BulkActionBarProps) {
  if (count === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-ink px-3 py-2.5 text-white shadow-lift animate-slide-in-right">
        <span className="flex items-center gap-2 pl-1 pr-2 text-sm font-semibold">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-electric px-1.5 text-[12px] font-bold tabular">
            {count}
          </span>
          selected
        </span>
        <div className="h-5 w-px bg-white/15" />
        <Button
          variant="ghost"
          size="sm"
          className="text-white/90 hover:bg-white/10 hover:text-white"
          onClick={onMarkContacted}
        >
          <Check className="h-3.5 w-3.5" />
          Mark Contacted
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/90 hover:bg-white/10 hover:text-white"
          loading={sending}
          onClick={onSendAI}
        >
          {!sending && <Sparkles className="h-3.5 w-3.5" />}
          Send to AI
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-300 hover:bg-red-500/15 hover:text-red-200"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
        <div className="h-5 w-px bg-white/15" />
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:bg-white/10 hover:text-white"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>
    </div>
  )
}
