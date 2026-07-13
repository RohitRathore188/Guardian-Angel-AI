import axios from 'axios'
import { supabase } from './supabaseClient'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!apiBaseUrl) {
  console.warn('VITE_API_BASE_URL environment variable is missing!')
}

const apiClient = axios.create({
  baseURL: apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
})

// Attach Supabase JWT to every request automatically
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export default apiClient
