import { useState } from 'react'
import { useTeamStats } from '@/hooks/useAgencyData'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Plus, Trophy } from 'lucide-react'
import { CreateTeamModal } from '@/components/teams/CreateTeamModal'
import { formatCompactCurrency } from '@/lib/utils'

export function TeamsPage() {
  const teamStats = useTeamStats()
  const { can } = useAuth()
  const isAdmin = can('edit_roster')
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="Standings and production for every team in the agency."
        actions={
          isAdmin ? (
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Create Team
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teamStats.map((t, i) => (
          <Card key={t.teamId} className="card-lift p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={t.teamName} size="md" />
                <div>
                  <p className="text-[15px] font-bold text-ink">{t.teamName}</p>
                  <p className="text-[12px] text-slate-400">Led by {t.leaderName}</p>
                </div>
              </div>
              {i === 0 ? (
                <Badge tone="amber"><Trophy className="h-3 w-3" /> #1</Badge>
              ) : (
                <Badge tone="neutral">#{i + 1}</Badge>
              )}
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weekly ALP</p>
                <p className="text-2xl font-extrabold tabular tracking-tight text-ink">{formatCompactCurrency(t.weeklyAlp)}</p>
              </div>
              <Badge tone="green" dot>{t.activeAgents}/{t.agentCount} active</Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
              <Mini label="Families" value={t.familiesProtected} />
              <Mini label="Referrals" value={t.referralsCollected} />
              <Mini label="Appts" value={t.appointmentsBooked} />
            </div>
          </Card>
        ))}
      </div>

      <CreateTeamModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[15px] font-extrabold tabular text-ink">{value}</p>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  )
}
