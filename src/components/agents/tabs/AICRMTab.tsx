import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarCheck,
  MessageSquare,
  PhoneOff,
  Send,
  Sparkles,
  XCircle,
} from 'lucide-react'
import type { Agent, ComputedAgentStats } from '@/types'
import { useAppStore } from '@/app/store'
import { useToast } from '@/hooks/useToast'
import { sendAgentReferralsToAI, syncAIActivity } from '@/services/agentOutreach'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatTile } from '@/components/ui/StatTile'
import { relativeTime } from '@/lib/dateRanges'

export function AICRMTab({ agent, stats }: { agent: Agent; stats: ComputedAgentStats }) {
  const connected = useAppStore((s) => s.organizationConnected)
  const referrals = useAppStore((s) => s.referrals)
  const aiActivity = useAppStore((s) => s.aiActivity)
  const { toast } = useToast()
  const [sending, setSending] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const myRefs = useMemo(() => referrals.filter((r) => r.agentId === agent.id), [referrals, agent.id])
  const activeConversations = myRefs.filter((r) => r.aiStatus === 'messaging').length
  const failed = myRefs.filter((r) => r.aiStatus === 'failed').length
  const invalid = myRefs.filter((r) => r.status === 'Invalid Phone').length
  const eligible = myRefs.filter((r) => !r.aiSentAt && r.status !== 'Sold' && r.status !== 'Appointment Booked' && r.phone.trim()).length

  const activity = useMemo(() => aiActivity.filter((a) => a.agentId === agent.id).slice(0, 12), [aiActivity, agent.id])

  async function handleSendAll() {
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

  async function handleSync() {
    setSyncing(true)
    const res = await syncAIActivity()
    setSyncing(false)
    toast({
      title: res.booked > 0 ? `${res.booked} appointment(s) booked` : 'No new bookings',
      description: 'AgentOutreach synced inbound activity.',
      variant: res.booked > 0 ? 'success' : 'info',
    })
  }

  return (
    <div className="space-y-5">
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-white">
            <span className="text-sm font-black">AO</span>
          </div>
          <div>
            <p className="text-[15px] font-bold text-ink">AgentOutreach AI</p>
            <Badge tone={connected ? 'green' : 'neutral'} dot>
              {connected ? 'Connected' : 'Not connected'}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" loading={syncing} onClick={handleSync}>
            {!syncing && <CalendarCheck className="h-3.5 w-3.5" />} Sync AI Activity
          </Button>
          <Button variant="primary" size="sm" loading={sending} disabled={!connected || eligible === 0} onClick={handleSendAll}>
            {!sending && <Send className="h-3.5 w-3.5" />} Send All Eligible ({eligible})
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Sent to AI" value={stats.referralsSentToAI} icon={Sparkles} tone="purple" />
        <StatTile label="Active Convos" value={activeConversations} icon={MessageSquare} tone="blue" />
        <StatTile label="Appts Booked" value={stats.appointmentsBooked} icon={CalendarCheck} tone="green" />
        <StatTile label="Eligible" value={eligible} icon={Send} />
        <StatTile label="Failed" value={failed} icon={XCircle} tone="orange" />
        <StatTile label="Invalid Phone" value={invalid} icon={PhoneOff} tone="orange" />
      </div>

      <Card className="p-5">
        <h3 className="mb-4 text-[15px] font-bold text-ink">Recent AI messages & activity</h3>
        {activity.length === 0 ? (
          <p className="text-[13px] text-slate-400">No AI activity yet. Send referrals to AgentOutreach to get started.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-slate-100 pl-5">
            {activity.map((a) => {
              const Icon = a.type === 'booked' ? CalendarCheck : a.type === 'invalid' ? AlertTriangle : a.type === 'sent' ? Send : MessageSquare
              const tone = a.type === 'booked' ? 'text-emerald-500' : a.type === 'invalid' ? 'text-red-500' : 'text-violet-500'
              return (
                <li key={a.id} className="relative">
                  <span className={`absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-slate-100 ${tone}`}>
                    <Icon className="h-3 w-3" />
                  </span>
                  <p className="text-[13px] font-medium text-ink">{a.message}</p>
                  <p className="text-[11.5px] text-slate-400">{a.status} · {relativeTime(a.createdAt)}</p>
                </li>
              )
            })}
          </ol>
        )}
      </Card>
    </div>
  )
}
