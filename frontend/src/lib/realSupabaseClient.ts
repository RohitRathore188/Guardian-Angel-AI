import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let clientInstance: any = null

try {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
} catch (err) {
  console.warn('Failed to initialize real Supabase client:', err)
}

export const realSupabaseClient = clientInstance
