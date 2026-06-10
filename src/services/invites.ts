/**
 * Mocked invite email sender. Simulates an async send so the UI feels real.
 * Swap the body for a real transactional email call (Resend, SES, Postmark…)
 * — the signature is intentionally backend-friendly.
 */
export interface SendInviteResult {
  ok: boolean
  error?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

export async function sendInviteEmail(email: string, link: string): Promise<SendInviteResult> {
  await new Promise((r) => setTimeout(r, 900))
  if (!isValidEmail(email)) return { ok: false, error: 'Enter a valid email address.' }
  void link
  return { ok: true }
}
