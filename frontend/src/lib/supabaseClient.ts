import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return url.startsWith('http://') || url.startsWith('https://')
  } catch {
    return false
  }
}

const isPlaceholder = (val: string) => {
  return !val || val.includes('your_') || val.includes('placeholder')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: any

let currentMockRole: 'authority' | 'admin' = 'authority'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSession: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authChangeCallback: any = null

if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey) || !isValidUrl(supabaseUrl)) {
  console.warn('Invalid or placeholder Supabase credentials. Initializing mock client for Hackathon presentation mode.')

  supabaseClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: mockSession }, error: null }),
      onAuthStateChange: (cb: any) => {
        authChangeCallback = cb
        // Call immediately with initial session state
        cb('INITIAL_SESSION', mockSession)
        return { data: { subscription: { unsubscribe: () => { authChangeCallback = null } } } }
      },
      signInWithPassword: async ({ email }: { email: string }) => {
        currentMockRole = email.toLowerCase().includes('admin') ? 'admin' : 'authority'
        const dummyUser = { id: 'mock-user-123', email }
        const dummySession = { access_token: 'mock-token', user: dummyUser }
        mockSession = dummySession
        if (authChangeCallback) {
          await authChangeCallback('SIGNED_IN', dummySession)
        }
        return Promise.resolve({ data: { user: dummyUser, session: dummySession }, error: null })
      },
      signUp: async ({ email }: { email: string }) => {
        currentMockRole = email.toLowerCase().includes('admin') ? 'admin' : 'authority'
        const dummyUser = { id: 'mock-user-123', email }
        const dummySession = { access_token: 'mock-token', user: dummyUser }
        mockSession = dummySession
        if (authChangeCallback) {
          await authChangeCallback('SIGNED_IN', dummySession)
        }
        return Promise.resolve({ data: { user: dummyUser, session: dummySession }, error: null })
      },
      signOut: () => {
        mockSession = null
        if (authChangeCallback) {
          authChangeCallback('SIGNED_OUT', null)
        }
        return Promise.resolve({ error: null })
      }
    },
    from: (table: string) => ({
      select: () => {
        const query: any = {
          eq: () => ({
            single: () => Promise.resolve({
              data: table === 'profiles' ? { id: 'mock-user-123', name: currentMockRole === 'admin' ? 'Demo Admin' : 'Demo Authority', role: currentMockRole } : null,
              error: null
            })
          }),
          order: () => Promise.resolve({
            data: [
              { id: 'mock-user-123', name: 'Demo Authority', role: 'authority', created_at: new Date().toISOString() },
              { id: 'mock-user-456', name: 'System Admin', role: 'admin', created_at: new Date().toISOString() }
            ],
            error: null
          })
        }
        query.then = (cb: any) => Promise.resolve({ data: [], error: null }).then(cb)
        return query
      },
      insert: () => Promise.resolve({ error: null })
    }),
    storage: {
      from: () => ({
        upload: (path: string) => Promise.resolve({ data: { path }, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://placehold.co/400x300/1a1a2e/e94560?text=Uploaded+${encodeURIComponent(path)}` } })
      })
    },
    channel: () => ({
      on: () => ({
        subscribe: () => ({})
      })
    }),
    removeChannel: () => {}
  }
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = supabaseClient
