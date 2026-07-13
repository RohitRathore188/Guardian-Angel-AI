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

if (
  isPlaceholder(supabaseUrl) ||
  isPlaceholder(supabaseAnonKey) ||
  !isValidUrl(supabaseUrl)
) {
  console.warn(
    'Invalid or placeholder Supabase credentials. Initializing mock client for Hackathon presentation mode.'
  )

  supabaseClient = {
    auth: {
      getSession: async () => ({
        data: { session: mockSession },
        error: null,
      }),

      onAuthStateChange: (cb: any) => {
        authChangeCallback = cb

        cb('INITIAL_SESSION', mockSession)

        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authChangeCallback = null
              },
            },
          },
        }
      },

      signInWithPassword: async ({ email }: { email: string }) => {
        currentMockRole = email.toLowerCase().includes('admin')
          ? 'admin'
          : 'authority'

        const dummyUser = {
          id: 'mock-user-123',
          email,
        }

        const dummySession = {
          access_token: 'mock-token',
          user: dummyUser,
        }

        mockSession = dummySession

        if (authChangeCallback) {
          await authChangeCallback('SIGNED_IN', dummySession)
        }

        return {
          data: {
            user: dummyUser,
            session: dummySession,
          },
          error: null,
        }
      },

      signUp: async ({ email }: { email: string }) => {
        currentMockRole = email.toLowerCase().includes('admin')
          ? 'admin'
          : 'authority'

        const dummyUser = {
          id: 'mock-user-123',
          email,
        }

        const dummySession = {
          access_token: 'mock-token',
          user: dummyUser,
        }

        mockSession = dummySession

        if (authChangeCallback) {
          await authChangeCallback('SIGNED_IN', dummySession)
        }

        return {
          data: {
            user: dummyUser,
            session: dummySession,
          },
          error: null,
        }
      },

      signOut: async () => {
        mockSession = null

        if (authChangeCallback) {
          authChangeCallback('SIGNED_OUT', null)
        }

        return {
          error: null,
        }
      },
    },

    from: (table: string) => ({
      select: () => {
        const query: any = {
          eq: () => ({
            single: async () => ({
              data:
                table === 'profiles'
                  ? {
                      id: 'mock-user-123',
                      name:
                        currentMockRole === 'admin'
                          ? 'Demo Admin'
                          : 'Demo Authority',
                      role: currentMockRole,
                    }
                  : null,
              error: null,
            }),
          }),

          order: async () => ({
            data: [
              {
                id: 'mock-user-123',
                name: 'Demo Authority',
                role: 'authority',
                created_at: new Date().toISOString(),
              },
              {
                id: 'mock-user-456',
                name: 'System Admin',
                role: 'admin',
                created_at: new Date().toISOString(),
              },
            ],
            error: null,
          }),
        }

        query.then = (cb: any) =>
          Promise.resolve({
            data: [],
            error: null,
          }).then(cb)

        return query
      },

      insert: async () => ({
        error: null,
      }),
    }),

    storage: {
      from: () => ({
        upload: async (path: string) => ({
          data: { path },
          error: null,
        }),

        getPublicUrl: (path: string) => ({
          data: {
            publicUrl: `https://placehold.co/600x400?text=${encodeURIComponent(
              path
            )}`,
          },
        }),
      }),
    },

    channel: () => {
      const channel = {
        on: () => channel,

        subscribe: () => ({
          unsubscribe: () => {},
        }),

        unsubscribe: () => {},
      }

      return channel
    },

    removeChannel: () => {},
  }
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = supabaseClient
