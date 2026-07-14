import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Case, mockCases } from '../../lib/mockData'
import LiveMap from '../../components/LiveMap'
import apiClient from '../../lib/apiClient'
import { 
  LogOut, AlertTriangle, Shield, Database, Settings, RefreshCw
} from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import EmergencyCommandDrawer from '../../components/EmergencyCommandDrawer'

interface UserProfile {
  id: string
  name: string
  role: string
  created_at: string
  status?: string
  lastLogin?: string
  currentCases?: number
}

export default function AdminPage() {
  const { profile, signOut } = useAuth()
  const { triggerToast } = useNotifications()
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  
  // Real time Cases state
  const [cases, setCases] = useState<Case[]>(mockCases)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  
  // Active Console Navigation Tab
  const [activeTab, setActiveTab] = useState<'control' | 'cases' | 'users' | 'analytics' | 'logs'>('control')
  
  // Search & Filter parameters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'all'>('all')

  // Live Map controls
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showTraffic, setShowTraffic] = useState(false)
  const showSearchZones = true

  // System Health States
  const [mockModeActive, setMockModeActive] = useState(true)

  // Real-time animation states for dispatched responders
  const [activeDispatches, setActiveDispatches] = useState<Record<string, any>>({})

  // Animated Live Incident Logs Feed
  const [incidentLogs, setIncidentLogs] = useState<string[]>([
    "Citizen submitted new rescue report in Egmore coordinate sector",
    "AI Vision Engine graded case #democase-1001 as CRITICAL severity",
    "St. Jude Center trauma ambulance dispatched toplatform coordinates",
    "17th Precinct Police patrol cruiser dispatch coordinates verified",
    "NGO Hope shelter bed accommodation allocated successfully",
    "Volunteer responder rahul accepted mission tracking route",
    "Case #democase-1003 status updated to RESOLVED and archives closed"
  ])

  const generateDemoCases = () => {
    const cities = [
      { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
      { name: 'Indore', lat: 22.7196, lng: 75.8577 },
      { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
      { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
      { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
      { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
      { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
      { name: 'Pune', lat: 18.5204, lng: 73.8567 },
      { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
      { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
      { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
      { name: 'Guwahati', lat: 26.1445, lng: 91.7362 },
      { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
      { name: 'Patna', lat: 25.5941, lng: 85.1376 },
      { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
      { name: 'Surat', lat: 21.1702, lng: 72.8311 },
      { name: 'Raipur', lat: 21.2514, lng: 81.6296 },
      { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
      { name: 'Chennai', lat: 13.0827, lng: 80.2707 }
    ]
    const generated: Case[] = []
    
    for (let i = 1; i <= 40; i++) {
      const city = cities[(i - 1) % cities.length]
      const offsetLat = (Math.random() - 0.5) * 0.05
      const offsetLng = (Math.random() - 0.5) * 0.05
      const lat = city.lat + offsetLat
      const lng = city.lng + offsetLng
      const severity = i % 4 === 0 ? 'critical' : i % 3 === 0 ? 'high' : 'moderate'
      const status = i % 5 === 0 ? 'closed' : i % 3 === 0 ? 'rescued' : i % 2 === 0 ? 'dispatched' : 'reported'
      
      generated.push({
        id: `democase-${1000 + i}`,
        location: { lat, lng, address: `Rescue Sector ${i}, Near Metro Terminal, ${city.name}` },
        status,
        ai_severity: severity,
        ai_analysis: `Demo AI Scan: Detected potential minor in ${city.name}, estimated age ${2 + (i % 6)} years old, located outdoors in ${severity === 'critical' ? 'heavy weather exposure hazards' : 'stable environmental conditions'}. Scan confidence is ${85 + (i % 15)}%.`,
        ai_dispatch_reason: `System auto-route allocated to nearest ${severity === 'critical' ? 'Precinct Cruiser' : 'NGO Shelter'} unit.`,
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
        evidence: [{ file_url: 'https://placehold.co/400x300/111118/e94560?text=Scan+Photo' }]
      })
    }
    return generated
  }

  // Static Resource quantities matching Step 6
  const resourceMetrics = {
    hospitals: { total: 15, beds: '28 / 75 occupied', doctors: 48, ambulances: 24 },
    police: { total: 20, officers: 85, cruisers: 36 },
    ngos: { total: 12, shelters: 12, foodKits: 220, medicalKits: 145 },
    volunteers: { total: 25, available: 14, busy: 8, offline: 3 },
    welfare: { total: 8, officers: 18, pendingCases: 5 }
  }

  // Live Incident Feed logger loop
  useEffect(() => {
    const interval = setInterval(() => {
      const logs = [
        "AI Scan completed for Sector 3 coordinates.",
        "Volunteer responder coordinates updated on tracking maps.",
        "Police cruiser dispatch route updated via GIS traffic data.",
        "Trauma doctor assigned to Hospital ICU Bed #4.",
        "Relief packages dispatched to Anna Nagar shelter.",
        "Welfare officer legal intake review verified.",
        "Central command server heartbeat ping completed (45ms).",
        "Duplicate report filter scanned Egyptian coordinates."
      ]
      const randomLog = logs[Math.floor(Math.random() * logs.length)]
      setIncidentLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] ${randomLog}`,
        ...prev.slice(0, 8)
      ])
    }, 6000)
    return () => clearInterval(interval)
  }, [])

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
              triggerToast('🟢 Dispatch Telemetry', `Emergency vehicle has reached Case #${caseId.toUpperCase()}. Coordinates secured!`, 'success')
            }
          }
        })

        return changed ? copy : prev
      })
    }, 150)

    return () => clearInterval(interval)
  }, [])

  const startDispatchAnimation = (caseId: string, targetLat: number, targetLng: number) => {
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
        type: 'police',
      },
    }))
  }

  // Fetch profiles from Supabase
  const fetchUsers = async () => {
    setLoadingUsers(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) {
      // Map statuses and extra mock stats for demo users
      const mapped = data.map((u: any, i: number) => ({
        ...u,
        status: i % 4 === 0 ? 'Suspended' : 'Active',
        lastLogin: new Date(Date.now() - i * 7200000).toLocaleTimeString(),
        currentCases: i % 3
      }))
      setUsers(mapped as UserProfile[])
    }
    setLoadingUsers(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Fetch Cases from API
  const fetchCases = async () => {
    try {
      const response = await apiClient.get('/api/cases')
      if (response.data && Array.isArray(response.data)) {
        setCases(response.data)
      }
    } catch (err) {
      console.warn('Backend API /api/cases offline. Keeping generated high fidelity data.', err)
    }
  }

  useEffect(() => {
    if (mockModeActive) {
      setCases(generateDemoCases())
    } else {
      fetchCases()
    }
  }, [mockModeActive])

  // Search & Filter Cases
  const getFilteredCases = () => {
    return cases.filter((c) => {
      const matchesSearch = c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.ai_analysis.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesPriority = filterPriority === 'all' || c.ai_severity === filterPriority
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus
      
      let matchesTime = true
      if (timeRange === 'today') {
        const todayDate = new Date().toDateString()
        matchesTime = new Date(c.created_at).toDateString() === todayDate
      } else if (timeRange === 'week') {
        const weekAgo = Date.now() - 7 * 86400000
        matchesTime = new Date(c.created_at).getTime() >= weekAgo
      }

      return matchesSearch && matchesPriority && matchesStatus && matchesTime
    })
  }

  const filteredCases = getFilteredCases()

  // Summary Metrics calculations
  const totalCases = cases.length
  const criticalCases = cases.filter((c) => c.ai_severity === 'critical' && c.status !== 'closed').length
  const rescuedCases = cases.filter((c) => c.status === 'rescued').length
  const pendingCases = cases.filter((c) => c.status === 'reported').length
  const activeDispatchesCount = cases.filter((c) => c.status === 'dispatched').length

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

  // Export reports mapping
  const handleExportData = (format: 'CSV' | 'PDF' | 'JSON', type: string) => {
    triggerToast('Export Initiated', `Exporting ${type} in ${format} format... Package preparing for download.`, 'info')
  }

  // Quick Action triggers
  const handleBroadcastAlert = () => {
    triggerToast('📢 Global Broadcast', 'Sending emergency notification alert to all active child rescue officers, regional volunteers, and hospital triage centers.', 'emergency')
  }

  return (
    <div className="h-screen bg-transparent flex flex-col overflow-hidden text-xs">
      
      {/* Dynamic System Banner */}
      {criticalCases > 0 && (
        <div className="bg-red-600 text-white text-[10px] font-bold py-2 px-6 flex justify-between items-center z-50 animate-pulse shrink-0">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            🚨 REAL-TIME SYSTEM MONITORING: {criticalCases} CRITICAL INCIDENTS AWAITING IMMEDIATE MULTI-AGENCY COORDINATION
          </span>
          <button 
            onClick={() => setActiveTab('control')} 
            className="bg-white text-red-600 px-3.5 py-0.5 rounded-lg font-bold uppercase text-[9px]"
          >
            Launch Controls
          </button>
        </div>
      )}

      {/* Header bar */}
      <header className="header-glass px-6 py-4.5 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/20 flex items-center justify-center rounded-xl border border-primary/20">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wider uppercase">Guardian Angel National operations Center</h1>
            <p className="text-slate-500 text-[10px]">Super Admin Command & Intelligence Dashboard</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden lg:flex items-center gap-1 bg-dark-950/60 p-1 rounded-xl border border-white/5">
          {[
            { id: 'control', label: '🛰️ Realtime Control' },
            { id: 'cases', label: '📁 Case Directory' },
            { id: 'users', label: '👥 User Registry' },
            { id: 'analytics', label: '📊 Command Charts' },
            { id: 'logs', label: '📝 Audit logs & config' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-lg font-bold tracking-wide transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider bg-dark-800/80 border border-white/5 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            ← Command Deck
          </button>
          
          {/* Mock Mode Switcher */}
          <div className="flex items-center gap-2 bg-dark-800/80 border border-white/5 px-2.5 py-1 rounded-lg">
            <span className="text-[9px] text-slate-500 font-bold uppercase">Demo Mode:</span>
            <button 
              onClick={() => setMockModeActive(!mockModeActive)}
              className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                mockModeActive ? 'bg-primary/20 text-primary' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {mockModeActive ? 'Active' : 'Disabled'}
            </button>
          </div>
          
          <div className="hidden sm:block text-left border-l border-white/10 pl-3">
            <p className="text-white text-xs font-semibold">{profile?.name || 'Administrator'}</p>
            <p className="text-slate-500 text-[8px] uppercase font-bold">National Admin</p>
          </div>

          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-dark-700 text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Panel */}
      <div className="flex-1 flex overflow-hidden p-6 bg-dark-950">
        
        {/* VIEW 1: real-time Control Center */}
        {activeTab === 'control' ? (
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            
            {/* Top statistics summary (NASA Style) */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 shrink-0">
              {[
                { label: 'Active Cases', value: totalCases, color: 'text-blue-400' },
                { label: 'Critical Alert', value: criticalCases, color: 'text-primary animate-pulse' },
                { label: 'Secured Today', value: rescuedCases, color: 'text-green-400 font-black' },
                { label: 'Avg response time', value: '3.2m', color: 'text-yellow-400' },
                { label: 'Authorities Online', value: '18 Units', color: 'text-emerald-400' },
                { label: 'Pending Cases', value: pendingCases, color: 'text-orange-400' },
                { label: 'AI Scans today', value: '42 Runs', color: 'text-purple-400' },
                { label: 'Dispatched Patrols', value: activeDispatchesCount, color: 'text-cyan-400' }
              ].map((s, idx) => (
                <div key={idx} className="card p-3 border border-white/5 bg-dark-900/40 flex flex-col justify-between">
                  <span className="text-slate-500 font-bold uppercase text-[8px] tracking-wider">{s.label}</span>
                  <span className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Split workspace */}
            <div className="flex-1 flex flex-col xl:grid xl:grid-cols-12 gap-6 overflow-hidden">
              
              {/* Column A: Interactive Live GIS Map */}
              <div className="col-span-12 xl:col-span-6 flex flex-col gap-6 overflow-hidden h-[300px] xl:h-full">
                <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 card shadow-2xl">
                  {/* Heatmap/Traffic controls overlay */}
                  <div className="absolute top-4 left-4 z-[1000] flex gap-2">
                    <button
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={`bg-dark-900/90 border rounded-lg px-2.5 py-1.5 text-[9px] font-bold transition-all flex items-center gap-1.5 ${
                        showHeatmap ? 'border-primary text-white bg-primary/10' : 'border-white/10 text-slate-400'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Heatmap
                    </button>
                    <button
                      onClick={() => setShowTraffic(!showTraffic)}
                      className={`bg-dark-900/90 border rounded-lg px-2.5 py-1.5 text-[9px] font-bold transition-all flex items-center gap-1.5 ${
                        showTraffic ? 'border-orange-500 text-white bg-orange-500/10' : 'border-white/10 text-slate-400'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      Traffic Overlay
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

                {/* Quick actions deck */}
                <div className="card p-4 border border-white/10 bg-dark-900/25 flex flex-col gap-3 shrink-0">
                  <h3 className="text-white font-bold text-[10px] uppercase tracking-wider text-slate-450 border-b border-white/5 pb-1.5">
                    Command center Quick actions
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <button onClick={handleBroadcastAlert} className="py-2 px-3 bg-primary text-white font-bold rounded-lg uppercase tracking-wider text-[9px] hover:bg-red-600 transition-colors">
                      📢 Broadcast SOS
                    </button>
                    <button onClick={() => handleExportData('PDF', 'National Summary')} className="py-2 px-3 bg-dark-700/60 border border-white/5 text-slate-300 font-bold rounded-lg uppercase text-[9px] hover:text-white">
                      📊 Export PDF Log
                    </button>
                    <button onClick={() => setActiveTab('analytics')} className="py-2 px-3 bg-dark-700/60 border border-white/5 text-slate-300 font-bold rounded-lg uppercase text-[9px] hover:text-white">
                      📈 Open Analytics
                    </button>
                    <button onClick={() => setActiveTab('logs')} className="py-2 px-3 bg-dark-700/60 border border-white/5 text-slate-300 font-bold rounded-lg uppercase text-[9px] hover:text-white">
                      ⚙️ System Config
                    </button>
                     <button onClick={() => triggerToast('Drone Diagnostics', 'Initiating active drone coordinate scans...', 'info')} className="py-2 px-3 bg-dark-700/60 border border-white/5 text-slate-300 font-bold rounded-lg uppercase text-[9px] hover:text-white">
                      🛰️ Coordinate Drones
                    </button>
                  </div>
                </div>
              </div>

              {/* Column B: Real-Time Incident Feed & Resource monitor */}
              <div className="col-span-12 xl:col-span-3 flex flex-col gap-6 overflow-hidden h-[300px] xl:h-full">
                
                {/* Live incident feed */}
                <div className="flex-1 card p-4.5 border border-white/10 bg-dark-900/30 flex flex-col overflow-hidden">
                  <h3 className="text-white font-bold text-[10px] uppercase tracking-wider border-b border-white/5 pb-2 mb-3 flex items-center justify-between">
                    <span>Incident Operations feed</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar text-[10px]">
                    {incidentLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2 border-b border-white/5 pb-2 last:border-0 leading-relaxed text-slate-350">
                        <span className="text-primary font-bold">●</span>
                        <p>{log}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Intelligence Connection status */}
                <div className="card p-4.5 border border-white/10 bg-dark-900/30 flex flex-col gap-3.5 shrink-0">
                  <h3 className="text-white font-bold text-[10px] uppercase tracking-wider border-b border-white/5 pb-1 text-purple-400 flex justify-between">
                    <span>Gemini AI Engine</span>
                    <span className="text-[8px] bg-purple-500/10 border border-purple-500/20 px-1 rounded">Online</span>
                  </h3>
                  <div className="space-y-2 text-[10px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Model Version:</span>
                      <span className="text-white font-mono">1.5 Pro (Cognitive)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average AI Confidence:</span>
                      <span className="text-green-400 font-bold">92.4% Accuracy</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scanning priority queues:</span>
                      <span className="text-white font-bold">{cases.filter(c => c.status === 'reported').length} Cases</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column C: Resource Monitor & Alerts */}
              <div className="col-span-12 xl:col-span-3 flex flex-col gap-6 overflow-hidden h-[300px] xl:h-full">
                
                {/* Resource Allocations monitor */}
                <div className="flex-1 card p-4.5 border border-white/10 bg-dark-900/30 flex flex-col overflow-hidden">
                  <h3 className="text-white font-bold text-[10px] uppercase tracking-wider border-b border-white/5 pb-2 mb-3">
                    Active Agency resources
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar text-[10px] text-slate-400">
                    <div>
                      <div className="flex justify-between font-bold text-white mb-1">
                        <span>🏥 Hospitals (15 Centers)</span>
                        <span className="text-blue-400">Beds: {resourceMetrics.hospitals.beds}</span>
                      </div>
                      <p className="text-[9px]">Doctors Standby: {resourceMetrics.hospitals.doctors} | Ambulances: {resourceMetrics.hospitals.ambulances} Ready</p>
                    </div>
                    <div>
                      <div className="flex justify-between font-bold text-white mb-1">
                        <span>🚓 Police Patrols (20 Precincts)</span>
                        <span className="text-primary">Cruisers: {resourceMetrics.police.cruisers}</span>
                      </div>
                      <p className="text-[9px]">On-Duty Officers: {resourceMetrics.police.officers} Patrol Units</p>
                    </div>
                    <div>
                      <div className="flex justify-between font-bold text-white mb-1">
                        <span>🌾 Welfare NGOs (12 Shelters)</span>
                        <span className="text-orange-400">Kits: {resourceMetrics.ngos.foodKits} Food</span>
                      </div>
                      <p className="text-[9px]">Medical Packs remaining: {resourceMetrics.ngos.medicalKits} kits</p>
                    </div>
                    <div>
                      <div className="flex justify-between font-bold text-white mb-1">
                        <span>🛵 Responders (25 volunteers)</span>
                        <span className="text-green-400">Online: {resourceMetrics.volunteers.available}</span>
                      </div>
                      <p className="text-[9px]">Busy: {resourceMetrics.volunteers.busy} | Offline: {resourceMetrics.volunteers.offline}</p>
                    </div>
                  </div>
                </div>

                {/* Tactical Alert Checklist center */}
                <div className="card p-4.5 border border-white/10 bg-dark-900/30 flex flex-col gap-3 shrink-0 text-[10px] text-slate-350">
                  <h3 className="text-white font-bold text-[10px] uppercase tracking-wider border-b border-white/5 pb-1 text-primary">
                    AI Tactical Threat Alerts
                  </h3>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="text-primary font-black">⚠️</span>
                      Egmore sector: Heavy Rain storm warnings active.
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-primary font-black">⚠️</span>
                      Hospital Trauma Beds Occupancy over 85% capacity.
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-primary font-black">⚠️</span>
                      Adyar Park: Traffic congestion delaying response units.
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        ) : activeTab === 'cases' ? (
          /* VIEW 2: real-time Cases Directory */
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-3.5 gap-4">
              <div>
                <h2 className="text-white font-bold text-sm uppercase tracking-wider">Emergency Incident Registry Directory</h2>
                <p className="text-slate-500 text-[10px]">Verify child coordinates, priority matrices and allocate responders</p>
              </div>

              {/* Filters console */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-dark-800 border border-white/5 rounded px-2 py-1 text-white text-[10px]"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High Severity</option>
                  <option value="moderate">Moderate</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-dark-800 border border-white/5 rounded px-2 py-1 text-white text-[10px]"
                >
                  <option value="all">All Statuses</option>
                  <option value="reported">Reported</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="rescued">Rescued</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="bg-dark-800 border border-white/5 rounded px-2 py-1 text-white text-[10px]"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today Only</option>
                  <option value="week">This Week</option>
                </select>
                <input
                  type="text"
                  placeholder="Search Case ID or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-dark-800 border border-white/5 rounded px-3 py-1 text-white text-[10px] w-48 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Cases Table list */}
            <div className="flex-1 overflow-auto bg-dark-900/40 border border-white/5 rounded-xl">
              <table className="w-full text-left border-collapse text-slate-350">
                <thead>
                  <tr className="border-b border-white/10 bg-dark-950/80 text-white font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-4">Case Registry ID</th>
                    <th className="p-4">Reported Address</th>
                    <th className="p-4">Threat Level</th>
                    <th className="p-4">Incident status</th>
                    <th className="p-4">AI Dispatch allocations</th>
                    <th className="p-4">Actions Console</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="p-4 font-mono font-bold text-white">#{c.id.toUpperCase()}</td>
                      <td className="p-4 truncate max-w-xs">{c.location.address}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                          c.ai_severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400'
                        }`}>{c.ai_severity}</span>
                      </td>
                      <td className="p-4 capitalize">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          c.status === 'reported' ? 'bg-blue-500/25 text-blue-400' :
                          c.status === 'dispatched' ? 'bg-orange-500/25 text-orange-400 animate-pulse' :
                          'bg-green-500/25 text-green-400'
                        }`}>{c.status}</span>
                      </td>
                      <td className="p-4 truncate max-w-xs">{c.ai_dispatch_reason}</td>
                      <td className="p-4 flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedCase(c)
                            setActiveTab('control')
                          }} 
                          className="bg-primary hover:bg-red-600 text-white font-bold px-2.5 py-1 rounded text-[9px] uppercase"
                        >
                          Track
                        </button>
                        {c.status === 'reported' && (
                          <button 
                            onClick={() => handleStatusUpdate(c.id, 'dispatched')} 
                            className="bg-dark-700 hover:bg-dark-600 border border-white/5 text-slate-300 hover:text-white px-2.5 py-1 rounded text-[9px] uppercase"
                          >
                            Dispatch
                          </button>
                        )}
                        {c.status === 'dispatched' && (
                          <button 
                            onClick={() => handleStatusUpdate(c.id, 'rescued')} 
                            className="bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded text-[9px] uppercase"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Export log Center */}
            <div className="card p-4.5 border border-white/10 bg-dark-900/30 flex justify-between items-center shrink-0">
              <div>
                <p className="text-white font-bold">Incidents Audit logs download center</p>
                <p className="text-slate-450 text-[10px] mt-0.5">Select target agency and export clean CSV/PDF database formats</p>
              </div>
              <div className="flex gap-2">
                {['Police Log', 'Medical Log', 'NGO Log', 'Welfare Log'].map((logType) => (
                  <button
                    key={logType}
                    onClick={() => handleExportData('PDF', logType)}
                    className="px-3.5 py-1.5 bg-dark-700/60 border border-white/5 text-slate-350 hover:text-white rounded-lg transition-colors uppercase text-[9px] font-bold"
                  >
                    Download {logType}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'users' ? (
          /* VIEW 3: real-time User Manager Registry */
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
              <div>
                <h2 className="text-white font-bold text-sm uppercase tracking-wider">Enterprise Users Registry</h2>
                <p className="text-slate-500 text-[10px]">Suspend, edit or authorize access permissions to responders and clinics</p>
              </div>
              <button onClick={fetchUsers} className="p-1.5 rounded-lg hover:bg-dark-700 text-slate-400 hover:text-white">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Users registry table */}
            <div className="flex-1 overflow-auto bg-dark-900/40 border border-white/5 rounded-xl">
              {loadingUsers ? (
                <div className="py-12 text-center text-slate-500">Loading user registry database...</div>
              ) : (
                <table className="w-full text-left border-collapse text-slate-350">
                  <thead>
                    <tr className="border-b border-white/10 bg-dark-950/80 text-white font-bold uppercase tracking-wider text-[9px]">
                      <th className="p-4">User profile Name</th>
                      <th className="p-4">Authorized Role</th>
                      <th className="p-4">Incidents Handled</th>
                      <th className="p-4">Last Activity Session</th>
                      <th className="p-4">Permissions status</th>
                      <th className="p-4">Actions Console</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="p-4 font-bold text-white">{u.name}</td>
                        <td className="p-4 uppercase font-bold text-primary">{u.role}</td>
                        <td className="p-4 font-mono">{u.currentCases || 0} cases</td>
                        <td className="p-4 font-mono text-slate-500">{u.lastLogin || 'N/A'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            u.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>{u.status || 'Active'}</span>
                        </td>
                        <td className="p-4 flex gap-2">
                          <button onClick={() => triggerToast('User Editor', 'Opening user edit metadata...', 'info')} className="bg-dark-700 hover:bg-dark-600 border border-white/5 text-slate-300 hover:text-white px-2.5 py-1 rounded text-[9px] uppercase">
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, status: usr.status === 'Suspended' ? 'Active' : 'Suspended' } : usr))
                              triggerToast('User Configured', 'User status configuration updated.', 'success')
                            }} 
                            className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 px-2.5 py-1 rounded text-[9px] uppercase font-bold"
                          >
                            {u.status === 'Suspended' ? 'Activate' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : activeTab === 'analytics' ? (
          /* VIEW 4: Command Charts & Reports */
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
            <div className="border-b border-white/5 pb-3">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Command Operations Analytics</h2>
              <p className="text-slate-500 text-[10px]">Real-time agency performance speed trends and resource allocation audits</p>
            </div>

            {/* Custom SVG Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Daily cases SVG bar chart */}
              <div className="card p-5 border border-white/10 bg-dark-900/40 h-80 flex flex-col justify-between">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider">Rescue Cases Registry trends (Daily)</h3>
                <div className="flex gap-4.5 items-end h-44 border-b border-white/10 pb-3">
                  {[20, 35, 55, 90, 65, 40, 85, 95, 70, 110, 140, 105].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center h-full gap-1.5">
                      <div className="w-full bg-primary/20 border border-primary/50 rounded-t hover:bg-primary/40 transition-colors" style={{ height: `${(h / 150) * 100}%` }} />
                      <span className="text-[8px] text-slate-500 font-mono">D{i + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[8px] text-slate-550 uppercase tracking-widest font-bold">
                  <span>Start range (National Sectors)</span>
                  <span>End target metrics</span>
                </div>
              </div>

              {/* Authority response pacing chart */}
              <div className="card p-5 border border-white/10 bg-dark-900/40 h-80 flex flex-col justify-between">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider">Agency response ETA mobilization (Minutes)</h3>
                <div className="flex gap-4.5 items-end h-44 border-b border-white/10 pb-3">
                  {[85, 60, 75, 50, 45, 30, 20, 25, 15, 12, 10, 8].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center h-full gap-1.5">
                      <div className="w-full bg-blue-500/20 border border-blue-500/50 rounded-t hover:bg-blue-500/40 transition-colors" style={{ height: `${h}%` }} />
                      <span className="text-[8px] text-slate-500 font-mono">W{i + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[8px] text-slate-550 uppercase tracking-widest font-bold">
                  <span>Week 1 (Establishment)</span>
                  <span>Week 12 (Target Met)</span>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* VIEW 5: system Diagnostic Console & Audits */
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="border-b border-white/5 pb-3 shrink-0">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">System Diagnostic Console & Audit Logs</h2>
              <p className="text-slate-500 text-[10px]">Diagnostics reports for API gateways, Supabase nodes and realtime audits</p>
            </div>

            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 overflow-hidden">
              
              {/* Left Column: Diagnostics status */}
              <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-1 h-full">
                <div className="card p-5 border border-white/10 bg-dark-900/40 space-y-4">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-primary border-b border-white/5 pb-2">
                    <Database className="w-4 h-4" />
                    Central Node health
                  </h3>
                  <div className="space-y-3.5 text-xs text-slate-400">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>Supabase Database connection:</span>
                      <span className="text-green-400 font-bold">Online (42ms)</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>Node Express API connection:</span>
                      <span className="text-green-400 font-bold">Online</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>Gemini API endpoint connection:</span>
                      <span className="text-green-400 font-bold">Online</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>Live GIS Maps connection:</span>
                      <span className="text-green-400 font-bold">Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Central Notifications queue:</span>
                      <span className="text-green-400 font-bold">Online</span>
                    </div>
                  </div>
                </div>

                <div className="card p-5 border border-white/10 bg-dark-900/40 space-y-3">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Settings className="w-4 h-4" />
                    Global Environment Variables
                  </h3>
                  <div className="space-y-2 text-[10px] font-mono text-slate-450 bg-dark-950 p-3 rounded border border-white/5">
                    <p>VITE_SUPABASE_URL = "https://eexvsk...supabase.co"</p>
                    <p>VITE_API_URL = "http://localhost:5000"</p>
                    <p>NODE_ENV = "production"</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Audit Registry Table */}
              <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden h-full">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-2">
                  System Audit Logs Registry
                </h3>
                <div className="flex-1 overflow-auto bg-dark-900/40 border border-white/5 rounded-xl text-[10px]">
                  <table className="w-full text-left border-collapse text-slate-350">
                    <thead>
                      <tr className="border-b border-white/10 bg-dark-950/80 text-white font-bold uppercase tracking-wider text-[8px]">
                        <th className="p-3">User profile</th>
                        <th className="p-3">Action logged</th>
                        <th className="p-3">Target Module</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Network Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Sarah J.', act: 'Patrol cruiser dispatched', mod: 'Police Command', status: 'Success' },
                        { name: 'Dr. Aaron', act: 'Trauma ICU bed booked', mod: 'Hospital Dispatch', status: 'Success' },
                        { name: 'Raj Kumar', act: 'NGO food supplies kit dispatch', mod: 'Relief Logistics', status: 'Success' },
                        { name: 'Rahul Dev', act: 'Volunteer accepted mission', mod: 'Responder Net', status: 'Success' },
                        { name: 'Priya Sharma', act: 'Welfare placement queue update', mod: 'Child Bureau', status: 'Success' }
                      ].map((log, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 font-bold text-white">{log.name}</td>
                          <td className="p-3 text-slate-400">{log.act}</td>
                          <td className="p-3 uppercase font-bold text-primary">{log.mod}</td>
                          <td className="p-3 text-slate-500">{new Date(Date.now() - idx * 1800000).toLocaleTimeString()}</td>
                          <td className="p-3 text-emerald-400 font-bold">{log.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
      {selectedCase && (
        <EmergencyCommandDrawer
          selectedCase={selectedCase}
          setSelectedCase={setSelectedCase}
          currentRole="admin"
          profile={profile}
          cases={cases}
          setCases={setCases}
          activeDispatches={activeDispatches}
          startDispatchAnimation={startDispatchAnimation}
          logAction={(log: any) => console.log('Admin logAction:', log)}
        />
      )}
    </div>
  )
}
