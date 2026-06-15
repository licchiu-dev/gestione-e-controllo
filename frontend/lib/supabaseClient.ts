import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function createDummyClient() {
  return {
    auth: {
      signInWithPassword: async () => ({ error: { message: 'Environment variables are missing.' } }),
      signUp: async () => ({ data: null, error: { message: 'Environment variables are missing.' } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null } }),
    },
    from: () => ({ insert: async () => ({ error: { message: 'Environment variables are missing.' } }) }),
  }
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createDummyClient()
