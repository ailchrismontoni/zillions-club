/** The single agency-wide group chat everyone belongs to. */
export const AGENCY_CHAT_ID = 'chat-agency'

const SEP = '__'

/** Deterministic conversation id for a 1:1 DM (order-independent). */
export function dmId(a: string, b: string): string {
  return `dm_${[a, b].sort().join(SEP)}`
}

export function isDm(conversationId: string): boolean {
  return conversationId.startsWith('dm_')
}

/** The two participant ids of a DM conversation. */
export function dmParticipants(conversationId: string): string[] {
  return conversationId.replace('dm_', '').split(SEP)
}

/** The other participant in a DM (relative to `meId`). */
export function dmOther(conversationId: string, meId: string): string {
  const ids = dmParticipants(conversationId)
  return ids.find((x) => x !== meId) ?? ids[0]
}

export function isParticipant(conversationId: string, userId: string): boolean {
  if (conversationId === AGENCY_CHAT_ID) return true
  return dmParticipants(conversationId).includes(userId)
}
