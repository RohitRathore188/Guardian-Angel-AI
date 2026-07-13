import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Shield, Mail, Lock, User } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'citizen' | 'authority' | 'admin'>('citizen')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const dbRole = role === 'citizen' ? 'citizen' : role === 'authority' ? 'police' : 'admin'

    // Create auth user with metadata for the DB trigger
    const { data, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: name,
          role: dbRole
        }
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      if (role === 'admin') navigate('/admin')
      else if (role === 'citizen') navigate('/citizen-dashboard')
      else navigate('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden bg-transparent">
      <div className="w-full max-w-sm relative z-10">
        
        <div className="bg-white/80 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)]">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5 shadow-[0_4px_16px_rgba(37,99,235,0.12)]">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Account</h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">Register as an authority or admin</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="text-slate-600 text-sm font-semibold block mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="name-input"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-glass pl-10 text-slate-900 placeholder-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 text-sm font-semibold block mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-glass pl-10 text-slate-900 placeholder-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 text-sm font-semibold block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password-input"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-glass pl-10 text-slate-900 placeholder-slate-400"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 text-sm font-semibold block mb-2">Role</label>
              <select
                id="role-select"
                value={role}
                onChange={(e) => setRole(e.target.value as 'citizen' | 'authority' | 'admin')}
                className="input-glass text-slate-900"
              >
                <option value="citizen">Citizen (Report emergency &amp; track)</option>
                <option value="authority">Authority (Police / Hospital / NGO)</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              id="register-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-7">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-indigo-700 font-bold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
