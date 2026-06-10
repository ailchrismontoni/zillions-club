import { Trophy } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { formatCompactCurrency } from '@/lib/utils'

export interface ChampionCardData {
  name: string
  refSales: number
  refSalesValue: number
  dateRange: string
  label: string
  avatarUrl?: string
}

export function ChampionCard({ champion }: { champion: ChampionCardData }) {
  return (
    <div className="card-lift relative flex h-full items-center justify-between gap-4 overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-5 shadow-card">
      {/* glow */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-amber-300/30 blur-2xl" />

      <div className="relative min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
            <Trophy className="h-3 w-3" />
            {champion.label}
          </span>
        </div>
        <h3 className="text-[15px] font-extrabold tracking-tight text-ink">
          Ref Sales Champion
        </h3>
        <p className="text-xs font-medium text-slate-500">{champion.dateRange}</p>
        <p className="mt-3 text-lg font-extrabold tracking-tight text-ink">
          {champion.name}
        </p>
        <p className="text-[13px] font-semibold text-amber-700">
          {champion.refSales} ref sales for{' '}
          {formatCompactCurrency(champion.refSalesValue)}
        </p>
      </div>

      <div className="relative shrink-0">
        <div className="absolute inset-0 -m-1 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 blur-[2px]" />
        <Avatar
          name={champion.name}
          size="xl"
          className="relative h-20 w-20 ring-4 ring-white"
        />
      </div>
    </div>
  )
}
