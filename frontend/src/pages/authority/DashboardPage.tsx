import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LiveMap from '../../components/LiveMap'
import { Case, mockCases } from '../../lib/mockData'
import CaseCard from '../../components/CaseCard'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import apiClient from '../../lib/apiClient'
import { 
  LogOut, RefreshCw, Search, Shield, Bell, AlertTriangle, 
  CheckCircle, Activity, Settings, Database
} from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import SeverityBadge from '../../components/SeverityBadge'
import { getRoleConfig } from '../../config/getRoleConfig'

interface MockUser {
  id: string
  name: string
  email: string
  role: string
  status: string
}

const mockAgencies = [
  { name: 'St. Jude Emergency Center', type: 'Hospital', phone: '+91 44 9110 3829', latitude: 13.0805, longitude: 80.2730, address: 'Periamet, Chennai' },
  { name: '17th Precinct Police Station', type: 'Police Station', phone: '+91 44 9110 9988', latitude: 13.0630, longitude: 80.2520, address: 'Egmore, Chennai' },
  { name: 'Municipal Child Welfare Office', type: 'Child Welfare Office', phone: '+91 44 9110 4433', latitude: 13.0450, longitude: 80.2600, address: 'Mylapore, Chennai' },
  { name: 'Hope Family Foundation', type: 'NGO Shelter', phone: '+91 44 9110 0011', latitude: 13.0850, longitude: 80.2100, address: 'Anna Nagar, Chennai' }
]

export default function DashboardPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [demoModeActive, setDemoModeActive] = useState(true)

  const generateDemoCases = () => {
    const baseLat = 13.0827
    const baseLng = 80.2707
    const generated: Case[] = []
    
    for (let i = 1; i <= 40; i++) {
      const offsetLat = (Math.random() - 0.5) * 0.15
      const offsetLng = (Math.random() - 0.5) * 0.15
      const lat = baseLat + offsetLat
      const lng = baseLng + offsetLng
      const severity = i % 4 === 0 ? 'critical' : i % 3 === 0 ? 'high' : 'moderate'
      const status = i % 5 === 0 ? 'closed' : i % 3 === 0 ? 'rescued' : i % 2 === 0 ? 'dispatched' : 'reported'
      
      generated.push({
        id: `democase-${1000 + i}`,
        location: { lat, lng, address: `${100 + i} Main Street, Chennai Sector ${i % 5}` },
        status,
        ai_severity: severity,
        ai_analysis: `Demo AI Scan: Detected potential minor, estimated age ${2 + (i % 6)} years old, located outdoors in ${severity === 'critical' ? 'heavy weather exposure hazards' : 'stable environmental conditions'}. Scan confidence is ${85 + (i % 15)}%.`,
        ai_dispatch_reason: `System auto-route allocated to nearest ${severity === 'critical' ? 'Precinct Cruiser' : 'NGO Shelter'} unit.`,
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
        evidence: [{ file_url: 'https://placehold.co/400x300/111118/e94560?text=Scan+Photo' }]
      })
    }
    return generated
  }

  const [cases, setCases] = useState<Case[]>(generateDemoCases())
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [loadingCases, setLoadingCases] = useState(false)

  const [activeTab, setActiveTab] = useState('Dashboard')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showTraffic, setShowTraffic] = useState(false)
  const showSearchZones = true
  const [opRadius, setOpRadius] = useState<number>(5) // default 5 KM
  const [caseSubTab, setCaseSubTab] = useState<'telemetry' | 'vision'>('telemetry')
  const authLat = 13.0827
  const authLng = 80.2707

  // ── Multi-Role Views Adaptations ──
  const [activeRoleOverride, setActiveRoleOverride] = useState<string | null>(null)
  const currentRole = activeRoleOverride || profile?.rawRole || 'police'

  // Admin user manager states
  const [mockUsers, setMockUsers] = useState<MockUser[]>([
    { id: 'usr-1', name: 'Sarah J.', email: 'sarah.j@police.gov', role: 'police', status: 'Active' },
    { id: 'usr-2', name: 'Dr. Aaron', email: 'aaron@generalhospital.org', role: 'hospital', status: 'Active' },
    { id: 'usr-3', name: 'Raj Kumar', email: 'raj@ngo-welfare.org', role: 'ngo', status: 'Active' },
    { id: 'usr-4', name: 'Rahul Dev', email: 'rahul.dev@volunteer.in', role: 'volunteer', status: 'Active' },
    { id: 'usr-5', name: 'Priya Sharma', email: 'priya@welfare.gov.in', role: 'child_welfare', status: 'Active' },
    { id: 'usr-6', name: 'John Doe', email: 'john@citizen.com', role: 'citizen', status: 'Active' }
  ])

  // Search input state
  const [searchQuery, setSearchQuery] = useState('')

  // Notifications bell state
  const { notifications, markAsRead, markAllAsRead, addNotification } = useNotifications()
  const [bellOpen, setBellOpen] = useState(false)

  // System Health statistics
  const systemHealthMetrics = {
    supabaseStatus: 'Connected',
    supabaseLatency: '42ms',
    geminiStatus: 'Connected',
    geminiModel: 'Gemini 1.5 Flash',
    apiStatus: 'Online',
    mockMode: 'Enabled'
  }

  // Helper mapper for structured vision reports
  const getVisionData = (c: Case) => {
    if (c.structured_analysis) return c.structured_analysis
    const isCritical = c.ai_severity === 'critical'
    return {
      severity: c.ai_severity,
      assessment: c.ai_analysis,
      age: isCritical ? "Newborn (0-2 months)" : "2-3 years old",
      gender: "Male",
      condition: isCritical ? "Dehydrated, crying, hypothermic exposure" : "Conscious, mild bruising, frightened",
      injuries: isCritical ? ["Dehydration", "Exposure", "Hypothermia"] : ["Bleeding", "Exposure"],
      blood_detected: isCritical ? false : true,
      conscious: true,
      crying: true,
      weather_exposure: "High",
      hazards: isCritical ? ["Road Hazard", "Traffic Hazard"] : ["None"],
      crowd_density: "Low",
      objects_detected: ["Child", "Blanket", "Bag", "Bottle", "Road"],
      confidence: isCritical ? 92 : 88,
      recommended_response: isCritical 
        ? "Immediately dispatch pediatric trauma ambulance and local precinct police cruiser." 
        : "Alert regional child welfare officer and dispatch nearest volunteer team."
    }
  }

  // ── Dynamic Role Engine ──
  // All role-specific data lives in src/config/roles/*.ts
  // This component is a pure renderer — it reads config and renders UI.
  const config = getRoleConfig(currentRole)

  // Notification filter driven by config.notificationCategories
  // Each role declares which categories it receives in src/config/roles/*.ts
  const filteredNotifications = notifications.filter((n) =>
    config.notificationCategories.includes(n.category)
  )
  const unreadBellCount = filteredNotifications.filter((n) => !n.read).length

  // Sync tab navigation on role override
  useEffect(() => {
    if (!config.tabs.includes(activeTab)) {
      setActiveTab('Dashboard')
    }
  }, [currentRole])

  const [activeDispatches, setActiveDispatches] = useState<Record<string, any>>({})

  // Glide animation loop for dispatched vehicles
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDispatches((prev) => {
        const copy = { ...prev }
        let changed = false

        Object.keys(copy).forEach((caseId) => {
          const d = copy[caseId]
          if (d.progress < 1) {
            const nextProgress = Math.min(d.progress + 0.02, 1)
            const currentLat = d.startLat + (d.targetLat - d.startLat) * nextProgress
            const currentLng = d.startLng + (d.targetLng - d.startLng) * nextProgress

            copy[caseId] = {
              ...d,
              progress: nextProgress,
              currentLat,
              currentLng,
            }
            changed = true

            if (nextProgress === 1) {
              const label = d.type === 'hospital' ? 'Ambulance' : d.type === 'ngo' ? 'NGO Rescue Van' : 'Police Cruiser'
              alert(`🟢 [DISPATCH ARRIVAL] ${label} has reached coordinates for Case #${caseId.slice(0, 8).toUpperCase()}. The child has been accommodated and secured!`)
            }
          }
        })

        return changed ? copy : prev
      })
    }, 150)

    return () => clearInterval(interval)
  }, [])

  const startDispatchAnimation = (caseId: string, targetLat: number, targetLng: number, typeOverride?: string) => {
    const type = typeOverride || (currentRole === 'hospital' ? 'hospital' : currentRole === 'ngo' ? 'ngo' : 'police')
    const startLat = targetLat + (Math.random() > 0.5 ? 0.015 : -0.015)
    const startLng = targetLng + (Math.random() > 0.5 ? 0.015 : -0.015)

    setActiveDispatches((prev) => ({
      ...prev,
      [caseId]: {
        caseId,
        startLat,
        startLng,
        currentLat: startLat,
        currentLng: startLng,
        targetLat,
        targetLng,
        progress: 0,
        type,
      },
    }))
  }

  const loadCases = async () => {
    if (demoModeActive) {
      setCases(generateDemoCases())
      return
    }
    setLoadingCases(true)
    try {
      const response = await apiClient.get('/api/cases')
      if (response.data && Array.isArray(response.data)) {
        setCases(response.data)
      }
    } catch (err) {
      console.warn('Backend API /api/cases offline. Using mock cases for demonstration.', err)
      setCases(mockCases)
    } finally {
      setLoadingCases(false)
    }
  }

  const handleToggleDemoData = () => {
    if (!demoModeActive) {
      setCases(generateDemoCases())
      setDemoModeActive(true)
    } else {
      setDemoModeActive(false)
      loadCases()
    }
  }

  useEffect(() => {
    loadCases()
  }, [])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('reports-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        loadCases()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleStatusUpdate = async (caseId: string, newStatus: string) => {
    if (newStatus === 'dispatched') {
      const match = cases.find((c) => c.id === caseId)
      if (match) {
        startDispatchAnimation(caseId, match.location.lat, match.location.lng)
      }
    }

    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status: newStatus as Case['status'] } : c))
    )
    if (selectedCase?.id === caseId) {
      setSelectedCase((prev) => prev ? { ...prev, status: newStatus as Case['status'] } : prev)
    }

    try {
      await apiClient.put(`/api/cases/${caseId}/status`, { status: newStatus })
    } catch (err) {
      console.warn('Status update API offline; kept optimistic local update for demo.', err)
    }
  }

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Case filter driven by config.caseFilter
  // Each role declares its filter strategy in src/config/roles/*.ts
  const filteredCases = cases.filter((c) => {
    const dist = getDistance(authLat, authLng, c.location.lat, c.location.lng)
    const matchesRadius = dist <= opRadius

    const searchString = searchQuery.toLowerCase()
    const matchesSearch =
      c.id.toLowerCase().includes(searchString) ||
      c.location.address.toLowerCase().includes(searchString) ||
      c.ai_analysis.toLowerCase().includes(searchString)

    switch (config.caseFilter) {
      case 'own':
        // Citizen only sees their own filed reports
        return matchesRadius && matchesSearch && (c.id.includes('citizen') || c.id.startsWith('mock-'))
      case 'active':
        // Volunteer / Hospital only see open (non-closed) cases
        return matchesRadius && matchesSearch && c.status !== 'closed'
      case 'critical':
        // Future role: only critical severity
        return matchesRadius && matchesSearch && c.ai_severity === 'critical'
      case 'all':
      default:
        return matchesRadius && matchesSearch
    }
  })

  const hasCriticalCase = filteredCases.some(c => c.ai_severity === 'critical' && c.status !== 'closed')

  // Dynamic actions click router
  const handleQuickAction = (action: string) => {
    if (action.includes('SOS') || action.includes('Report')) {
      navigate('/report')
    } else if (action.includes('Helpline') || action.includes('1098')) {
      window.open('tel:1098')
    } else if (action.includes('Police') || action.includes('112')) {
      window.open('tel:112')
    } else if (action.includes('Dispatch') || action.includes('Accept')) {
      if (selectedCase) {
        handleStatusUpdate(selectedCase.id, 'dispatched')
      } else {
        alert('Please select an active incident from the list first.')
      }
    } else if (action.includes('Complete') || action.includes('Secure') || action.includes('Reunify')) {
      if (selectedCase) {
        handleStatusUpdate(selectedCase.id, 'rescued')
      } else {
        alert('Please select an active incident from the list first.')
      }
    } else if (action.includes('Companion')) {
      if (selectedCase) {
        navigate(`/companion?case_id=${selectedCase.id}`)
      } else {
        alert('Please select an incident to open the companion console.')
      }
    } else if (action.includes('Notes') || action.includes('Counselling') || action.includes('Legal')) {
      alert(`Action successfully logged in incident database: ${action}`)
    } else if (action.includes('Broadcast')) {
      addNotification({
        caseId: 'global',
        title: '📢 CRITICAL BROADCAST ALERT',
        body: 'Alert issued across all emergency grids. Check tracking zones.',
        category: 'Emergency',
        priority: 'critical'
      })
      alert('Global Alert Broadcasted to all active response units.')
    } else if (action.includes('Shelter')) {
      alert('Shelter capacity allocated. St. Jude Center updated.')
    } else {
      alert(`Triggered action: ${action}`)
    }
  }

  // Admin user manager update
  const handleUserRoleChange = (userId: string, newRole: string) => {
    setMockUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    if (userId === 'usr-1') {
      // If updating Sarah J. (current user context), trigger live override change
      setActiveRoleOverride(newRole)
    }
    alert(`User Role updated to: ${newRole.toUpperCase()}`)
  }

  const handleDownloadPDF = (reportId: string) => {
    alert(`Generating PDF Summary for Incident Case #${reportId.slice(0, 8).toUpperCase()}... File is preparing for download!`)
  }

  return (
    <div className="h-screen bg-transparent flex flex-col overflow-hidden">
      {/* ── Fixed Critical Incident Banner ── */}
      {hasCriticalCase && (
        <div className="bg-red-600 text-white text-xs font-bold py-2.5 px-6 flex justify-between items-center z-50 relative animate-pulse shrink-0">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            🚨 Critical Active Child Rescue Alert — Responders Mobilizing in Search Radius
          </span>
          <button 
            onClick={() => setActiveTab('GIS Map')} 
            className="bg-white text-red-600 px-3.5 py-1 rounded-lg font-bold uppercase text-[9px] hover:bg-slate-100 transition-colors"
          >
            Monitor Live GIS Map
          </button>
        </div>
      )}

      {/* Top bar */}
      <header className="header-glass px-6 py-4 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wider uppercase">{config.title}</h1>
            <p className="text-slate-500 text-[10px]">{config.subtitle}</p>
          </div>
        </div>

        {/* Navigation Tabs (Dynamic based on allowed permissions) */}
        <div className="hidden md:flex items-center gap-1">
          {config.tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === tab
                  ? 'bg-primary text-white border border-primary/20 shadow-md shadow-primary/20'
                  : 'text-slate-400 hover:text-white hover:bg-dark-700/50'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          
          {/* Demo Mode Toggle */}
          <div className="flex items-center gap-2 bg-dark-800/80 border border-white/5 px-2.5 py-1 rounded-xl">
            <span className="text-[9px] text-slate-500 font-bold uppercase pl-1">Demo Data:</span>
            <button 
              onClick={handleToggleDemoData}
              className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                demoModeActive ? 'bg-primary/20 text-primary' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {demoModeActive ? 'Active' : 'Disabled'}
            </button>
          </div>

          {/* Hackathon Role override selector */}
          <div className="flex items-center gap-1 bg-dark-800/80 border border-white/5 px-2 py-1 rounded-xl">
            <span className="text-[9px] text-slate-500 font-bold uppercase pl-1">Role View:</span>
            <select
              value={currentRole}
              onChange={(e) => setActiveRoleOverride(e.target.value)}
              className="bg-transparent border-0 text-[10px] text-white font-bold uppercase focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="citizen">Citizen</option>
              <option value="police">Police</option>
              <option value="hospital">Hospital</option>
              <option value="volunteer">Volunteer</option>
              <option value="ngo">NGO</option>
              <option value="child_welfare">Child Welfare</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase hidden sm:block">Radius:</span>
            <select
              value={opRadius}
              onChange={(e) => setOpRadius(parseFloat(e.target.value))}
              className="bg-dark-800/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/10"
            >
              <option value={2}>2 KM</option>
              <option value={5}>5 KM</option>
              <option value={10}>10 KM</option>
              <option value={100}>All Cases</option>
            </select>
          </div>

          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={config.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-dark-800/60 border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/10 w-48"
            />
          </div>

          <div className="flex items-center gap-2">
            
            {/* Centralized Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setBellOpen(!bellOpen)}
                className="w-9 h-9 rounded-xl bg-dark-800/80 border border-white/5 flex items-center justify-center relative hover:bg-dark-850 transition-all text-slate-300 hover:text-white"
              >
                <Bell className="w-4 h-4" />
                {unreadBellCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[8px] font-black text-white flex items-center justify-center rounded-full border border-dark-900 animate-pulse">
                    {unreadBellCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {bellOpen && (
                <div className="absolute right-0 mt-2.5 w-64 bg-dark-900/95 border border-white/10 rounded-xl p-3 shadow-2xl z-[1000] backdrop-blur-md text-xs text-white">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Operations Feed ({unreadBellCount})</span>
                    <button onClick={markAllAsRead} className="text-[9px] text-primary hover:underline">Mark all read</button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar pr-0.5">
                    {filteredNotifications.length === 0 ? (
                      <p className="text-slate-500 py-3 text-center">No alerts logged</p>
                    ) : (
                      filteredNotifications.slice(0, 5).map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            markAsRead(n.id)
                            setBellOpen(false)
                          }}
                          className={`p-2 rounded-lg cursor-pointer border transition-colors ${
                            n.read ? 'bg-dark-800/40 border-white/5' : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                          }`}
                        >
                          <div className="flex justify-between font-bold text-[10px]">
                            <span className="truncate">{n.title}</span>
                            <span className={`text-[8px] uppercase ${
                              n.priority === 'critical' ? 'text-red-400' : 'text-slate-500'
                            }`}>{n.priority}</span>
                          </div>
                          <p className="text-slate-400 text-[9px] mt-0.5 leading-relaxed">{n.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs text-white border border-primary/20">
                {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'SJ'}
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-dark-900" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-white text-xs font-semibold">{profile?.name || 'Sarah J.'}</p>
              <p className="text-slate-500 text-[9px] uppercase font-black">{config.roleName}</p>
            </div>
            <button onClick={signOut} className="p-2 rounded-lg hover:bg-dark-700 text-slate-400 hover:text-white transition-colors ml-2">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden p-6 bg-dark-950">
        
        {/* TAB 1: Dashboard Workspace */}
        {activeTab === 'Dashboard' ? (
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            
            {/* Dynamic statistics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
              {config.stats.map((stat, i) => (
                <div key={i} className="card p-5 border border-white/10 bg-dark-900/40 hover:border-white/20 transition-all flex flex-col justify-between">
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">{stat.label}</p>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                  <p className="text-slate-400 text-[10px] mt-1.5">{stat.desc}</p>
                </div>
              ))}
            </div>

            {/* Split workspace */}
            <div className="flex-1 flex flex-col xl:grid xl:grid-cols-12 gap-6 overflow-hidden">
              
              {/* Column A: Interactive GIS Map or placements/SOS progress boards (Left) */}
              <div className="col-span-12 xl:col-span-6 flex flex-col gap-6 overflow-hidden h-[300px] xl:h-full">
                
                {currentRole === 'citizen' ? (
                  /* Citizen Rescue Tracker progress console */
                  <div className="flex-1 card p-5 border border-white/10 flex flex-col justify-between overflow-y-auto bg-dark-900/40">
                    <div>
                      <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary animate-pulse" />
                        My Active SOS Status Tracker
                      </h3>
                      <div className="relative border-l border-white/5 pl-4 ml-2.5 space-y-4 text-[10px] text-slate-400">
                        {[
                          { label: 'Emergency Report Logged', desc: 'Case logged at coordinate coordinates.', done: true },
                          { label: 'AI Risk Graded', desc: 'Case prioritised as HIGH/CRITICAL severity.', done: true },
                          { label: 'Ambulance / Patrol Dispatched', desc: 'Vehicles en route via GPS routing.', done: selectedCase?.status !== 'reported' },
                          { label: 'Child Secured & Accommodated', desc: 'Minor placed in shelter facility.', done: selectedCase?.status === 'rescued' || selectedCase?.status === 'closed' }
                        ].map((s, idx) => (
                          <div key={idx} className="relative">
                            <div className={`absolute -left-7 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${
                              s.done
                                ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                : 'bg-dark-700 border-white/5 text-slate-655'
                            }`}>
                              {s.done ? <CheckCircle className="w-2.5 h-2.5" /> : <div className="w-1 h-1 rounded-full bg-slate-600" />}
                            </div>
                            <p className={`font-bold ${s.done ? 'text-white' : 'text-slate-500'}`}>{s.label}</p>
                            <p className="text-[9px] text-slate-500">{s.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 text-[10px] text-slate-300">
                      <strong>AI Advice:</strong> Seek a covered dryer shelter area immediately. Keep child calm. Do not move unless danger is imminent.
                    </div>
                  </div>
                ) : currentRole === 'child_welfare' ? (
                  /* Child Welfare Accommodations placement dashboard */
                  <div className="flex-1 card p-5 border border-white/10 flex flex-col overflow-y-auto bg-dark-900/40 space-y-4">
                    <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-2">
                      Verified Placement Facilities
                    </h3>
                    <div className="space-y-3">
                      {mockAgencies.filter(a => a.type.includes('Welfare') || a.type.includes('Shelter')).map((a, i) => (
                        <div key={i} className="bg-dark-950/60 p-3.5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                          <div>
                            <p className="text-white font-bold">{a.name}</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">{a.address}</p>
                          </div>
                          <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            Available Beds: {4 + i * 2}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Default Map view for operational commanders */
                  <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 card shadow-2xl">
                    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
                      <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`bg-dark-900/90 border rounded-lg px-3 py-2 text-[10px] font-semibold transition-all flex items-center gap-2 shadow-lg ${showHeatmap ? 'border-primary text-white bg-primary/10' : 'border-white/10 text-slate-300'
                          }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Heatmap
                      </button>
                      <button
                        onClick={() => setShowTraffic(!showTraffic)}
                        className={`bg-dark-900/90 border rounded-lg px-3 py-2 text-[10px] font-semibold transition-all flex items-center gap-2 shadow-lg ${showTraffic ? 'border-orange-500 text-white bg-orange-500/10' : 'border-white/10 text-slate-300'
                          }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        Traffic
                      </button>
                    </div>

                    <LiveMap
                      cases={filteredCases}
                      selectedCase={selectedCase}
                      onCaseSelect={setSelectedCase}
                      showHeatmap={showHeatmap}
                      showTraffic={showTraffic}
                      showSearchZones={showSearchZones}
                      activeDispatches={activeDispatches}
                    />
                  </div>
                )}

                {/* Quick actions deck */}
                <div className="card-glass p-5 border border-white/10 flex flex-col gap-3 shrink-0">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-1 text-slate-400">
                    Quick Action Command Deck
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {config.actions.map((act) => (
                      <button
                        key={act}
                        onClick={() => handleQuickAction(act)}
                        className="py-2.5 px-3 bg-dark-700/40 hover:bg-dark-700 border border-white/5 rounded-xl text-[10px] font-semibold text-slate-300 hover:text-white transition-all uppercase tracking-wider text-center"
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column B: Dynamic Case Feed (Middle) */}
              <div className="col-span-12 xl:col-span-3 flex flex-col gap-4 overflow-hidden h-[350px] xl:h-full">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h2 className="text-white font-bold text-xs tracking-wider uppercase">Incidents Queue ({filteredCases.length})</h2>
                  <button
                    onClick={loadCases}
                    disabled={loadingCases}
                    className="p-1.5 rounded-lg hover:bg-dark-700 text-slate-400 hover:text-white transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingCases ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar">
                  {filteredCases.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No matching cases in this view.
                    </div>
                  ) : (
                    filteredCases.map((c) => (
                      <CaseCard
                         key={c.id}
                         case_={c}
                         isSelected={selectedCase?.id === c.id}
                         onClick={() => setSelectedCase(c)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Column C: Selected Case Details & Live Alerts Feed (Right) */}
              <div className="col-span-12 xl:col-span-3 flex flex-col gap-6 overflow-hidden h-[400px] xl:h-full">
                
                {/* Selected Case details panel */}
                <div className="flex-1 card p-5 border border-white/10 flex flex-col overflow-y-auto bg-dark-900/30">
                  <h2 className="text-white font-bold text-xs tracking-wider uppercase border-b border-white/5 pb-2 mb-4">
                    Case Inspector View
                  </h2>

                  {selectedCase ? (
                    <div className="flex flex-col gap-4 flex-1">
                      {/* Visual evidence */}
                      <div className="w-full h-28 rounded-xl overflow-hidden bg-dark-700 border border-white/10 shrink-0">
                        <img
                          src={selectedCase.evidence[0] ? selectedCase.evidence[0].file_url : 'https://placehold.co/400x300/111118/e94560?text=GA'}
                          alt="Incident evidence"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Sub Tabs */}
                      <div className="flex bg-dark-950/60 border border-white/5 p-1 rounded-xl shrink-0">
                        <button
                          onClick={() => setCaseSubTab('telemetry')}
                          className={`flex-1 py-1 text-[9px] font-bold rounded-lg transition-all ${
                            caseSubTab === 'telemetry'
                              ? 'bg-primary text-white'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Telemetry
                        </button>
                        <button
                          onClick={() => setCaseSubTab('vision')}
                          className={`flex-1 py-1 text-[9px] font-bold rounded-lg transition-all ${
                            caseSubTab === 'vision'
                              ? 'bg-primary text-white'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          AI Vision 2.0
                        </button>
                      </div>

                      {caseSubTab === 'telemetry' ? (
                        <div className="flex-1 min-w-0 space-y-3 text-[11px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <SeverityBadge severity={selectedCase.ai_severity as any} />
                            <span className="text-slate-500 font-mono">#{selectedCase.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                          
                          <div className="bg-dark-950/50 p-2.5 rounded-lg border border-white/5">
                            <p className="text-slate-300 leading-relaxed">
                              <strong>AI Summary:</strong> {selectedCase.ai_analysis}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-500 font-bold uppercase block">Reporting Address</span>
                            <p className="text-slate-400 truncate">{selectedCase.location.address}</p>
                          </div>

                          {/* Dynamic Action Buttons based on selectedCase status */}
                          <div className="flex gap-2 pt-1.5 shrink-0">
                            {selectedCase.status === 'reported' && (
                              <button
                                onClick={() => handleStatusUpdate(selectedCase.id, 'dispatched')}
                                className="w-full py-1.5 bg-primary hover:bg-red-600 text-white font-bold uppercase rounded text-[9px] tracking-wider"
                              >
                                Dispatch Rescue Unit
                              </button>
                            )}
                            {selectedCase.status === 'dispatched' && (
                              <button
                                onClick={() => handleStatusUpdate(selectedCase.id, 'rescued')}
                                className="w-full py-1.5 bg-green-500/20 border border-green-500/40 text-green-400 font-bold uppercase rounded text-[9px] tracking-wider"
                              >
                                Mark Rescued / Safe
                              </button>
                            )}
                            {selectedCase.status === 'rescued' && (
                              <button
                                onClick={() => handleStatusUpdate(selectedCase.id, 'closed')}
                                className="w-full py-1.5 bg-dark-800 border border-white/5 text-slate-400 font-bold uppercase rounded text-[9px] tracking-wider"
                              >
                                Close Case File
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0 space-y-3.5 overflow-y-auto max-h-[160px] pr-0.5 scrollbar text-[10px]">
                          {(() => {
                            const vision = getVisionData(selectedCase)
                            return (
                              <>
                                {/* Confidence Score Gauge */}
                                <div className="bg-dark-950/40 p-2 rounded-lg border border-white/5 flex items-center justify-between gap-2.5">
                                  <div>
                                    <h4 className="text-white font-bold text-[9px] uppercase tracking-wider">AI Accuracy Scan</h4>
                                    <span className="text-slate-550 text-[8px] block">Scene match status</span>
                                  </div>
                                  <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                      <circle cx="18" cy="18" r="15" fill="transparent" stroke="#e2e8f0" strokeWidth="2.5" />
                                      <circle cx="18" cy="18" r="15" fill="transparent" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="94.2" strokeDashoffset={`${94.2 * (1 - vision.confidence / 100)}`} />
                                    </svg>
                                    <span className="absolute text-white font-black text-[8px] font-mono">{vision.confidence}%</span>
                                  </div>
                                </div>

                                {/* Risk meter */}
                                <div className="bg-dark-950/40 p-2 rounded-lg border border-white/5 space-y-1">
                                  <span className="text-slate-500 uppercase font-bold text-[8px] block">Severity Matrix</span>
                                  <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-dark-900 p-0.5">
                                    <div className={`flex-1 rounded-full ${vision.severity === 'low' ? 'bg-green-500' : 'bg-dark-800'}`} />
                                    <div className={`flex-1 rounded-full ${vision.severity === 'medium' ? 'bg-yellow-500' : 'bg-dark-800'}`} />
                                    <div className={`flex-1 rounded-full ${vision.severity === 'high' ? 'bg-orange-500' : 'bg-dark-800'}`} />
                                    <div className={`flex-1 rounded-full ${vision.severity === 'critical' ? 'bg-red-500' : 'bg-dark-800'}`} />
                                  </div>
                                </div>

                                {/* Details */}
                                <div className="bg-dark-950/40 p-2 rounded-lg border border-white/5 grid grid-cols-2 gap-1 text-[9px]">
                                  <div>
                                    <span className="text-slate-500 uppercase font-bold block">Age / Gender</span>
                                    <span className="text-white font-semibold mt-0.5 block">{vision.age} / {vision.gender}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 uppercase font-bold block">Exposure</span>
                                    <span className="text-blue-400 font-semibold mt-0.5 block">{vision.weather_exposure} Exposure</span>
                                  </div>
                                </div>

                                {/* Injury Matrix */}
                                <div className="bg-dark-950/40 p-2 rounded-lg border border-white/5 space-y-1">
                                  <span className="text-slate-500 uppercase font-bold text-[8px] block">Injury Matrix</span>
                                  <div className="grid grid-cols-2 gap-1 text-[8px]">
                                    {[
                                      { name: 'Head Injury', prob: vision.injuries.includes('Head Injury') ? '92%' : '8%' },
                                      { name: 'Bleeding', prob: vision.blood_detected ? '88%' : '5%' },
                                      { name: 'Fracture', prob: vision.injuries.includes('Fracture') ? '85%' : '12%' },
                                      { name: 'Dehydration', prob: '94%' }
                                    ].map((inj) => (
                                      <div key={inj.name} className="bg-dark-900/50 p-1 rounded border border-white/5 flex justify-between">
                                        <span className="text-slate-450">{inj.name}</span>
                                        <span className={`font-bold ${parseFloat(inj.prob) > 50 ? 'text-red-400 font-extrabold' : 'text-slate-500'}`}>{inj.prob}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Object list */}
                                <div className="bg-dark-950/40 p-2 rounded-lg border border-white/5 space-y-1">
                                  <span className="text-slate-500 uppercase font-bold text-[8px] block">Detections</span>
                                  <div className="flex flex-wrap gap-1">
                                    {vision.objects_detected.map((obj: string) => (
                                      <span key={obj} className="text-[8px] bg-dark-900 px-1.5 py-0.5 rounded text-slate-350">
                                        {obj}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Image Scan Comparison */}
                                {selectedCase.evidence && selectedCase.evidence.length > 1 && (
                                  <div className="bg-primary/5 p-2 rounded-lg border border-primary/20 space-y-2">
                                    <span className="text-white font-bold text-[9px] uppercase tracking-wider block">Scan Comparison</span>
                                    <div className="grid grid-cols-2 gap-1">
                                      {selectedCase.evidence.map((img: any, idx: number) => (
                                        <div key={idx} className="relative rounded overflow-hidden h-9 bg-dark-900 border border-white/5">
                                          <img src={img.file_url} className="w-full h-full object-cover" />
                                        </div>
                                      ))}
                                    </div>
                                    <p className="text-slate-400 text-[8px] leading-relaxed italic">
                                      AI Scan: Posture shift delta synchronized.
                                    </p>
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-[10px] text-center">
                      Select an incident from the grid to view live status.
                    </div>
                  )}
                </div>

                {/* Alerts Feed */}
                <div className="h-44 card p-4 border border-white/10 flex flex-col overflow-hidden bg-dark-900/30 shrink-0">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-2 mb-2 flex items-center justify-between">
                    <span>Incident Activity Feed</span>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar text-[10px]">
                    {filteredCases.slice(0, 3).map((c, i) => (
                      <div key={i} className="flex gap-2 leading-relaxed border-b border-white/5 pb-1.5 last:border-0">
                        <span className="text-primary font-bold">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <p className="text-slate-400 truncate max-w-[140px] md:max-w-none">
                          <strong className="text-white">Alert:</strong> {c.ai_analysis}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : activeTab === 'Cases' || activeTab === 'My Reports' || activeTab === 'Welfare Cases' || activeTab === 'Patients' || activeTab === 'Missions' ? (
          /* TAB 2: Dynamic Incidents Registry Grid */
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-white font-bold text-sm tracking-wider uppercase">Active Emergency Incidents Directory</h2>
              <span className="text-slate-500 text-xs">{filteredCases.length} records active</span>
            </div>
            <div className="flex-1 overflow-auto bg-dark-900/40 border border-white/5 rounded-xl">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-white/10 bg-dark-950/80 text-white font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Case Registry ID</th>
                    <th className="p-4">Location address</th>
                    <th className="p-4">Severity Priority</th>
                    <th className="p-4">Incident Status</th>
                    <th className="p-4">Recommended Agency</th>
                    <th className="p-4">Creation timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-white font-bold">#{c.id.slice(0, 10).toUpperCase()}</td>
                      <td className="p-4 truncate max-w-xs">{c.location.address}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                          c.ai_severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {c.ai_severity}
                        </span>
                      </td>
                      <td className="p-4 capitalize">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          c.status === 'reported' ? 'bg-blue-500/20 text-blue-400' :
                          c.status === 'dispatched' ? 'bg-orange-500/20 text-orange-400 animate-pulse' :
                          'bg-green-500/20 text-green-400'
                        }`}>{c.status}</span>
                      </td>
                      <td className="p-4 font-bold text-primary">
                        {c.ai_severity === 'critical' ? '⚡ Police Command' : '🩺 Medical Triage'}
                      </td>
                      <td className="p-4 text-slate-500">{new Date(c.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'GIS Map' || activeTab === 'Map' || activeTab === 'My Map' ? (
          /* TAB 3: GIS Map */
          <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-white font-bold text-sm tracking-wider uppercase">Interactive GIS Telemetry Map</h2>
              <span className="text-slate-500 text-xs">Active search zones boundaries and dispatches routes</span>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 relative">
              <LiveMap
                cases={filteredCases}
                selectedCase={selectedCase}
                onCaseSelect={setSelectedCase}
                showHeatmap={showHeatmap}
                showTraffic={showTraffic}
                showSearchZones={showSearchZones}
                activeDispatches={activeDispatches}
              />
            </div>
          </div>
        ) : activeTab === 'Analytics' || activeTab === 'My Rewards' ? (
          /* TAB 4: Dynamic Analytics Views */
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
            <h2 className="text-white font-bold text-sm tracking-wider uppercase border-b border-white/5 pb-2">
              {config.chartTitle}
            </h2>
            
            {/* Analytics Header Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-5 border border-white/10 bg-dark-900/40">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Average Response Mobilize</p>
                <p className="text-3xl font-extrabold text-primary">3.2 Minutes</p>
                <p className="text-slate-450 text-[10px] mt-1">Goal target standard: under 5 minutes</p>
              </div>
              <div className="card p-5 border border-white/10 bg-dark-900/40">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Total Active Rescue Patrols</p>
                <p className="text-3xl font-extrabold text-blue-400">12 Units</p>
                <p className="text-slate-450 text-[10px] mt-1">Allocated across Chennai coordinate sectors</p>
              </div>
              <div className="card p-5 border border-white/10 bg-dark-900/40">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Rescue Safety Success Rate</p>
                <p className="text-3xl font-extrabold text-green-400">98.2 %</p>
                <p className="text-slate-450 text-[10px] mt-1">Secure reunification target met</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Dynamic SVG Bar Chart */}
              <div className="card p-5 border border-white/10 bg-dark-900/40 h-80 flex flex-col justify-between">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider">{config.chartTitle}</h3>
                
                {config.chartType === 'response' ? (
                  /* Response Time chart */
                  <div className="flex gap-3.5 items-end h-44 border-b border-white/10 pb-2.5">
                    {[15, 30, 45, 60, 20, 80, 45, 95, 35, 75].map((h, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="w-full bg-primary/20 border border-primary/50 rounded-t hover:bg-primary/40 transition-colors" style={{ height: `${h}%` }} />
                        <span className="text-[8px] text-slate-500 font-mono">P{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : config.chartType === 'beds' ? (
                  /* Bed occupancy chart */
                  <div className="flex gap-3.5 items-end h-44 border-b border-white/10 pb-2.5">
                    {[65, 70, 75, 80, 85, 90, 75, 70, 60, 58].map((h, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="w-full bg-blue-500/20 border border-blue-500/50 rounded-t hover:bg-blue-500/40 transition-colors" style={{ height: `${h}%` }} />
                        <span className="text-[8px] text-slate-500 font-mono">D{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : config.chartType === 'missions' ? (
                  /* Missions completed rewards list */
                  <div className="flex gap-3.5 items-end h-44 border-b border-white/10 pb-2.5">
                    {[10, 20, 35, 50, 60, 75, 85, 90, 110, 140].map((h, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="w-full bg-emerald-500/20 border border-emerald-500/50 rounded-t hover:bg-emerald-500/40 transition-colors" style={{ height: `${(h / 150) * 100}%` }} />
                        <span className="text-[8px] text-slate-500 font-mono">M{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* NGO supply stocks levels chart */
                  <div className="flex gap-3.5 items-end h-44 border-b border-white/10 pb-2.5">
                    {[90, 80, 75, 60, 45, 40, 85, 95, 100, 95].map((h, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="w-full bg-orange-500/20 border border-orange-500/50 rounded-t hover:bg-orange-500/40 transition-colors" style={{ height: `${h}%` }} />
                        <span className="text-[8px] text-slate-500 font-mono">S{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between text-[8px] text-slate-500 uppercase tracking-widest font-bold">
                  <span>Start Range</span>
                  <span>Mid Range</span>
                  <span>End target</span>
                </div>
              </div>

              {/* Dynamic Severity Breakdown List */}
              <div className="card p-5 border border-white/10 bg-dark-900/40 h-80 flex flex-col justify-between">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider">Severity Classification breakdown</h3>
                <div className="space-y-4 my-auto">
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                      <span>⚡ CRITICAL CASES STATUS</span>
                      <span>{cases.filter(c => c.ai_severity === 'critical').length} incidents</span>
                    </div>
                    <div className="h-1.5 w-full bg-dark-950 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${cases.length > 0 ? (cases.filter(c => c.ai_severity === 'critical').length / cases.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                      <span>🩺 HIGH RISK DISPATCHES</span>
                      <span>{cases.filter(c => c.ai_severity === 'high').length} incidents</span>
                    </div>
                    <div className="h-1.5 w-full bg-dark-950 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${cases.length > 0 ? (cases.filter(c => c.ai_severity === 'high').length / cases.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                      <span>🌾 MODERATE / SHELTER NEEDS</span>
                      <span>{cases.filter(c => c.ai_severity === 'moderate').length} incidents</span>
                    </div>
                    <div className="h-1.5 w-full bg-dark-950 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${cases.length > 0 ? (cases.filter(c => c.ai_severity === 'moderate').length / cases.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : activeTab === 'Reports' || activeTab === 'Reunification Logs' || activeTab === 'Audit Log' ? (
          /* TAB 5: Downloadable Reports */
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-white font-bold text-sm tracking-wider uppercase">Downloadable Case Records Summary</h2>
              <span className="text-slate-500 text-xs">PDF formats available</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar">
              {filteredCases.map((c, i) => (
                <div key={i} className="card p-5 border border-white/10 bg-dark-900/40 flex justify-between items-center hover:border-white/20 transition-all">
                  <div className="flex flex-col gap-1 min-w-0 flex-1 mr-4">
                    <p className="text-white font-bold text-xs">AI Case File Summary: Case #{c.id.slice(0, 10).toUpperCase()}</p>
                    <p className="text-slate-400 text-xs truncate leading-relaxed">{c.ai_analysis}</p>
                    <p className="text-slate-500 text-[10px]">Registry Date: {new Date(c.created_at).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => handleDownloadPDF(c.id)}
                    className="px-3.5 py-1.5 border border-white/10 hover:border-white/20 text-slate-355 hover:text-white rounded-lg text-xs transition-colors flex-shrink-0"
                  >
                    Download PDF Summary
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'User Database' ? (
          /* TAB 6: User Manager Database (Admin Only) */
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-white font-bold text-sm tracking-wider uppercase">Enterprise Users registry</h2>
              <span className="text-slate-500 text-xs">{mockUsers.length} accounts configured</span>
            </div>
            <div className="flex-1 overflow-auto bg-dark-900/40 border border-white/5 rounded-xl">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-white/10 bg-dark-950/80 text-white font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">User Name</th>
                    <th className="p-4">Email ID</th>
                    <th className="p-4">Operational Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Change Role Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold text-white">{u.name}</td>
                      <td className="p-4 text-slate-400">{u.email}</td>
                      <td className="p-4 uppercase font-bold text-primary">{u.role}</td>
                      <td className="p-4 text-emerald-400 font-semibold">{u.status}</td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
                          className="bg-dark-800 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                        >
                          <option value="citizen">Citizen</option>
                          <option value="police">Police</option>
                          <option value="hospital">Hospital</option>
                          <option value="volunteer">Volunteer</option>
                          <option value="ngo">NGO</option>
                          <option value="child_welfare">Child Welfare</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'System Health' ? (
          /* TAB 7: System Health status monitor (Admin Only) */
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
            <h2 className="text-white font-bold text-sm tracking-wider uppercase border-b border-white/5 pb-2">
              System health status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Server connection statuses */}
              <div className="card p-5 border border-white/10 bg-dark-900/40 space-y-4">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-primary" />
                  API Gateways & Databases
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Supabase Database Connectivity:</span>
                    <span className="text-emerald-400 font-bold">{systemHealthMetrics.supabaseStatus} ({systemHealthMetrics.supabaseLatency})</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Node API Express Server Status:</span>
                    <span className="text-emerald-400 font-bold">{systemHealthMetrics.apiStatus}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Gemini LLM Cognitive Endpoint:</span>
                    <span className="text-emerald-400 font-bold">{systemHealthMetrics.geminiStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active AI model Version:</span>
                    <span className="text-white font-mono">{systemHealthMetrics.geminiModel}</span>
                  </div>
                </div>
              </div>

              {/* Service Config variables */}
              <div className="card p-5 border border-white/10 bg-dark-900/40 space-y-4">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-blue-400" />
                  Environmental config variables
                </h3>
                <div className="space-y-3 text-[11px] font-mono text-slate-400">
                  <p className="bg-dark-950 p-2.5 rounded border border-white/5 text-slate-300">VITE_SUPABASE_URL = "https://eexvsk...supabase.co"</p>
                  <p className="bg-dark-950 p-2.5 rounded border border-white/5 text-slate-300">VITE_API_URL = "http://localhost:5000"</p>
                  <p className="bg-dark-950 p-2.5 rounded border border-white/5 text-slate-300">NODE_ENV = "development"</p>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* Dispatch logs Tab view for dispatching roles */
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-white font-bold text-sm tracking-wider uppercase">Active Dispatch Telemetry Logs</h2>
              <span className="text-slate-500 text-xs">Verify active response vehicles</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
              {/* Column A: Police units */}
              <div className="card p-5 border border-white/10 flex flex-col overflow-hidden bg-dark-900/30">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-2 mb-3 flex items-center justify-between">
                  <span>🚨 Police Patrol Vehicles</span>
                  <span className="text-[10px] text-red-400 font-bold">Active</span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar">
                  {filteredCases.map((c, i) => (
                    <div key={i} className="bg-dark-950/60 p-3.5 rounded-xl border border-white/5 flex flex-col gap-1.5 text-xs text-slate-300">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Patrol Car Unit #{10 + i}</span>
                        <span className="text-green-400 text-[10px] uppercase font-bold">Dispatched</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Assigned Case ID: <span className="font-mono text-white">#{c.id.slice(0, 8).toUpperCase()}</span></p>
                      <p className="text-[11px] text-slate-400 truncate">Destination: {c.location.address}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column B: Hospital units */}
              <div className="card p-5 border border-white/10 flex flex-col overflow-hidden bg-dark-900/30">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-2 mb-3 flex items-center justify-between">
                  <span>🚑 Hospital Ambulances</span>
                  <span className="text-[10px] text-blue-400 font-bold">Active</span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar">
                  {filteredCases.filter(c => c.ai_severity !== 'critical').map((c, i) => (
                    <div key={i} className="bg-dark-950/60 p-3.5 rounded-xl border border-white/5 flex flex-col gap-1.5 text-xs text-slate-300">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Ambulance Unit #{3 + i}</span>
                        <span className="text-green-400 text-[10px] uppercase font-bold">Dispatched</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Assigned Case ID: <span className="font-mono text-white">#{c.id.slice(0, 8).toUpperCase()}</span></p>
                      <p className="text-[11px] text-slate-400 truncate">Destination: {c.location.address}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column C: NGO units */}
              <div className="card p-5 border border-white/10 flex flex-col overflow-hidden bg-dark-900/30">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-2 mb-3 flex items-center justify-between">
                  <span>🌾 NGO Relief Teams</span>
                  <span className="text-[10px] text-orange-400 font-bold">Active</span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar">
                  {filteredCases.filter(c => c.ai_severity === 'critical').map((c, i) => (
                    <div key={i} className="bg-dark-950/60 p-3.5 rounded-xl border border-white/5 flex flex-col gap-1.5 text-xs text-slate-300">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Volunteer Team #{5 + i}</span>
                        <span className="text-green-400 text-[10px] uppercase font-bold">Dispatched</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Assigned Case ID: <span className="font-mono text-white">#{c.id.slice(0, 8).toUpperCase()}</span></p>
                      <p className="text-[11px] text-slate-400 truncate">Destination: {c.location.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
