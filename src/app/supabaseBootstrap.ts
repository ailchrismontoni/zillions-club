import { supabase, supabaseEnabled } from '@/lib/supabase'
import { fetchAgents, fetchTeams, subscribeShared } from '@/services/supabase/data'
import { sbGetSessionUser } from '@/services/supabase/auth'
import { useAppStore } from '@/app/store'
import { useAuthStore } from '@/app/authStore'

let started = false

/** Pull the shared agents + teams from Supabase into the local store. */
async function hydrateShared() {
  const [teams, agents] = await Promise.all([fetchTeams(), fetchAgents()])
  const patch: Record<string, unknown> = {}
  if (teams.length) patch.teams = teams
  if (agents.length) patch.agents = agents
  if (Object.keys(patch).length) useAppStore.setState(patch)
  return agents
}

function restoreSession(authUserId: string) {
  const agent = useAppStore.getState().agents.find((a) => a.authUserId === authUserId) ?? null
  useAuthStore.getState().setSupabaseSession(agent)
}

/**
 * One-time init. With Supabase configured: hydrate shared data, subscribe to
 * realtime changes, and restore the auth session. No-op otherwise.
 */
export async function initSupabase(): Promise<void> {
  if (!supabaseEnabled || started) return
  started = true

  await hydrateShared()
  subscribeShared(() => { void hydrateShared() })

  const user = await sbGetSessionUser()
  if (user) restoreSession(user.authUserId)
  else useAuthStore.getState().setSupabaseSession(null)

  // Keep the session in sync if it changes in another tab / on refresh.
  supabase?.auth.onAuthStateChange((_event, session) => {
    if (!session) { useAuthStore.getState().setSupabaseSession(null); return }
    restoreSession(session.user.id)
  })
}
