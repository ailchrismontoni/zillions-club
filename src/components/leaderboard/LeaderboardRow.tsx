import { cn, formatCompactCurrency } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'

interface LeaderboardRowProps {
  rank: number
  name: string
  subtitle: string
  alp: number
}

const RANK_STYLES: Record<number, string> = {
  1: 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm',
  2: 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-sm',
  3: 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-sm',
}

export function LeaderboardRow({ rank, name, subtitle, alp }: LeaderboardRowProps) {
  return (
    <div className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50">
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold tabular',
          RANK_STYLES[rank] ?? 'bg-slate-100 text-slate-500',
        )}
      >
        {rank}
      </span>
      <Avatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-bold text-ink">{name}</p>
        <p className="truncate text-[11.5px] text-slate-400">{subtitle}</p>
      </div>
      <span className="shrink-0 text-[14px] font-extrabold tabular text-ink">
        {formatCompactCurrency(alp)}
      </span>
    </div>
  )
}
