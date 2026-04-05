import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Client for public reads + realtime (Anon Key)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null

// Client for server-side writes (Service Role Key)
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null

// Log connection status (only in browser)
if (typeof window !== 'undefined') {
  if (supabase) {
    console.log('[Supabase] Client initialized OK — URL:', supabaseUrl.slice(0, 30) + '...')
  } else {
    console.error('[Supabase] Client is NULL! NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl, 'NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey)
  }
}
