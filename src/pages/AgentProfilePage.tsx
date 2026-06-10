import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Shuffle } from 'lucide-react'
import { useAppStore } from '@/app/store'
import { useAgentWithStats } from '@/hooks/useAgencyData'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { sendAgentReferralsToAI } from '@/services/agentOutreach'
import { Button } from '@/components/ui/Button'
import { ReassignTeamModal } from '@/components/agents/ReassignTeamModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { UserX } from 'lucide-react'
import { AgentHeader } from '@/components/agents/AgentHeader'
import { AvatarUploadModal } from '@/components/agents/AvatarUploadModal'
import { AgentStatCards } from '@/components/agents/AgentStatCards'
import { AgentTabs, type AgentTabKey } from '@/components/agents/AgentTabs'
import { OverviewTab } from '@/components/agents/tabs/OverviewTab'
import { NumbersTab } from '@/components/agents/tabs/NumbersTab'
import { RefBookTab } from '@/components/agents/tabs/RefBookTab'
import { AICRMTab } from '@/components/agents/tabs/AICRMTab'
import { AppointmentsTab } from '@/components/agents/tabs/AppointmentsTab'
import { NotesTab } from '@/components/agents/tabs/NotesTab'
import { ActivityTab } from '@/components/agents/tabs/ActivityTab'
import { SubmitDailyNumbersModal } from '@/components/agents/SubmitDailyNumbersModal'
import { AddAgentReferralModal } from '@/components/agents/AddAgentReferralModal'

export function AgentProfilePage() {
  const { agentId } = useParams<{ agentId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { agent: currentAgent, can } = useAuth()
  const isAdmin = can('move_agents')
  const connected = useAppStore((s) => s.organizationConnected)
  const addDailyNumbers = useAppStore((s) => s.addDailyNumbers)
  const updateAgent = useAppStore((s) => s.updateAgent)
  const data = useAgentWithStats(agentId)

  const [tab, setTab] = useState<AgentTabKey>('overview')
  const [prodOpen, setProdOpen] = useState(false)
  const [refOpen, setRefOpen] = useState(false)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [sending, setSending] = useState(false)

  if (!data) {
    return (
      <div className="py-10">
        <EmptyState
          icon={UserX}
          title="Agent not found"
          description="This agent may have been removed."
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/hierarchy')}>
              Back to Hierarchy
            </Button>
          }
        />
      </div>
    )
  }

  const { agent, stats } = data
  const isSelf = currentAgent?.id === agent.id

  async function handleSendAI() {
    if (!connected) {
      toast({ title: 'Connect AgentOutreach first', description: 'Enable AI in the Ref Book page.', variant: 'error' })
      return
    }
    setSending(true)
    const summary = await sendAgentReferralsToAI(agent.id)
    setSending(false)
    toast({
      title: `${summary.sent} sent to AI`,
      description: `${summary.invalid} invalid · ${summary.failed} failed`,
      variant: summary.sent > 0 ? 'success' : 'info',
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/hierarchy" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Hierarchy
        </Link>
        {isAdmin && (
          <Button variant="secondary" size="sm" onClick={() => setReassignOpen(true)}>
            <Shuffle className="h-3.5 w-3.5" /> Reassign Team
          </Button>
        )}
      </div>

      <AgentHeader
        agent={agent}
        sending={sending}
        editable={isSelf}
        onEditAvatar={() => setAvatarOpen(true)}
        onMessage={() => toast({ title: `Message ${agent.firstName}`, description: 'Chat coming soon.', variant: 'info' })}
        onViewRefBook={() => setTab('refbook')}
        onAddProduction={() => setProdOpen(true)}
        onAddReferral={() => setRefOpen(true)}
        onSendAI={handleSendAI}
      />

      <AgentStatCards stats={stats} />

      <AgentTabs active={tab} onChange={setTab} />

      <div>
        {tab === 'overview' && <OverviewTab agent={agent} stats={stats} />}
        {tab === 'numbers' && <NumbersTab agent={agent} stats={stats} />}
        {tab === 'refbook' && <RefBookTab agent={agent} />}
        {tab === 'aicrm' && <AICRMTab agent={agent} stats={stats} />}
        {tab === 'appointments' && <AppointmentsTab agent={agent} />}
        {tab === 'notes' && <NotesTab agent={agent} />}
        {tab === 'activity' && <ActivityTab agent={agent} />}
      </div>

      <SubmitDailyNumbersModal
        open={prodOpen}
        onClose={() => setProdOpen(false)}
        onSubmit={(d) => {
          addDailyNumbers(agent.id, d)
          toast({ title: 'Daily numbers submitted', description: agent.fullName, variant: 'success' })
        }}
      />
      <AddAgentReferralModal open={refOpen} onClose={() => setRefOpen(false)} agentId={agent.id} agentName={agent.fullName} />
      {isAdmin && <ReassignTeamModal open={reassignOpen} onClose={() => setReassignOpen(false)} agent={agent} />}
      {isSelf && (
        <AvatarUploadModal
          open={avatarOpen}
          onClose={() => setAvatarOpen(false)}
          agent={agent}
          onSave={(avatarUrl) => updateAgent(agent.id, { avatarUrl })}
        />
      )}
    </div>
  )
}
