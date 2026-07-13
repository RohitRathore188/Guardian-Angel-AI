import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Shield, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Fetch profile to redirect by role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'admin') navigate('/admin')
      else if (profile?.role === 'citizen') navigate('/citizen-dashboard')
      else navigate('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-transparent">
      <div className="w-full max-w-sm relative z-10">
        
        {/* Premium glass card */}
        <div className="card-glass p-10">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5 shadow-[0_4px_16px_rgba(37,99,235,0.12)]">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Authority Login</h1>
            <p className="text-slate-400 text-sm mt-1.5 font-medium">Sign in to access the command dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-slate-300 text-sm font-semibold block mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-glass pl-10 text-white placeholder-slate-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-semibold block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-glass pl-10 text-white placeholder-slate-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-7">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-red-400 font-bold transition-colors">
              Register here
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <Link to="/" className="text-slate-500 text-sm hover:text-white transition-colors font-medium">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
