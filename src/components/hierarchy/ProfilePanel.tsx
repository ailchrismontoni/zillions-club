import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Mail, MapPin, Phone, Users, X } from 'lucide-react'
import type { HierNode } from '@/services/hierarchy'
import { descendants, teamAggregate } from '@/services/hierarchy'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { AGENT_STATUS_TONE, ROLE_ABBREV, agentNameClass } from '@/lib/agentMeta'
import { cn, formatCompactCurrency, formatPercent, formatPhone } from '@/lib/utils'
import { formatShortDate } from '@/lib/dateRanges'

function seventhMonth(iso: string): string {
  const d = new Date(iso)
  const s = new Date(d.getFullYear(), d.getMonth() + 6, 1)
  return formatShortDate(s.toISOString())
}
function f6Flag(iso: string): 'Yes' | 'No' {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30.4) <= 6 ? 'Yes' : 'No'
}

export function ProfilePanel({
  node,
  uplineName,
  onClose,
  onSelectAgent,
}: {
  node: HierNode | null
  uplineName: string | null
  onClose: () => void
  onSelectAgent: (id: string) => void
}) {
  const [fullDownline, setFullDownline] = useState(false)
  if (!node) return null

  const { agent, stats } = node.data
  const isLeader = node.children.length > 0
  const agg = isLeader ? teamAggregate(node) : null
  const downline = fullDownline ? descendants(node) : node.children
  const leaderboard = [...descendants(node)].sort((a, b) => b.data.stats.weeklyAlp - a.data.stats.weeklyAlp).slice(0, 5)

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-broadcast animate-slide-in-right">
        {/* Header */}
        <div className="relative h-20 bg-gradient-to-r from-navy-800 to-electric-600 broadcast-streaks">
          <button onClick={onClose} className="absolute right-3 top-3 rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="-mt-9 flex items-end gap-3">
            <Avatar name={agent.fullName} src={agent.avatarUrl} size="xl" className="h-[72px] w-[72px] ring-4 ring-white" />
            <div className="pb-1">
              <div className="flex items-center gap-1.5">
                <h2 className={cn('text-lg', agentNameClass(agent.role))}>{agent.fullName}</h2>
                {ROLE_ABBREV[agent.role] && <span className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-bold text-slate-500">{ROLE_ABBREV[agent.role]}</span>}
              </div>
              <p className="text-[12.5px] text-slate-500">{agent.role} · {agent.teamName}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Badge tone={AGENT_STATUS_TONE[agent.status]} dot>{agent.status}</Badge>
            <Link to={`/agents/${agent.id}`} className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-electric hover:underline">
              Full profile <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Upline */}
          <Section title="Reports to">
            <p className="text-[13px] font-medium text-ink">{uplineName ?? 'Top of agency'}</p>
          </Section>

          {/* Numbers */}
          <Section title="Production">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="This Week ALP" value={formatCompactCurrency(stats.weeklyAlp)} />
              <Stat label="This Month ALP" value={formatCompactCurrency(stats.monthlyAlp)} />
              <Stat label="Close Rate" value={formatPercent(stats.closeRate)} />
              <Stat label="Show Rate" value={formatPercent(stats.showRate)} />
            </div>
          </Section>

          {/* Leader team stats */}
          {agg && (
            <Section title="Team production">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Total under" value={String(agg.totalUnder)} />
                <Stat label="Direct" value={String(agg.directCount)} />
                <Stat label="Team Wk ALP" value={formatCompactCurrency(agg.weeklyAlp)} />
                <Stat label="Team Mo ALP" value={formatCompactCurrency(agg.monthlyAlp)} />
                <Stat label="Sales (wk)" value={String(agg.weeklySales)} />
                <Stat label="Appts (wk)" value={String(agg.weeklyAppointments)} />
                <Stat label="Referrals (wk)" value={String(agg.weeklyReferrals)} />
              </div>
            </Section>
          )}

          {/* Downline */}
          {(node.children.length > 0 || descendants(node).length > 0) && (
            <Section
              title={`Downline (${downline.length})`}
              action={
                descendants(node).length > node.children.length ? (
                  <button onClick={() => setFullDownline((v) => !v)} className="text-[11.5px] font-semibold text-electric hover:underline">
                    {fullDownline ? 'Direct only' : 'Full downline'}
                  </button>
                ) : undefined
              }
            >
              <div className="space-y-1.5">
                {downline.map((c) => (
                  <button key={c.data.agent.id} onClick={() => onSelectAgent(c.data.agent.id)} className="flex w-full items-center gap-2.5 rounded-lg border border-slate-100 px-2.5 py-1.5 text-left transition-colors hover:bg-slate-50">
                    <Avatar name={c.data.agent.fullName} src={c.data.agent.avatarUrl} size="xs" />
                    <span className={cn('flex-1 truncate text-[12.5px]', agentNameClass(c.data.agent.role))}>{c.data.agent.fullName}</span>
                    {c.children.length > 0 && <span className="flex items-center gap-0.5 text-[10.5px] text-slate-400"><Users className="h-2.5 w-2.5" />{c.children.length}</span>}
                    <span className="text-[11.5px] font-bold tabular text-slate-600">{formatCompactCurrency(c.data.stats.weeklyAlp)}</span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* Team leaderboard */}
          {leaderboard.length > 0 && (
            <Section title="Team leaderboard (wk)">
              <div className="space-y-1">
                {leaderboard.map((c, i) => (
                  <div key={c.data.agent.id} className="flex items-center gap-2 text-[12.5px]">
                    <span className="w-4 text-right font-bold text-slate-400">{i + 1}</span>
                    <span className="flex-1 truncate text-slate-700">{c.data.agent.fullName}</span>
                    <span className="font-bold tabular text-ink">{formatCompactCurrency(c.data.stats.weeklyAlp)}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Dates / contact */}
          <Section title="Details">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
              <Detail label="Hire date" value={formatShortDate(agent.startDate)} />
              <Detail label="7th month" value={seventhMonth(agent.startDate)} />
              <Detail label="F6" value={f6Flag(agent.startDate)} />
              <Detail label="Contract" value={agent.contractLevel} />
            </div>
            <div className="mt-3 space-y-1.5 text-[12.5px]">
              <p className="flex items-center gap-2 text-slate-600"><Mail className="h-3.5 w-3.5 text-slate-400" />{agent.email}</p>
              <p className="flex items-center gap-2 text-slate-600"><Phone className="h-3.5 w-3.5 text-slate-400" />{formatPhone(agent.phone)}</p>
              <p className="flex items-center gap-2 text-slate-600"><MapPin className="h-3.5 w-3.5 text-slate-400" />{agent.location || '—'}</p>
            </div>
          </Section>

          {agent.notes && (
            <Section title="Notes">
              <p className="text-[12.5px] leading-relaxed text-slate-500">{agent.notes}</p>
            </Section>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-[15px] font-extrabold tabular text-ink">{value}</p>
    </div>
  )
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="font-semibold text-ink">{value}</p>
    </div>
  )
}
