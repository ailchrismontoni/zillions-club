import { useMemo, useState } from 'react'
import { BarChart3, Plus, Target, TrendingUp } from 'lucide-react'
import type { Agent } from '@/types'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { computeStats, monthlySeries, DEFAULT_GOALS } from '@/services/stats'
import { thisMonth, lastMonth, thisWeek, thisYear, type DateRange } from '@/lib/dateRanges'
import { formatCompactCurrency, formatCurrency, formatPercent, cn } from '@/lib/utils'
import { ROLE_ABBREV, agentNameClass } from '@/lib/agentMeta'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { StatTile } from '@/components/ui/StatTile'
import { EmptyState } from '@/components/ui/EmptyState'
import { RoleBadge } from '@/components/admin/RoleBadge'
import { CircularProgressStat, MultiRingChart, RingLegend, type RingDef } from '@/components/stats/RingChart'
import { TrendChart } from '@/components/stats/TrendChart'
import { GoalsModal } from '@/components/stats/GoalsModal'
import { SubmitDailyNumbersModal } from '@/components/agents/SubmitDailyNumbersModal'

type RangeKey = 'This Week' | 'This Month' | 'Last Month' | 'This Year' | 'Custom Range'
const RANGE_KEYS: RangeKey[] = ['This Week', 'This Month', 'Last Month', 'This Year', 'Custom Range']

const C = { blue: '#2563ff', green: '#10b981', violet: '#7c3aed', amber: '#f59e0b', pink: '#ec4899' }
const avg = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export function StatsPage() {
  const agents = useAppStore((s) => s.agents)
  const production = useAppStore((s) => s.production)
  const addDailyNumbers = useAppStore((s) => s.addDailyNumbers)
  const { agent: me, can } = useAuth()
  const { toast } = useToast()

  const canViewOthers = can('view_team_stats') || can('view_all_stats')
  const canEditGoals = can('edit_user_goals')

  const [selectedId, setSelectedId] = useState(me?.id ?? '')
  const [rangeKey, setRangeKey] = useState<RangeKey>('This Month')
  const [customStart, setCustomStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0, 10))
  const [goalsOpen, setGoalsOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)

  // Agents this user is allowed to view.
  const viewable = useMemo(() => {
    if (!me) return []
    if (can('view_all_stats')) return agents
    if (can('view_team_stats')) {
      const down = new Set<string>([me.id])
      const walk = (id: string) => agents.filter((a) => a.leaderId === id).forEach((c) => { if (!down.has(c.id)) { down.add(c.id); walk(c.id) } })
      walk(me.id)
      return agents.filter((a) => down.has(a.id))
    }
    return agents.filter((a) => a.id === me.id)
  }, [agents, me, can])

  const agent: Agent | null = agents.find((a) => a.id === selectedId) ?? me ?? null
  const goals = agent?.goals ?? DEFAULT_GOALS
  const viewingSelf = agent?.id === me?.id

  const entries = useMemo(() => production.filter((p) => p.agentId === agent?.id), [production, agent])

  const range: DateRange = useMemo(() => {
    switch (rangeKey) {
      case 'This Week': return thisWeek()
      case 'This Month': return thisMonth()
      case 'Last Month': return lastMonth()
      case 'This Year': return thisYear()
      case 'Custom Range': return { start: new Date(`${customStart}T00:00:00`), end: new Date(`${customEnd}T23:59:59`) }
    }
  }, [rangeKey, customStart, customEnd])

  const rangeStats = useMemo(() => computeStats(entries, range), [entries, range])
  const monthStats = useMemo(() => computeStats(entries, thisMonth()), [entries])
  const yearStats = useMemo(() => computeStats(entries, thisYear()), [entries])
  const year = new Date().getFullYear()
  const alpSeries = useMemo(() => monthlySeries(entries, year, (e) => e.alp), [entries, year])
  const salesSeries = useMemo(() => monthlySeries(entries, year, (e) => e.salesCount), [entries, year])
  const refAlpSeries = useMemo(() => monthlySeries(entries, year, (e) => e.referralAlp ?? 0), [entries, year])

  if (!agent) return null

  const uplineName = agent.leaderId ? agents.find((a) => a.id === agent.leaderId)?.fullName ?? null : null
  const hasData = entries.length > 0

  const yearlyRings: RingDef[] = [
    { label: 'Yearly ALP', value: formatCompactCurrency(yearStats.totalAlp), progress: yearStats.totalAlp / Math.max(1, goals.yearlyAlpGoal), color: C.blue },
    { label: 'Referral ALP', value: formatCompactCurrency(yearStats.totalReferralAlp), progress: yearStats.totalReferralAlp / Math.max(1, goals.yearlyAlpGoal * 0.25), color: C.pink },
    { label: 'Deals Sold', value: String(yearStats.dealsSold), progress: yearStats.dealsSold / Math.max(1, goals.monthlySalesGoal * 12), color: C.green },
    { label: 'Refs Sold', value: String(yearStats.refsSold), progress: yearStats.refsSold / Math.max(1, goals.monthlyReferralGoal * 12 * 0.25), color: C.amber },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stats"
        description="Your personal production scoreboard."
        actions={
          <div className="flex items-center gap-2">
            {canViewOthers && (
              <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="h-9 w-52"
                options={viewable.map((a) => ({ label: a.id === me?.id ? `${a.fullName} (you)` : a.fullName, value: a.id }))} />
            )}
            {canEditGoals && (
              <Button variant="secondary" size="sm" onClick={() => setGoalsOpen(true)}><Target className="h-3.5 w-3.5" /> Set Goals</Button>
            )}
            {viewingSelf && (
              <Button variant="primary" size="sm" onClick={() => setSubmitOpen(true)}><Plus className="h-3.5 w-3.5" /> Submit Numbers</Button>
            )}
          </div>
        }
      />

      {/* Profile header */}
      <Card className="relative overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-navy-800 via-navy-700 to-electric-600 broadcast-streaks" />
        <div className="px-6 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar name={agent.fullName} src={agent.avatarUrl} size="xl" className="-mt-9 h-[72px] w-[72px] ring-4 ring-white" />
              <div className="pb-0.5">
                <div className="flex items-center gap-2">
                  <h2 className={cn('text-xl', agentNameClass(agent.role))}>{agent.fullName}</h2>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{ROLE_ABBREV[agent.role]}</span>
                  <RoleBadge role={agent.platformRole ?? 'agent'} />
                </div>
                <p className="text-[13px] text-slate-500">{agent.teamName}{uplineName && ` · Reports to ${uplineName}`}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <HeaderStat label="Month ALP" value={formatCompactCurrency(monthStats.totalAlp)} />
            <HeaderStat label="Year ALP" value={formatCompactCurrency(yearStats.totalAlp)} />
            <HeaderStat label="Closing Ratio" value={formatPercent(monthStats.closingRatio)} />
            <HeaderStat label="Refs Collected" value={String(monthStats.refsCollected)} />
            <HeaderStat label="Sales (mo)" value={String(monthStats.dealsSold)} />
          </div>
        </div>
      </Card>

      {/* Time filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-0.5 shadow-card">
          {RANGE_KEYS.map((k) => (
            <button key={k} onClick={() => setRangeKey(k)} className={cn('rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors', rangeKey === k ? 'bg-ink text-white shadow-sm' : 'text-slate-500 hover:text-ink')}>{k}</button>
          ))}
        </div>
        {rangeKey === 'Custom Range' && (
          <div className="flex items-center gap-2">
            <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-9 w-40" />
            <span className="text-slate-400">→</span>
            <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-9 w-40" />
          </div>
        )}
      </div>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No stats yet"
          description="Submit your daily numbers to start building your production dashboard."
          action={viewingSelf ? <Button variant="primary" size="sm" onClick={() => setSubmitOpen(true)}><Plus className="h-3.5 w-3.5" /> Submit Daily Numbers</Button> : undefined}
        />
      ) : (
        <>
          {/* Monthly Production Overview */}
          <Card className="p-6">
            <h3 className="mb-5 text-[15px] font-bold text-ink">Production Overview <span className="font-medium text-slate-400">· {rangeKey}</span></h3>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <CircularProgressStat value={formatCompactCurrency(rangeStats.totalAlp)} label="ALP Written" color={C.blue}
                progress={rangeStats.totalAlp / Math.max(1, goals.monthlyAlpGoal)} sublabel={`${Math.round((rangeStats.totalAlp / Math.max(1, goals.monthlyAlpGoal)) * 100)}% to goal`} />
              <CircularProgressStat value={rangeStats.dealsSold} label="Deals Sold" color={C.green}
                progress={rangeStats.dealsSold / Math.max(1, goals.monthlySalesGoal)} sublabel={`${Math.round((rangeStats.dealsSold / Math.max(1, goals.monthlySalesGoal)) * 100)}% to goal`} />
              <CircularProgressStat value={rangeStats.appointmentsSat} label="Appointments Sat" color={C.violet}
                progress={rangeStats.appointmentsSat / Math.max(1, goals.monthlyAppointmentsGoal)} sublabel={`${Math.round((rangeStats.appointmentsSat / Math.max(1, goals.monthlyAppointmentsGoal)) * 100)}% to goal`} />
              <CircularProgressStat value={rangeStats.refsCollected} label="Refs Collected" color={C.amber}
                progress={rangeStats.refsCollected / Math.max(1, goals.monthlyReferralGoal)} sublabel={`${Math.round((rangeStats.refsCollected / Math.max(1, goals.monthlyReferralGoal)) * 100)}% to goal`} />
            </div>
          </Card>

          {/* Yearly multi-ring + Closing ratio */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <h3 className="mb-4 text-[15px] font-bold text-ink">{year} Production</h3>
              <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-around">
                <MultiRingChart rings={yearlyRings} centerTitle={`${year} Production`} centerValue={formatCompactCurrency(yearStats.totalAlp)} />
                <div className="w-full max-w-xs"><RingLegend rings={yearlyRings} /></div>
              </div>
            </Card>

            <Card className="flex flex-col items-center p-6">
              <h3 className="mb-3 self-start text-[15px] font-bold text-ink">Closing Performance</h3>
              <CircularProgressStat size={190} value={formatPercent(rangeStats.closingRatio)} label="Closing Ratio" color={C.blue} progress={rangeStats.closingRatio} />
              <div className="mt-4 grid w-full grid-cols-2 gap-3">
                <MiniStat value={rangeStats.appointmentsSat} label="Presentations" />
                <MiniStat value={rangeStats.dealsSold} label="Sales" />
              </div>
            </Card>
          </div>

          {/* Referral Performance */}
          <Card className="p-6">
            <h3 className="mb-4 text-[15px] font-bold text-ink">Referral Performance <span className="font-medium text-slate-400">· {rangeKey}</span></h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <StatTile label="Refs Collected" value={rangeStats.refsCollected} tone="orange" />
              <StatTile label="Refs Seen" value={rangeStats.refsSeen} tone="blue" />
              <StatTile label="Refs Sold" value={rangeStats.refsSold} tone="green" />
              <StatTile label="Ref ALP" value={formatCompactCurrency(rangeStats.totalReferralAlp)} tone="purple" />
              <StatTile label="Avg Refs / Sit" value={avg(rangeStats.averageRefsPerSit)} />
              <StatTile label="Referral Close" value={formatPercent(rangeStats.referralCloseRatio)} tone="orange" />
            </div>
          </Card>

          {/* Averages */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <BigStat value={formatCurrency(rangeStats.averageAlpPerDeal)} label="Average ALP Per Deal" icon={TrendingUp} color="text-electric" />
            <BigStat value={avg(rangeStats.averageRefsPerSit)} label="Average Refs Per Sit" icon={TrendingUp} color="text-amber-500" />
            <BigStat value={rangeStats.appointmentsScheduled} label="Appointments Scheduled" icon={TrendingUp} color="text-violet-500" />
          </div>

          {/* Trends */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="p-5"><TrendTitle title="Monthly ALP" /><TrendChart data={alpSeries} color={C.blue} format={(v) => formatCompactCurrency(v)} /></Card>
            <Card className="p-5"><TrendTitle title="Monthly Sales" /><TrendChart data={salesSeries} color={C.green} format={(v) => String(v)} /></Card>
            <Card className="p-5"><TrendTitle title="Referral ALP" /><TrendChart data={refAlpSeries} color={C.pink} format={(v) => formatCompactCurrency(v)} /></Card>
          </div>
        </>
      )}

      <GoalsModal agent={goalsOpen ? agent : null} onClose={() => setGoalsOpen(false)} />
      {me && (
        <SubmitDailyNumbersModal open={submitOpen} onClose={() => setSubmitOpen(false)} onSubmit={(d) => { addDailyNumbers(me.id, d); toast({ title: 'Daily numbers submitted', variant: 'success' }) }} />
      )}
    </div>
  )
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-[17px] font-extrabold tabular tracking-tight text-ink">{value}</p>
    </div>
  )
}
function MiniStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
      <p className="text-[18px] font-extrabold tabular text-ink">{value}</p>
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  )
}
function BigStat({ value, label, icon: Icon, color }: { value: string | number; label: string; icon: typeof TrendingUp; color: string }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50', color)}><Icon className="h-6 w-6" /></span>
      <div>
        <p className="text-2xl font-black tracking-tight tabular text-ink">{value}</p>
        <p className="text-[12.5px] font-semibold text-slate-500">{label}</p>
      </div>
    </Card>
  )
}
function TrendTitle({ title }: { title: string }) {
  return <h3 className="mb-2 text-[14px] font-bold text-ink">{title} <span className="text-[11px] font-medium text-slate-400">· {new Date().getFullYear()}</span></h3>
}
