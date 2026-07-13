import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Phone, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { mockCases } from '../lib/mockData'
import apiClient from '../lib/apiClient'
import Hero3DScene from '../components/Hero3DScene'

export default function LandingPage() {
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const [stats, setStats] = useState({ handled: 24, rescued: 18 })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/api/cases')
        if (response.data && Array.isArray(response.data)) {
          const handled = response.data.length
          const rescued = response.data.filter((c: any) => c.status === 'rescued' || c.status === 'closed').length
          setStats({ handled, rescued })
        }
      } catch (err) {
        const handled = mockCases.length
        const rescued = mockCases.filter(c => c.status === 'rescued' || c.status === 'closed').length
        setStats({ handled, rescued })
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-transparent">
      
      {/* Hero main pane */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-between px-8 lg:px-20 py-12 lg:py-24 max-w-7xl mx-auto w-full gap-12 z-10">
        
        {/* Left Column: Copywriting & CTAs */}
        <div className="flex-1 text-center lg:text-left space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-[10px] font-bold tracking-wider uppercase">
              National Dispatch & Rescue Sync
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
            Guardian <br />
            <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Angel AI</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Helping citizens and responders locate and rescue distressed children <strong className="text-slate-200">safely and instantly</strong> — with visual AI scanning and automated multi-agency dispatch.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
            {session ? (
              <button
                onClick={() => {
                  if (profile?.role === 'admin') navigate('/admin')
                  else if (profile?.role === 'citizen') navigate('/citizen-dashboard')
                  else navigate('/dashboard')
                }}
                className="btn-primary flex items-center justify-center gap-3 px-8 py-4 text-base rounded-xl cursor-pointer"
              >
                <Shield className="w-5 h-5" />
                Go to Command Deck
              </button>
            ) : (
              <>
                <button
                  id="report-emergency-btn"
                  onClick={() => navigate('/report')}
                  className="btn-primary flex items-center justify-center gap-3 px-8 py-4 text-base rounded-xl cursor-pointer font-bold"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Report Emergency
                </button>
                <button
                  id="authority-login-btn"
                  onClick={() => navigate('/login')}
                  className="btn-secondary flex items-center justify-center gap-3 px-8 py-4 text-base rounded-xl cursor-pointer"
                >
                  <Shield className="w-5 h-5" />
                  Authority Portal
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column: 3D Connected Rescue Network Map */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none h-[300px] sm:h-[450px]">
          <Hero3DScene />
        </div>

      </main>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-0 border-t border-white/10 bg-dark-900/60 backdrop-blur-md relative z-10">
        {[
          { label: 'Cases Handled', value: `${stats.handled} Active`, icon: '🆘' },
          { label: 'Avg. Response', value: '< 5 min', icon: '⚡' },
          { label: 'Children Rescued', value: `${stats.rescued} Saved`, icon: '👼' },
        ].map((stat) => (
          <div key={stat.label} className="py-5 text-center border-r border-white/10 last:border-r-0">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-white font-extrabold text-lg">{stat.value}</div>
            <div className="text-slate-400 text-xs font-semibold">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Emergency hotline footer */}
      <div className="bg-primary/5 border-t border-primary/10 py-3 px-6 flex items-center justify-center gap-2 text-sm relative z-10">
        <Phone className="w-4 h-4 text-primary" />
        <span className="text-slate-400 font-semibold">
          Child Helpline: <strong className="text-primary font-bold">1098</strong> &nbsp;|&nbsp; Emergency Operations: <strong className="text-primary font-bold">112</strong>
        </span>
      </div>
    </div>
  )
}
