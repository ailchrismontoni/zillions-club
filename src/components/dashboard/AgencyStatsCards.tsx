import { CalendarCheck, DollarSign, HeartHandshake, Megaphone, Sparkles, Users } from 'lucide-react'
import type { AgencyTotals } from '@/types'
import { StatTile } from '@/components/ui/StatTile'
import { formatCompactCurrency } from '@/lib/utils'

export function AgencyStatsCards({ totals }: { totals: AgencyTotals }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <StatTile label="Agency ALP (wk)" value={formatCompactCurrency(totals.weeklyAlp)} icon={DollarSign} tone="blue" hint="this week" />
      <StatTile label="Families" value={totals.familiesProtected} icon={HeartHandshake} tone="green" hint="protected this week" />
      <StatTile label="Referrals" value={totals.referralsCollected} icon={Users} hint="collected" />
      <StatTile label="Sent to AI" value={totals.referralsSentToAI} icon={Sparkles} tone="purple" hint="AgentOutreach" />
      <StatTile label="Appts Booked" value={totals.appointmentsBooked} icon={CalendarCheck} tone="green" hint="by AI" />
      <StatTile label="Unread" value={totals.unreadAnnouncements} icon={Megaphone} tone="orange" hint="announcements" />
    </div>
  )
}
