import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatTileProps {
  label: string
  value: string | number
  icon?: LucideIcon
  hint?: string
  tone?: 'default' | 'blue' | 'green' | 'purple' | 'orange'
  className?: string
}

const ICON_TONE: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'bg-slate-100 text-slate-500',
  blue: 'bg-electric-50 text-electric',
  green: 'bg-emerald-50 text-emerald-500',
  purple: 'bg-violet-50 text-violet-500',
  orange: 'bg-orange-50 text-orange-500',
}

export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'default',
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition-shadow hover:shadow-lift',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        {Icon && (
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', ICON_TONE[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight tabular text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-slate-400">{hint}</p>}
    </div>
  )
}
