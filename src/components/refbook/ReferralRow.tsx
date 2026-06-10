import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarCheck, Sparkles } from 'lucide-react'
import type { Household, Referral, ReferralStatus } from '@/types'
import { HOUSEHOLD_OPTIONS, REFERRAL_STATUSES } from '@/types'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { ReferralStatusBadge } from './ReferralStatusBadge'
import { InlineEditableCell, type CellHandle } from './InlineEditableCell'
import { formatShortDate } from '@/lib/dateRanges'

const TEXT_COLUMNS: {
  key: keyof Referral
  options?: readonly string[]
  width: string
}[] = [
  { key: 'name', width: 'min-w-[130px]' },
  { key: 'relation', width: 'min-w-[100px]' },
  { key: 'city', width: 'min-w-[110px]' },
  { key: 'occupation', width: 'min-w-[110px]' },
  { key: 'household', options: HOUSEHOLD_OPTIONS, width: 'min-w-[100px]' },
  { key: 'spouse', width: 'min-w-[90px]' },
  { key: 'phone', width: 'min-w-[120px]' },
  { key: 'sponsor', width: 'min-w-[110px]' },
  { key: 'notes', width: 'min-w-[170px]' },
]

interface ReferralRowProps {
  referral: Referral
  selected: boolean
  sending: boolean
  showAgent?: boolean
  onToggle: (id: string) => void
  onUpdate: (id: string, patch: Partial<Referral>) => void
  onStatusChange: (id: string, status: ReferralStatus) => void
  onSendAI: (referral: Referral) => void
}

export function ReferralRow({
  referral,
  selected,
  sending,
  showAgent,
  onToggle,
  onUpdate,
  onStatusChange,
  onSendAI,
}: ReferralRowProps) {
  const cellRefs = useRef<(CellHandle | null)[]>([])

  return (
    <tr className={cn('group border-b border-slate-100 transition-colors', selected ? 'bg-electric-50/50' : 'hover:bg-slate-50/70')}>
      <td className="sticky left-0 z-10 bg-inherit px-3 py-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(referral.id)}
          className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-electric focus:ring-electric/30"
          aria-label={`Select ${referral.name}`}
        />
      </td>

      {showAgent && (
        <td className="whitespace-nowrap px-3 py-2 align-top">
          <Link to={`/agents/${referral.agentId}`} className="flex items-center gap-2 hover:underline">
            <Avatar name={referral.agentName} size="xs" />
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-ink">{referral.agentName}</p>
              <p className="truncate text-[11px] text-slate-400">{referral.teamName}</p>
            </div>
          </Link>
        </td>
      )}

      {TEXT_COLUMNS.map((col, i) => (
        <td key={col.key} className={cn('px-1.5 py-1.5 align-top', col.width)}>
          <InlineEditableCell
            ref={(el) => (cellRefs.current[i] = el)}
            value={String(referral[col.key] ?? '')}
            options={col.options}
            onCommit={(value) => onUpdate(referral.id, { [col.key]: col.options ? (value as Household) : value } as Partial<Referral>)}
            onTabNext={() => cellRefs.current[i + 1]?.edit()}
          />
          {col.key === 'phone' && referral.error && (
            <p className="mt-1 flex items-center gap-1 px-1.5 text-[11px] font-medium text-red-500">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {referral.error}
            </p>
          )}
          {col.key === 'phone' && !referral.error && referral.appointmentDate && (
            <p className="mt-1 flex items-center gap-1 px-1.5 text-[11px] font-medium text-emerald-600">
              <CalendarCheck className="h-3 w-3 shrink-0" />
              Appt {formatShortDate(referral.appointmentDate)}
            </p>
          )}
        </td>
      ))}

      <td className="px-3 py-2 align-top">
        <div className="flex items-center gap-1.5">
          <Dropdown
            align="right"
            trigger={() => (
              <span className="cursor-pointer">
                <ReferralStatusBadge status={referral.status} />
              </span>
            )}
          >
            {(close) =>
              REFERRAL_STATUSES.map((status) => (
                <DropdownItem key={status} active={status === referral.status} onClick={() => { onStatusChange(referral.id, status); close() }}>
                  <ReferralStatusBadge status={status} />
                </DropdownItem>
              ))
            }
          </Dropdown>
          {!referral.aiSentAt && (
            <button
              onClick={() => onSendAI(referral)}
              disabled={sending}
              title="Send to AgentOutreach AI"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-violet-500 opacity-0 transition-all hover:bg-violet-50 group-hover:opacity-100 disabled:opacity-50"
            >
              <Sparkles className={cn('h-3.5 w-3.5', sending && 'animate-pulse')} />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
