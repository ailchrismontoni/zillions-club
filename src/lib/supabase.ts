import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase is OPTIONAL. When the two env vars are set, the app uses a real
 * shared backend (auth + agents/teams). When they're absent, the app falls
 * back to the local mock store so the demo keeps working with zero config.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseEnabled = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
