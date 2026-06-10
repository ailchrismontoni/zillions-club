import { useMemo, useState } from 'react'
import type { Agent } from '@/types'
import { useAppStore } from '@/app/store'
import { ReferralsTable } from '@/components/refbook/ReferralsTable'
import { AddAgentReferralModal } from '@/components/agents/AddAgentReferralModal'

export function RefBookTab({ agent }: { agent: Agent }) {
  const referrals = useAppStore((s) => s.referrals)
  const [addOpen, setAddOpen] = useState(false)

  const agentReferrals = useMemo(
    () => referrals.filter((r) => r.agentId === agent.id),
    [referrals, agent.id],
  )

  return (
    <>
      <ReferralsTable
        referrals={agentReferrals}
        title={`${agent.firstName}'s Ref Book`}
        subtitle={`${agentReferrals.length} referrals owned by ${agent.fullName}.`}
        onAddReferral={() => setAddOpen(true)}
      />
      <AddAgentReferralModal open={addOpen} onClose={() => setAddOpen(false)} agentId={agent.id} agentName={agent.fullName} />
    </>
  )
}
