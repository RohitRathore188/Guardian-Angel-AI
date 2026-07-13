import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, LogOut, AlertTriangle, MapPin, Phone, ArrowRight, Loader } from 'lucide-react'
import { Case, mockCases } from '../../lib/mockData'
import apiClient from '../../lib/apiClient'

export default function CitizenDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])

  const loadCitizenData = async () => {
    setLoading(true)
    try {
      // Fetch cases from database
      const response = await apiClient.get('/api/cases')
      if (response.data && Array.isArray(response.data)) {
        // Filter to display reports created for/by this citizen
        // Since it's a demo, we can display all cases or simulate citizen-specific ones
        setReports(response.data)
      } else {
        setReports(mockCases)
      }
    } catch (err) {
      console.warn('API /api/cases offline. Using mock cases for citizen dashboard.', err)
      setReports(mockCases)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCitizenData()
  }, [])

  // Generate dynamic notifications based on case statuses
  useEffect(() => {
    const notifs = reports.map((c) => {
      let title = 'Report Received'
      let message = 'Your emergency request was logged and is undergoing AI assessment.'
      
      if (c.status === 'dispatched') {
        title = 'Responder Dispatched'
        message = `Help is on the way! Responder team has been mobilized to ${c.location.address.slice(0, 30)}...`
      } else if (c.status === 'rescued') {
        title = 'Child Secured & Rescued'
        message = 'The rescue operation is complete. Child is in safe custody and reunification is in progress!'
      } else if (c.status === 'closed') {
        title = 'Case Successfully Closed'
        message = 'Reunification completed. The report registry has been closed.'
      }

      return {
        id: `notif-${c.id}`,
        title,
        message,
        time: c.created_at,
        caseId: c.id
      }
    })
    setNotifications(notifs)
  }, [reports])

  return (
    <div className="min-h-screen bg-transparent flex flex-col max-w-7xl mx-auto w-full relative overflow-hidden px-5 py-6">

      {/* Header */}
      <header className="header-glass px-5 py-4 flex items-center justify-between relative z-10 rounded-2xl mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-slate-800 font-bold text-sm tracking-wider uppercase">Guardian Angel</h1>
            <p className="text-slate-500 text-[10px]">Citizen Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold truncate max-w-[150px]">{profile?.name || 'Citizen'}</span>
          <button onClick={signOut} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 relative z-10 scrollbar">
        {/* Large Emergency CTA */}
        <div className="card-glass-interactive p-6 border border-red-500/20 text-center relative overflow-hidden bg-red-950/10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30 animate-pulse">
            <AlertTriangle className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Report a Distressed Child</h2>
          <p className="text-slate-400 text-xs max-w-xl mx-auto mb-6">
            Instantly alert law enforcement, pediatric units, and volunteer rescue networks. Gemini AI will analyze conditions immediately.
          </p>
          <button
            onClick={() => navigate('/report')}
            className="btn-primary w-full max-w-md mx-auto py-4 text-sm font-bold flex items-center justify-center gap-2.5 rounded-xl shadow-lg shadow-primary/30 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            File Emergency Report Now
          </button>
        </div>

        {/* Hotlines */}
        <div className="grid grid-cols-2 gap-4">
          <a href="tel:1098" className="card-glass p-4 flex items-center gap-3 hover:border-primary/30 transition-all">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Child Helpline</p>
              <p className="text-white font-extrabold text-sm">1098</p>
            </div>
          </a>
          <a href="tel:112" className="card-glass p-4 flex items-center gap-3 hover:border-orange-500/30 transition-all">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">National Alert</p>
              <p className="text-white font-extrabold text-sm">112</p>
            </div>
          </a>
        </div>

        {/* Two-column layout for updates and cases */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Active Notifications / Case Updates */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Updates</h3>
            <div className="space-y-2.5">
              {loading ? (
                <div className="card-glass p-6 text-center text-slate-500 flex flex-col items-center gap-2">
                  <Loader className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-xs">Checking system updates...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="card-glass p-6 text-center text-slate-500 text-xs">
                  No active notifications or updates.
                </div>
              ) : (
                notifications.slice(0, 4).map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => navigate(`/companion?case_id=${n.caseId}`)}
                    className="card-glass p-4 border border-white/5 hover:border-white/10 transition-all cursor-pointer flex gap-3 items-start"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-white text-xs font-bold truncate">{n.title}</p>
                        <span className="text-[8px] text-slate-500 font-medium font-mono">
                          {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed truncate">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Reports */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Active Cases ({reports.length})</h3>
              <button onClick={loadCitizenData} className="text-[10px] text-slate-400 hover:text-white transition-colors">
                Refresh
              </button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="card-glass p-6 text-center text-slate-500 text-xs">Loading cases...</div>
              ) : reports.length === 0 ? (
                <div className="card-glass p-6 text-center text-slate-500 text-xs">
                  You have not filed any reports yet.
                </div>
              ) : (
                reports.map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => navigate(`/companion?case_id=${c.id}&tab=tracking`)}
                    className="card-glass p-4 border border-white/5 hover:border-primary/20 transition-all cursor-pointer flex gap-4 items-center justify-between animate-fade-in"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono text-white text-[11px] font-bold">
                          #{c.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          c.status === 'reported' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          c.status === 'dispatched' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] truncate">
                        <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span>{c.location.address}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
