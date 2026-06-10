import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarCheck, DollarSign, HeartHandshake, Sparkles, Users } from 'lucide-react'
import type { Agent } from '@/types'
import { useAppStore } from '@/app/store'
import { useAgentsWithStats, useTeamStats } from '@/hooks/useAgencyData'
import { selectFollowUps } from '@/components/refbook/FollowUpSection'
import { StatTile } from '@/components/ui/StatTile'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LeaderboardCard } from '@/components/leaderboard/LeaderboardCard'
import { formatCompactCurrency } from '@/lib/utils'

export function TeamLeaderDashboard({ agent }: { agent: Agent }) {
  const navigate = useNavigate()
  const agentsWithStats = useAgentsWithStats()
  const teamStats = useTeamStats()
  const referrals = useAppStore((s) => s.referrals)

  const team = teamStats.find((t) => t.teamId === agent.teamId)
  const members = useMemo(
    () => agentsWithStats.filter((a) => a.agent.teamId === agent.teamId).sort((a, b) => b.stats.weeklyAlp - a.stats.weeklyAlp),
    [agentsWithStats, agent.teamId],
  )
  const teamFollowUps = useMemo(
    () => selectFollowUps(referrals.filter((r) => r.teamId === agent.teamId)),
    [referrals, agent.teamId],
  )

  if (!team) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Team ALP (wk)" value={formatCompactCurrency(team.weeklyAlp)} icon={DollarSign} tone="blue" />
        <StatTile label="Families" value={team.familiesProtected} icon={HeartHandshake} tone="green" />
        <StatTile label="Referrals" value={team.referralsCollected} icon={Users} />
        <StatTile label="AI Sent" value={team.referralsSentToAI} icon={Sparkles} tone="purple" />
        <StatTile label="Appts Booked" value={team.appointmentsBooked} icon={CalendarCheck} tone="green" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <LeaderboardCard
          title={`${team.teamName} Leaderboard`}
          subtitle={`Producers on your team this week.`}
          entries={members.slice(0, 5).map((m, i) => ({ id: m.agent.id, rank: i + 1, name: m.agent.fullName, subtitle: m.agent.role, alp: m.stats.weeklyAlp, to: `/agents/${m.agent.id}` }))}
          onFullLeaderboard={() => navigate('/teams')}
        />

        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-[15px] font-bold text-ink">Team roster</h3>
            <Badge tone="neutral">{members.length} agents</Badge>
          </div>
          <div className="divide-y divide-slate-50">
            {members.map(({ agent: a, stats }) => (
              <Link key={a.id} to={`/agents/${a.id}`} className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50">
                <Avatar name={a.fullName} src={a.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink">{a.fullName}</p>
                  <p className="truncate text-[11.5px] text-slate-400">{a.role}</p>
                </div>
                <Badge tone="neutral">{stats.referralsCollected} refs</Badge>
                <span className="w-16 text-right text-[13.5px] font-extrabold tabular text-ink">{formatCompactCurrency(stats.weeklyAlp)}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-1 text-[15px] font-bold text-ink">Agents needing follow-up</h3>
        <p className="mb-3 text-[12.5px] text-slate-500">Referrals on your team stuck in New or Contacted over 24h.</p>
        {teamFollowUps.length === 0 ? (
          <p className="text-[13px] text-slate-400">All caught up — nothing needs follow-up.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teamFollowUps.slice(0, 12).map((r) => (
              <Link key={r.id} to={`/agents/${r.agentId}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-medium text-slate-600 transition-colors hover:border-orange-300 hover:bg-orange-50">
                {r.name} <span className="text-slate-400">· {r.agentName}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
