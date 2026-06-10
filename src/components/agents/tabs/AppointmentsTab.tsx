import { useMemo } from 'react'
import { CalendarCheck, CalendarClock, MapPin, Phone } from 'lucide-react'
import type { Agent } from '@/types'
import { useAppStore } from '@/app/store'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ReferralStatusBadge } from '@/components/refbook/ReferralStatusBadge'
import { formatPhone } from '@/lib/utils'
import { formatShortDate, relativeTime } from '@/lib/dateRanges'

export function AppointmentsTab({ agent }: { agent: Agent }) {
  const referrals = useAppStore((s) => s.referrals)

  const appointments = useMemo(
    () =>
      referrals
        .filter((r) => r.agentId === agent.id && r.appointmentBookedAt)
        .sort((a, b) => new Date(b.appointmentDate ?? b.appointmentBookedAt!).getTime() - new Date(a.appointmentDate ?? a.appointmentBookedAt!).getTime()),
    [referrals, agent.id],
  )

  const upcoming = appointments.filter((r) => r.appointmentDate && new Date(r.appointmentDate).getTime() > Date.now())

  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No appointments yet"
        description="When AgentOutreach books appointments from this agent's referrals, they'll appear here."
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <Card className="flex items-center gap-3 px-5 py-4">
          <CalendarCheck className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="text-xl font-extrabold tabular text-ink">{appointments.length}</p>
            <p className="text-[12px] text-slate-400">Total booked</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 px-5 py-4">
          <CalendarClock className="h-5 w-5 text-electric" />
          <div>
            <p className="text-xl font-extrabold tabular text-ink">{upcoming.length}</p>
            <p className="text-[12px] text-slate-400">Upcoming</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {appointments.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-ink">{r.name}</p>
                <p className="truncate text-[12px] text-slate-400">{r.relation} · {r.occupation}</p>
              </div>
              <ReferralStatusBadge status={r.status} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-slate-500">
              {r.appointmentDate && (
                <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                  <CalendarCheck className="h-3.5 w-3.5" />
                  {formatShortDate(r.appointmentDate)}
                </span>
              )}
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{r.city || '—'}</span>
              <span className="flex items-center gap-1.5 tabular"><Phone className="h-3.5 w-3.5 text-slate-400" />{formatPhone(r.phone)}</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Booked {relativeTime(r.appointmentBookedAt)} via AgentOutreach</p>
          </Card>
        ))}
      </div>
      <Badge tone="neutral" className="ml-1">{agent.firstName}'s appointment pipeline</Badge>
    </div>
  )
}
