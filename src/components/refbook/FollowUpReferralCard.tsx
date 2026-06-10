import { AlertTriangle, Check, Phone, Sparkles } from 'lucide-react'
import type { Referral } from '@/types'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/ui/Button'
import { ReferralStatusBadge } from './ReferralStatusBadge'
import { formatPhone, staleLabel } from '@/lib/utils'

interface FollowUpReferralCardProps {
  referral: Referral
  sending: boolean
  onSendAI: (referral: Referral) => void
}

export function FollowUpReferralCard({
  referral,
  sending,
  onSendAI,
}: FollowUpReferralCardProps) {
  const markContacted = useAppStore((s) => s.markContacted)

  return (
    <div className="flex w-[280px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold capitalize text-ink">
            {referral.name}
          </p>
          <p className="truncate text-[12px] text-slate-500">{referral.notes}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10.5px] font-bold text-orange-600 ring-1 ring-orange-100">
          {staleLabel(referral.createdAt)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <ReferralStatusBadge status={referral.status} />
        <span className="flex items-center gap-1 text-[12px] font-medium tabular text-slate-500">
          <Phone className="h-3 w-3" />
          {formatPhone(referral.phone)}
        </span>
      </div>

      {referral.error && (
        <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11.5px] font-medium text-red-600">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          {referral.error}
        </p>
      )}

      <div className="mt-3.5 flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => markContacted([referral.id])}
        >
          <Check className="h-3.5 w-3.5" />
          Mark contacted
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={sending}
          onClick={() => onSendAI(referral)}
        >
          {!sending && <Sparkles className="h-3.5 w-3.5" />}
          AI
        </Button>
      </div>
    </div>
  )
}
