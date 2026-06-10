import type { ReferralStatus } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { REFERRAL_STATUS_TONE } from '@/lib/agentMeta'

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  return (
    <Badge tone={REFERRAL_STATUS_TONE[status]} dot>
      {status}
    </Badge>
  )
}
