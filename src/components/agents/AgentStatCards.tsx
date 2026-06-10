import {
  CalendarCheck,
  DollarSign,
  HeartHandshake,
  Percent,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { ComputedAgentStats } from '@/types'
import { StatTile } from '@/components/ui/StatTile'
import { formatCompactCurrency, formatPercent } from '@/lib/utils'

export function AgentStatCards({ stats }: { stats: ComputedAgentStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
      <StatTile label="This Week ALP" value={formatCompactCurrency(stats.weeklyAlp)} icon={DollarSign} tone="blue" />
      <StatTile label="This Month ALP" value={formatCompactCurrency(stats.monthlyAlp)} icon={TrendingUp} tone="blue" />
      <StatTile label="Families" value={stats.totalFamiliesProtected} icon={HeartHandshake} tone="green" />
      <StatTile label="Referrals" value={stats.referralsCollected} icon={Users} />
      <StatTile label="Sent to AI" value={stats.referralsSentToAI} icon={Sparkles} tone="purple" />
      <StatTile label="Appts Booked" value={stats.appointmentsBooked} icon={CalendarCheck} tone="green" />
      <StatTile label="Close Rate" value={formatPercent(stats.closeRate)} icon={Target} tone="orange" />
      <StatTile label="Show Rate" value={formatPercent(stats.showRate)} icon={Percent} tone="orange" />
    </div>
  )
}
