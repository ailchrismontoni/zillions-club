import type { Agent, Team } from '@/types'
import { supabase } from '@/lib/supabase'
import { agentToRow, rowToAgent, rowToTeam, teamToRow } from './mappers'

/** Fetch the shared agents + teams. */
export async function fetchAgents(): Promise<Agent[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('agents').select('*')
  if (error) { console.warn('[supabase] fetchAgents', error.message); return [] }
  return (data ?? []).map(rowToAgent)
}

export async function fetchTeams(): Promise<Team[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('teams').select('*')
  if (error) { console.warn('[supabase] fetchTeams', error.message); return [] }
  return (data ?? []).map(rowToTeam)
}

/** Write-through helpers (fire-and-forget from the store). */
export async function pushAgent(agent: Agent): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('agents').upsert(agentToRow(agent), { onConflict: 'id' })
  if (error) console.warn('[supabase] pushAgent', error.message)
}

export async function pushAgents(agents: Agent[]): Promise<void> {
  if (!supabase || agents.length === 0) return
  const { error } = await supabase.from('agents').upsert(agents.map(agentToRow), { onConflict: 'id' })
  if (error) console.warn('[supabase] pushAgents', error.message)
}

export async function removeAgentRow(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('agents').delete().eq('id', id)
  if (error) console.warn('[supabase] removeAgentRow', error.message)
}

export async function pushTeam(team: Team): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('teams').upsert(teamToRow(team), { onConflict: 'id' })
  if (error) console.warn('[supabase] pushTeam', error.message)
}

/** Realtime: invoke `onChange` whenever agents or teams change anywhere. */
export function subscribeShared(onChange: () => void): () => void {
  const sb = supabase
  if (!sb) return () => {}
  const channel = sb
    .channel('zillions-shared')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, onChange)
    .subscribe()
  return () => { sb.removeChannel(channel) }
}
