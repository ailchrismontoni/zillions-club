import { useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { Referral } from '@/types'
import { hoursSince } from '@/lib/utils'
import { useReferralActions } from '@/hooks/useReferralActions'
import { FollowUpReferralCard } from './FollowUpReferralCard'

/** Referrals stuck in New/Contacted > 24h, or carrying an unresolved error. */
export function selectFollowUps(referrals: Referral[]): Referral[] {
  return referrals
    .filter(
      (r) =>
        (r.status === 'New' || r.status === 'Contacted') &&
        (hoursSince(r.createdAt) > 24 || Boolean(r.error)),
    )
    .sort((a, b) => hoursSince(b.createdAt) - hoursSince(a.createdAt))
}

export function FollowUpSection({ referrals }: { referrals: Referral[] }) {
  const { sendToAI, sendingIds } = useReferralActions()
  const followUps = useMemo(() => selectFollowUps(referrals), [referrals])

  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2.5">
        <h2 className="text-lg font-bold tracking-tight text-ink">Needs follow-up</h2>
        {followUps.length > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white">
            {followUps.length}
          </span>
        )}
      </div>
      <p className="mb-4 text-[13px] text-slate-500">
        Referrals stuck in New or Contacted for more than 24 hours.
      </p>

      {followUps.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-emerald-50/40 px-5 py-6">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <p className="text-sm font-medium text-slate-600">
            All caught up — nothing needs follow-up right now.
          </p>
        </div>
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {followUps.map((r) => (
            <FollowUpReferralCard
              key={r.id}
              referral={r}
              sending={sendingIds.has(r.id)}
              onSendAI={sendToAI}
            />
          ))}
        </div>
      )}
    </section>
  )
}
