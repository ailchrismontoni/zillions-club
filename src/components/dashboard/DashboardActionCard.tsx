import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardActionCardProps {
  icon: LucideIcon
  label: string
  to?: string
  badge?: string
  gradient: string
  iconColor: string
}

export function DashboardActionCard({
  icon: Icon,
  label,
  to,
  badge,
  gradient,
  iconColor,
}: DashboardActionCardProps) {
  const navigate = useNavigate()
  const clickable = Boolean(to)

  return (
    <button
      type="button"
      onClick={() => to && navigate(to)}
      disabled={!clickable}
      className={cn(
        'group relative flex h-full flex-col items-start gap-6 overflow-hidden rounded-2xl border border-slate-200/70 p-5 text-left shadow-card transition-all duration-300',
        clickable && 'card-lift cursor-pointer',
        gradient,
      )}
    >
      <div className="flex w-full items-start justify-between">
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur',
            iconColor,
          )}
        >
          <Icon className="h-[22px] w-[22px]" />
        </span>
        {badge && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[15px] font-bold tracking-tight text-ink">{label}</span>
    </button>
  )
}
