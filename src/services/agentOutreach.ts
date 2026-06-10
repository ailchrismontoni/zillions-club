import type { Referral } from '@/types'
import { useAppStore } from '@/app/store'
import { isSmsCapablePhone, nowIso } from '@/lib/utils'

/**
 * Mocked AgentOutreach AI integration, structured like a real one. Each call
 * simulates latency, validates, then writes results back into the store so
 * every connected surface (agent profile, dashboard, global ref book) updates.
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function connectOrganizationToAgentOutreach(): Promise<{ connected: boolean }> {
  await delay(1400)
  const store = useAppStore.getState()
  store.setOrganizationConnected(true)
  store.addAIActivity({
    agentId: store.agents[0]?.id ?? '',
    referralId: null,
    type: 'connected',
    message: 'Organization connected to AgentOutreach AI',
    status: 'Connected',
  })
  return { connected: true }
}

export interface SendResult {
  ok: boolean
  error?: string
  referralId: string
}

export async function sendReferralToAI(
  referralId: string,
  agentId: string,
): Promise<SendResult> {
  await delay(850)
  const store = useAppStore.getState()

  if (!store.organizationConnected) {
    return { ok: false, error: 'Connect AgentOutreach first', referralId }
  }

  const referral = store.referrals.find((r) => r.id === referralId)
  if (!referral) return { ok: false, error: 'Referral not found', referralId }

  if (!isSmsCapablePhone(referral.phone)) {
    store.updateReferral(referralId, {
      status: 'Invalid Phone',
      aiStatus: 'invalid',
      error: 'Use a valid SMS-capable phone number.',
    })
    store.addAIActivity({
      agentId,
      referralId,
      type: 'invalid',
      message: `Could not send ${referral.name}: invalid phone`,
      status: 'Invalid Phone',
    })
    return { ok: false, error: 'Use a valid SMS-capable phone number.', referralId }
  }

  store.updateReferral(referralId, {
    status: 'AI Sent',
    aiStatus: 'messaging',
    aiSentAt: nowIso(),
    lastContactedAt: nowIso(),
    error: null,
  })
  store.addAIActivity({
    agentId,
    referralId,
    type: 'sent',
    message: `Sent ${referral.name} to AgentOutreach`,
    status: 'AI Sent',
  })
  return { ok: true, referralId }
}

export interface BulkSendSummary {
  sent: number
  failed: number
  invalid: number
  skipped: number
}

/** Eligible = not already AI Sent / booked / sold and has a phone. */
export function isEligibleForAI(r: Referral): boolean {
  return (
    !r.aiSentAt &&
    r.status !== 'Sold' &&
    r.status !== 'Not Sold' &&
    r.status !== 'Appointment Booked' &&
    r.phone.trim().length > 0
  )
}

export async function sendAgentReferralsToAI(agentId: string): Promise<BulkSendSummary> {
  const store = useAppStore.getState()
  if (!store.organizationConnected) {
    return { sent: 0, failed: 0, invalid: 0, skipped: 0 }
  }

  const eligible = store.referrals.filter(
    (r) => r.agentId === agentId && isEligibleForAI(r),
  )

  const summary: BulkSendSummary = { sent: 0, failed: 0, invalid: 0, skipped: 0 }
  for (const ref of eligible) {
    // eslint-disable-next-line no-await-in-loop
    const res = await sendReferralToAI(ref.id, agentId)
    if (res.ok) summary.sent++
    else if (res.error?.includes('valid SMS')) summary.invalid++
    else summary.failed++
  }
  return summary
}

export interface SyncResult {
  booked: number
}

/**
 * Simulates inbound AI activity: some "AI Sent" referrals get appointments
 * booked, which updates agent + dashboard stats automatically.
 */
export async function syncAIActivity(): Promise<SyncResult> {
  await delay(1100)
  const store = useAppStore.getState()
  const messaging = store.referrals.filter((r) => r.aiStatus === 'messaging')

  let booked = 0
  for (const ref of messaging) {
    // ~40% chance each messaging referral books
    if (Math.random() < 0.4) {
      const apptDate = new Date()
      apptDate.setDate(apptDate.getDate() + Math.ceil(Math.random() * 6))
      store.updateReferral(ref.id, {
        status: 'Appointment Booked',
        aiStatus: 'booked',
        appointmentBookedAt: nowIso(),
        appointmentDate: apptDate.toISOString(),
      })
      store.addAIActivity({
        agentId: ref.agentId,
        referralId: ref.id,
        type: 'booked',
        message: `AgentOutreach booked an appointment with ${ref.name}`,
        status: 'Appointment Booked',
      })
      booked++
    }
  }
  return { booked }
}
