import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, Hash, Sparkles, Trophy } from 'lucide-react'
import type { Agent } from '@/types'
import { useAppStore } from '@/app/store'
import { useAgentWithStats, useDashboardData } from '@/hooks/useAgencyData'
import { weeklyProductionSeries } from '@/services/agentStats'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DashboardActionCard } from '@/components/dashboard/DashboardActionCard'
import { AgentStatCards } from '@/components/agents/AgentStatCards'
import { ProductionChart } from '@/components/agents/ProductionChart'
import { ReferralStatusBadge } from '@/components/refbook/ReferralStatusBadge'
import { formatCompactCurrency } from '@/lib/utils'
import { relativeTime } from '@/lib/dateRanges'

export function AgentDashboard({ agent }: { agent: Agent }) {
  const data = useAgentWithStats(agent.id)
  const production = useAppStore((s) => s.production)
  const referrals = useAppStore((s) => s.referrals)
  const aiActivity = useAppStore((s) => s.aiActivity)
  const { producers } = useDashboardData()

  const series = useMemo(() => weeklyProductionSeries(agent.id, production), [agent.id, production])
  const myRefs = useMemo(
    () => referrals.filter((r) => r.agentId === agent.id).slice(0, 5),
    [referrals, agent.id],
  )
  const myActivity = useMemo(() => aiActivity.filter((a) => a.agentId === agent.id).slice(0, 5), [aiActivity, agent.id])
  const rank = producers.findIndex((p) => p.agent.id === agent.id) + 1

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardActionCard icon={BookOpen} label="My Ref Book" to="/ref-book" gradient="bg-gradient-to-br from-violet-50 to-purple-100/70" iconColor="text-violet-500" />
        <DashboardActionCard icon={Hash} label="My Numbers" to="/my-numbers" gradient="bg-gradient-to-br from-sky-50 to-blue-100/70" iconColor="text-electric" />
        <DashboardActionCard icon={Sparkles} label="AI CRM" to={`/agents/${agent.id}`} gradient="bg-gradient-to-br from-emerald-50 to-teal-100/70" iconColor="text-emerald-500" />
        <Link to="/teams" className="col-span-2 lg:col-span-1">
          <Card className="card-lift flex h-full items-center gap-3 bg-gradient-to-br from-amber-50 to-orange-100/70 p-5">
            <Trophy className="h-7 w-7 text-amber-500" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">My Rank</p>
              <p className="text-xl font-extrabold text-ink">{rank > 0 ? `#${rank}` : '—'}</p>
            </div>
          </Card>
        </Link>
      </div>

      <AgentStatCards stats={data.stats} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <div>
              <h3 className="text-[15px] font-bold text-ink">My weekly production</h3>
              <p className="text-[12.5px] text-slate-500">ALP written over the last 7 days</p>
            </div>
            <Badge tone="blue">{formatCompactCurrency(data.stats.weeklyAlp)} this week</Badge>
          </div>
          <div className="px-3 py-4"><ProductionChart data={series} /></div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-ink">My referrals</h3>
              <Link to="/ref-book" className="flex items-center gap-0.5 text-[12px] font-semibold text-electric hover:underline">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {myRefs.length === 0 && <p className="text-[13px] text-slate-400">No referrals yet.</p>}
              {myRefs.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2">
                  <p className="truncate text-[13px] font-semibold text-ink">{r.name}</p>
                  <ReferralStatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-ink">
              <Sparkles className="h-4 w-4 text-violet-400" /> My AI activity
            </h3>
            <div className="space-y-3">
              {myActivity.length === 0 && <p className="text-[13px] text-slate-400">No AI activity yet.</p>}
              {myActivity.map((a) => (
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
        </div>
      </div>
    </div>
  )
}
