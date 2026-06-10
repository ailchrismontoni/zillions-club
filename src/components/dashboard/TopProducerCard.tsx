import { Mail, Shield, Star } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { formatCurrency } from '@/lib/utils'

export interface TopProducerCardData {
  name: string
  team: string
  role: string
  alp: number
  familiesProtected: number
  dateRange: string
  avatarUrl?: string
}

export function TopProducerCard({ producer }: { producer: TopProducerCardData }) {
  return (
    <div className="relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-navy-700 bg-navy-900 text-white shadow-broadcast">
      {/* Layered broadcast background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy-700 via-navy-800 to-navy-900" />
      <div className="pointer-events-none absolute inset-0 broadcast-streaks opacity-80" />
      {/* Abstract division shield watermark */}
      <div className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 select-none text-[260px] font-black leading-none text-white/[0.03]">
        ZC
      </div>
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-electric/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-electric/10 blur-2xl" />

      {/* Top bar */}
      <div className="relative flex items-start justify-between p-5">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
          {producer.dateRange}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-electric px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-glow">
          <Star className="h-3 w-3 fill-current" />
          Top Producer
        </span>
      </div>

      {/* Hero */}
      <div className="relative flex flex-1 items-end justify-between px-5">
        <div className="relative z-10 pb-4">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-electric-400 ring-1 ring-white/10">
            <Shield className="h-3 w-3" />
            Division Elite
          </div>
          <h2 className="text-[34px] font-black leading-[0.95] tracking-tight">
            {producer.name}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/10">
              {producer.team}
            </span>
            <span className="rounded-full bg-electric/20 px-3 py-1 text-xs font-semibold text-electric-400 ring-1 ring-electric/30">
              {producer.role}
            </span>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/20 hover:text-white"
              aria-label={`Message ${producer.name}`}
            >
              <Mail className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Player photo */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 -bottom-4 scale-110 rounded-full bg-gradient-to-t from-electric/40 to-transparent blur-2xl" />
          <div className="absolute inset-0 rounded-full ring-2 ring-electric/40" />
          <Avatar
            name={producer.name}
            size="xl"
            className="relative h-32 w-32 ring-4 ring-navy-700 sm:h-40 sm:w-40"
          />
        </div>
      </div>

      {/* Stat bar */}
      <div className="relative mt-4 grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 bg-black/20 backdrop-blur">
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
            ALP
          </p>
          <p className="mt-1 text-2xl font-black tabular tracking-tight">
            {formatCurrency(producer.alp)}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
            Families Protected
          </p>
          <p className="mt-1 text-2xl font-black tabular tracking-tight">
            {producer.familiesProtected}
          </p>
        </div>
      </div>
    </div>
  )
}
