import { realSupabaseClient } from './realSupabaseClient'
import { mockSupabaseClient } from './mockSupabaseClient'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidUrl = (url: string | undefined): boolean => {
  try {
    if (!url) return false
    new URL(url)
    return url.startsWith('http://') || url.startsWith('https://')
  } catch {
    return false
  }
}

const isPlaceholder = (val: string | undefined): boolean => {
  return !val || val.includes('your_') || val.includes('placeholder')
}

// 3. Create IS_MOCK_MODE boolean export
export const IS_MOCK_MODE = isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey) || !isValidUrl(supabaseUrl);

if (IS_MOCK_MODE) {
  console.warn('Invalid or placeholder Supabase credentials. Initializing mock client for Hackathon presentation mode.')
}

// Export the active client
export const supabase = IS_MOCK_MODE ? mockSupabaseClient : realSupabaseClient;
