import { useMemo } from 'react'
import { CalendarClock, Sparkles, Users } from 'lucide-react'
import type { Agent, ComputedAgentStats } from '@/types'
import { useAppStore } from '@/app/store'
import { weeklyProductionSeries } from '@/services/agentStats'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProductionChart } from '@/components/agents/ProductionChart'
import { ReferralStatusBadge } from '@/components/refbook/ReferralStatusBadge'
import { formatCompactCurrency, formatCurrency } from '@/lib/utils'
import { relativeTime } from '@/lib/dateRanges'

export function OverviewTab({ agent, stats }: { agent: Agent; stats: ComputedAgentStats }) {
  const production = useAppStore((s) => s.production)
  const referrals = useAppStore((s) => s.referrals)
  const aiActivity = useAppStore((s) => s.aiActivity)

  const series = useMemo(() => weeklyProductionSeries(agent.id, production), [agent.id, production])
  const recentReferrals = useMemo(
    () =>
      referrals
        .filter((r) => r.agentId === agent.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [referrals, agent.id],
  )
  const recentActivity = useMemo(
    () => aiActivity.filter((a) => a.agentId === agent.id).slice(0, 5),
    [aiActivity, agent.id],
  )

  const monthlyGoal = 25000
  const progress = Math.min(1, stats.monthlyAlp / monthlyGoal)

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Left: chart + progress */}
      <div className="space-y-5 lg:col-span-2">
        <Card>
          <div className="flex items-center justify-between px-5 pt-5">
            <div>
              <h3 className="text-[15px] font-bold text-ink">Weekly production</h3>
              <p className="text-[12.5px] text-slate-500">ALP written over the last 7 days</p>
            </div>
            <Badge tone="blue">{formatCompactCurrency(stats.weeklyAlp)} this week</Badge>
          </div>
          <div className="px-3 py-4">
            <ProductionChart data={series} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-ink">Monthly ALP progress</h3>
            <span className="text-[13px] font-semibold text-slate-500">
              {formatCurrency(stats.monthlyAlp)} / {formatCompactCurrency(monthlyGoal)}
            </span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-electric-500 to-electric-400 transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="mt-2 text-[12.5px] text-slate-400">
            {Math.round(progress * 100)}% to goal · {stats.salesCount} sales · avg{' '}
            {formatCompactCurrency(Math.round(stats.averageAlpPerSale))}/sale
          </p>
        </Card>

        <Card className="p-5">
          <h3 className="mb-1 text-[15px] font-bold text-ink">Notes</h3>
          <p className="text-[13px] leading-relaxed text-slate-500">
            {agent.notes?.trim() || 'No notes yet for this agent.'}
          </p>
          <p className="mt-3 text-[11px] text-slate-400">
            Last updated {relativeTime(agent.updatedAt)}
          </p>
        </Card>
      </div>

      {/* Right: recent activity */}
      <div className="space-y-5">
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-ink">
            <Users className="h-4 w-4 text-slate-400" /> Recent referrals
          </h3>
          <div className="space-y-2.5">
            {recentReferrals.length === 0 && <p className="text-[13px] text-slate-400">No referrals yet.</p>}
            {recentReferrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{r.name}</p>
                  <p className="truncate text-[11.5px] text-slate-400">{r.city || r.relation}</p>
                </div>
                <ReferralStatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-ink">
            <Sparkles className="h-4 w-4 text-violet-400" /> Recent AI activity
          </h3>
          <div className="space-y-3">
            {recentActivity.length === 0 && <p className="text-[13px] text-slate-400">No AI activity yet.</p>}
            {recentActivity.map((a) => (
              <div key={a.id} className="flex gap-2.5">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
                <div className="min-w-0">
                  <p className="text-[12.5px] leading-snug text-slate-600">{a.message}</p>
                  <p className="text-[11px] text-slate-400">{relativeTime(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-5">
          <CalendarClock className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="text-[13px] font-bold text-ink">{stats.appointmentsBooked} appointments booked</p>
            <p className="text-[12px] text-slate-400">via AgentOutreach AI</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
