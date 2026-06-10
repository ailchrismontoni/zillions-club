import { supabase } from '@/lib/supabase'

export interface SbAuthResult {
  ok: boolean
  error?: string
  authUserId?: string
  email?: string
}

export async function sbSignUp(email: string, password: string): Promise<SbAuthResult> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' }
  const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password })
  if (error) return { ok: false, error: error.message }
  return { ok: true, authUserId: data.user?.id, email: data.user?.email ?? email }
}

export async function sbSignIn(email: string, password: string): Promise<SbAuthResult> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' }
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error) {
    // Normalize the common "invalid credentials" case.
    const msg = /invalid login/i.test(error.message) ? 'No account found with these credentials.' : error.message
    return { ok: false, error: msg }
  }
  return { ok: true, authUserId: data.user?.id, email: data.user?.email ?? email }
}

export async function sbSignOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function sbGetSessionUser(): Promise<{ authUserId: string; email: string } | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  const u = data.session?.user
  return u ? { authUserId: u.id, email: u.email ?? '' } : null
}
