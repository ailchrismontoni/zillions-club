import { useNavigate } from 'react-router-dom'
import { Megaphone, Hash, BookOpen, MessageSquare } from 'lucide-react'
import { useDashboardData } from '@/hooks/useAgencyData'
import { DashboardActionCard } from '@/components/dashboard/DashboardActionCard'
import { ChampionCard } from '@/components/dashboard/ChampionCard'
import { AgencyStatsCards } from '@/components/dashboard/AgencyStatsCards'
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter'
import { TopProducerCard } from '@/components/dashboard/TopProducerCard'
import { LeaderboardCard } from '@/components/leaderboard/LeaderboardCard'
import { formatCompactCurrency } from '@/lib/utils'
import { formatRangeLabel, thisWeek } from '@/lib/dateRanges'

export function AgencyDashboard() {
  const navigate = useNavigate()
  const { totals, producers, teams, topProducer, champion } = useDashboardData()
  const weekLabel = formatRangeLabel(thisWeek())

  const championValue = champion
    ? Math.round((champion.stats.averageAlpPerSale || 1100) * champion.stats.soldReferrals)
    : 0

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <DashboardActionCard icon={Megaphone} label="Announcements" to="/announcements" badge={`${totals.unreadAnnouncements} unread`} gradient="bg-gradient-to-br from-rose-50 to-pink-100/70" iconColor="text-rose-500" />
        <DashboardActionCard icon={Hash} label="Numbers" to="/team-numbers" gradient="bg-gradient-to-br from-sky-50 to-blue-100/70" iconColor="text-electric" />
        <DashboardActionCard icon={BookOpen} label="Ref Book" to="/ref-book" gradient="bg-gradient-to-br from-violet-50 to-purple-100/70" iconColor="text-violet-500" />
        <DashboardActionCard icon={MessageSquare} label="Chat" to="/chat" gradient="bg-gradient-to-br from-emerald-50 to-teal-100/70" iconColor="text-emerald-500" />
        <div className="col-span-2">
          {champion && (
            <ChampionCard champion={{ name: champion.agent.fullName, refSales: champion.stats.soldReferrals, refSalesValue: championValue, dateRange: weekLabel, label: 'THIS WEEK', avatarUrl: champion.agent.avatarUrl }} />
          )}
        </div>
      </div>

      <AgencyStatsCards totals={totals} />

      <div className="flex items-center gap-3">
        <DateRangeFilter />
        <span className="text-[13px] text-slate-400">Filtering all production below</span>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <LeaderboardCard
          title="Producer Leaderboard"
          subtitle={`Total ALP by producer for This Week (${weekLabel}).`}
          entries={producers.slice(0, 5).map((p, i) => ({ id: p.agent.id, rank: i + 1, name: p.agent.fullName, subtitle: p.agent.teamName, alp: p.stats.weeklyAlp, to: `/agents/${p.agent.id}` }))}
          onFullLeaderboard={() => navigate('/hierarchy')}
        />
        <LeaderboardCard
          title="Team Leaderboard"
          subtitle={`Total ALP by team for This Week (${weekLabel}).`}
          entries={teams.slice(0, 5).map((t, i) => ({ id: t.teamId, rank: i + 1, name: t.teamName, subtitle: `${t.agentCount} agents`, alp: t.weeklyAlp, to: '/teams' }))}
          onFullLeaderboard={() => navigate('/teams')}
        />
        {topProducer && (
          <TopProducerCard producer={{ name: topProducer.agent.fullName, team: topProducer.agent.teamName, role: topProducer.agent.role, alp: topProducer.stats.weeklyAlp, familiesProtected: topProducer.stats.weeklyFamiliesProtected, dateRange: weekLabel, avatarUrl: topProducer.agent.avatarUrl }} />
        )}
      </div>
      <p className="text-center text-[12px] text-slate-400">
        Agency ALP this week: {formatCompactCurrency(totals.weeklyAlp)} · everything above is computed live from agent data.
      </p>
    </div>
  )
}
