import { useMemo, useState } from 'react'
import { BookUser, Plus } from 'lucide-react'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AgentOutreachBanner } from '@/components/refbook/AgentOutreachBanner'
import { FollowUpSection } from '@/components/refbook/FollowUpSection'
import { ReferralsTable } from '@/components/refbook/ReferralsTable'
import { AddAgentReferralModal } from '@/components/agents/AddAgentReferralModal'

export function RefBookPage() {
  const referrals = useAppStore((s) => s.referrals)
  const connected = useAppStore((s) => s.organizationConnected)
  const { agent } = useAuth()
  const [addOpen, setAddOpen] = useState(false)

  const agentId = agent?.id ?? ''
  // Personal ref book — only the logged-in user's referrals.
  const myReferrals = useMemo(
    () => referrals.filter((r) => r.agentId === agentId),
    [referrals, agentId],
  )

  return (
    <div className="space-y-7">
      <PageHeader
        title="Ref Book"
        description="Your referrals — collect, follow up, and hand off to AI outreach."
        actions={
          <div className="flex items-center gap-2.5">
            <Badge tone={connected ? 'green' : 'neutral'} dot>
              <BookUser className="h-3 w-3" /> {myReferrals.length} referrals
            </Badge>
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Referral
            </Button>
          </div>
        }
      />

      <AgentOutreachBanner />
      <FollowUpSection referrals={myReferrals} />

      <ReferralsTable
        referrals={myReferrals}
        title="My Referrals"
        subtitle={`${myReferrals.length} referrals in your book.`}
        onAddReferral={() => setAddOpen(true)}
      />

      {agent && (
        <AddAgentReferralModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          agentId={agent.id}
          agentName={agent.fullName}
        />
      )}
    </div>
  )
}
