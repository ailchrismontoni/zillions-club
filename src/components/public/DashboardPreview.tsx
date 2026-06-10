import { Sparkles, Trophy, TrendingUp } from 'lucide-react'

/** Stylized mock of the in-app command center, used as the hero visual. */
export function DashboardPreview() {
  const producers = [
    { name: 'Connor Hogan', team: 'Team Hogan', alp: '$6.5K', i: 1 },
    { name: 'Mitch Mickovic', team: 'Team Mickovic', alp: '$4.1K', i: 2 },
    { name: 'Chris Montoni', team: 'Team Montoni', alp: '$3.8K', i: 3 },
  ]
  const rankColor = ['from-amber-400 to-amber-500', 'from-slate-300 to-slate-400', 'from-orange-400 to-orange-500']

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2rem] bg-electric/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white shadow-broadcast">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div>
            <p className="text-[13px] font-extrabold tracking-tight text-ink">Agency Command Center</p>
            <p className="text-[11px] text-slate-400">Live production · 9 active agents</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
          </span>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-2 px-5 py-4">
          {[
            { label: 'Agency ALP', value: '$33.7K' },
            { label: 'Referrals', value: '244' },
            { label: 'AI Sent', value: '87' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="mt-0.5 text-[18px] font-extrabold tabular text-ink">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Leaderboard + side */}
        <div className="grid grid-cols-5 gap-3 px-5 pb-5">
          <div className="col-span-3 rounded-xl border border-slate-100 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-[11px] font-bold text-ink">Producer Leaderboard</p>
            </div>
            <div className="space-y-1.5">
              {producers.map((p, idx) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br ${rankColor[idx]} text-[9px] font-bold text-white`}>{p.i}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-ink">{p.name}</p>
                    <p className="truncate text-[9px] text-slate-400">{p.team}</p>
                  </div>
                  <span className="text-[11px] font-extrabold tabular text-ink">{p.alp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2 flex flex-col gap-3">
            <div className="flex-1 rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 p-3 text-white">
              <Sparkles className="h-4 w-4 text-electric-400" />
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">AI Outreach</p>
              <p className="text-[15px] font-extrabold">53 booked</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ref Book</p>
              <p className="text-[15px] font-extrabold tabular text-ink">244</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-xl border border-white/10 bg-navy-800 px-3 py-2 shadow-lift">
        <Sparkles className="h-4 w-4 text-electric-400" />
        <span className="text-[12px] font-bold text-white">AI-powered outreach</span>
      </div>
    </div>
  )
}
