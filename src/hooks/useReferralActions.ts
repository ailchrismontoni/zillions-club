import { useCallback, useState } from 'react'
import type { Referral } from '@/types'
import { useAppStore } from '@/app/store'
import { useToast } from '@/hooks/useToast'
import { sendReferralToAI } from '@/services/agentOutreach'

/**
 * Shared logic for sending referrals to AgentOutreach AI from anywhere
 * (follow-up cards, table rows, bulk actions, agent profile). Tracks per-id
 * loading state; the service writes results back into the store.
 */
export function useReferralActions() {
  const connected = useAppStore((s) => s.organizationConnected)
  const { toast } = useToast()
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set())

  const setSending = useCallback((id: string, on: boolean) => {
    setSendingIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const sendToAI = useCallback(
    async (referral: Referral): Promise<boolean> => {
      if (!connected) {
        toast({
          title: 'Connect AgentOutreach first',
          description: 'Connect the organization in Ref Book to enable AI outreach.',
          variant: 'error',
        })
        return false
      }
      setSending(referral.id, true)
      try {
        const res = await sendReferralToAI(referral.id, referral.agentId)
        if (res.ok) {
          toast({
            title: 'Sent to AgentOutreach',
            description: `${referral.name} is now in AI outreach.`,
            variant: 'success',
          })
          return true
        }
        toast({ title: 'Could not send to AI', description: res.error, variant: 'error' })
        return false
      } finally {
        setSending(referral.id, false)
      }
    },
    [connected, toast, setSending],
  )

  return { sendToAI, sendingIds, connected }
}
