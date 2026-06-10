import { BookUser, Camera, Mail, MapPin, Phone, Plus, Sparkles, TrendingUp } from 'lucide-react'
import type { Agent } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AGENT_STATUS_TONE } from '@/lib/agentMeta'
import { formatPhone } from '@/lib/utils'
import { formatShortDate } from '@/lib/dateRanges'

interface AgentHeaderProps {
  agent: Agent
  sending?: boolean
  /** When true, show a control to change this agent's profile picture. */
  editable?: boolean
  onEditAvatar?: () => void
  onMessage: () => void
  onViewRefBook: () => void
  onAddProduction: () => void
  onAddReferral: () => void
  onSendAI: () => void
}

export function AgentHeader({
  agent,
  sending,
  editable,
  onEditAvatar,
  onMessage,
  onViewRefBook,
  onAddProduction,
  onAddReferral,
  onSendAI,
}: AgentHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      {/* Banner */}
      <div className="h-24 bg-gradient-to-r from-navy-800 via-navy-700 to-electric-600 broadcast-streaks" />

      <div className="px-5 pb-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative -mt-10 shrink-0">
              <Avatar
                name={agent.fullName}
                src={agent.avatarUrl}
                size="xl"
                className="h-24 w-24 ring-4 ring-white"
              />
              {editable && (
                <button
                  type="button"
                  onClick={onEditAvatar}
                  className="absolute bottom-0.5 right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-electric text-white shadow-sm transition-colors hover:bg-electric-600 focus-ring"
                  aria-label="Change profile picture"
                  title="Change profile picture"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-ink">{agent.fullName}</h1>
                <Badge tone={AGENT_STATUS_TONE[agent.status]} dot>
                  {agent.status}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-500">
                <span className="font-semibold text-slate-700">{agent.role}</span>
                <span className="text-slate-300">·</span>
                <span>{agent.teamName}</span>
                <span className="text-slate-300">·</span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold tabular text-slate-600">
                  {agent.contractLevel} contract
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onMessage}>
              <Mail className="h-3.5 w-3.5" /> Message
            </Button>
            <Button variant="secondary" size="sm" onClick={onViewRefBook}>
              <BookUser className="h-3.5 w-3.5" /> Ref Book
            </Button>
            <Button variant="secondary" size="sm" onClick={onAddProduction}>
              <TrendingUp className="h-3.5 w-3.5" /> Add Production
            </Button>
            <Button variant="secondary" size="sm" onClick={onAddReferral}>
              <Plus className="h-3.5 w-3.5" /> Add Referral
            </Button>
            <Button variant="primary" size="sm" loading={sending} onClick={onSendAI}>
              {!sending && <Sparkles className="h-3.5 w-3.5" />} Send to AI
            </Button>
          </div>
        </div>

        {/* Contact meta */}
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-slate-100 pt-4 text-[13px] sm:grid-cols-3 lg:grid-cols-5">
          <Meta icon={MapPin} label="Location" value={agent.location || '—'} />
          <Meta icon={Phone} label="Phone" value={formatPhone(agent.phone)} />
          <Meta icon={Mail} label="Email" value={agent.email} />
          <Meta label="Start date" value={formatShortDate(agent.startDate)} />
          <Meta label="Sponsor" value={agent.sponsor || '—'} />
        </div>
      </div>
    </div>
  )
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 truncate font-medium text-ink" title={value}>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
        <span className="truncate">{value}</span>
      </p>
    </div>
  )
}
