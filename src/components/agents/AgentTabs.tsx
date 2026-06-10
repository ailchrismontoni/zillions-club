import { cn } from '@/lib/utils'

export type AgentTabKey =
  | 'overview'
  | 'numbers'
  | 'refbook'
  | 'aicrm'
  | 'appointments'
  | 'notes'
  | 'activity'

const TABS: { key: AgentTabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'numbers', label: 'Numbers' },
  { key: 'refbook', label: 'Ref Book' },
  { key: 'aicrm', label: 'AI CRM' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'notes', label: 'Notes' },
  { key: 'activity', label: 'Activity' },
]

export function AgentTabs({
  active,
  onChange,
}: {
  active: AgentTabKey
  onChange: (key: AgentTabKey) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-card">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors',
            active === tab.key
              ? 'bg-ink text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-ink',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
