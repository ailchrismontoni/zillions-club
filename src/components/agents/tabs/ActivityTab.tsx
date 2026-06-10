import { useMemo } from 'react'
import {
  CalendarCheck,
  CheckCircle2,
  FileText,
  Send,
  Sparkles,
  TriangleAlert,
  UserPlus,
} from 'lucide-react'
import type { Agent, AIActivity } from '@/types'
import { useAppStore } from '@/app/store'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { History } from 'lucide-react'
import { relativeTime } from '@/lib/dateRanges'

const ICONS: Record<AIActivity['type'], typeof Send> = {
  sent: Send,
  message: FileText,
  reply: Sparkles,
  booked: CalendarCheck,
  failed: TriangleAlert,
  invalid: TriangleAlert,
  connected: UserPlus,
}

const TONE: Record<AIActivity['type'], string> = {
  sent: 'text-violet-500',
  message: 'text-slate-500',
  reply: 'text-electric',
  booked: 'text-emerald-500',
  failed: 'text-red-500',
  invalid: 'text-red-500',
  connected: 'text-electric',
}

export function ActivityTab({ agent }: { agent: Agent }) {
  const aiActivity = useAppStore((s) => s.aiActivity)
  const activity = useMemo(() => aiActivity.filter((a) => a.agentId === agent.id), [aiActivity, agent.id])

  if (activity.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No activity yet"
        description="Production, referrals, and AI actions for this agent will show up here."
      />
    )
  }

  return (
    <Card className="p-5">
      <h3 className="mb-5 flex items-center gap-2 text-[15px] font-bold text-ink">
        <CheckCircle2 className="h-4 w-4 text-slate-400" /> Activity history
      </h3>
      <ol className="relative space-y-5 border-l border-slate-100 pl-6">
        {activity.map((a) => {
          const Icon = ICONS[a.type]
          return (
            <li key={a.id} className="relative">
              <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-slate-100 ${TONE[a.type]}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <p className="text-[13.5px] font-medium text-ink">{a.message}</p>
              <p className="text-[11.5px] text-slate-400">{a.status} · {relativeTime(a.createdAt)}</p>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
