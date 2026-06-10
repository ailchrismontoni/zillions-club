import { Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { RoleBadge } from '@/components/admin/RoleBadge'
import { AgencyDashboard } from '@/components/dashboard/AgencyDashboard'
import { TeamLeaderDashboard } from '@/components/dashboard/TeamLeaderDashboard'
import { AgentDashboard } from '@/components/dashboard/AgentDashboard'

export function DashboardPage() {
  const { account, agent, role, isOwner, isAdmin, isLeader } = useAuth()
  const { toast } = useToast()
  const firstName = account?.firstName ?? 'there'

  const subtitle =
    isOwner || isAdmin
      ? "Here's how your agency is producing today."
      : isLeader
        ? `${agent?.teamName ?? 'Your team'} · live team production.`
        : 'Your personal command center.'

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-ink">
              Welcome back, {firstName}
            </h1>
            <RoleBadge role={role} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <button
          onClick={() => toast({ title: 'Settings', description: 'Coming soon.', variant: 'info' })}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-ink focus-ring"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {(isOwner || isAdmin) && <AgencyDashboard />}
      {isLeader && agent && <TeamLeaderDashboard agent={agent} />}
      {role === 'agent' && agent && <AgentDashboard agent={agent} />}
    </div>
  )
}
