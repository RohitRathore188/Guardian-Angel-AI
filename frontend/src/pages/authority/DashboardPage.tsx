import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LiveMap from '../../components/LiveMap'
import { Case, mockCases } from '../../lib/mockData'
import { supabase, IS_MOCK_MODE } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import apiClient from '../../lib/apiClient'
import { 
  LogOut, Search, Shield, Bell, AlertTriangle, Settings, Database
} from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { getRoleConfig } from '../../config/getRoleConfig'
import WidgetRenderer from '../../components/WidgetRenderer'
import { getWidgets, WidgetConfig } from '../../config/widgets'
import ActionCard from '../../components/ActionCard'
import EmergencyCommandDrawer from '../../components/EmergencyCommandDrawer'
import { getActions, ActionLog } from '../../config/actions'
import AnalyticsDashboard from '../../components/AnalyticsDashboard'
import AiDashboard from '../../components/AiDashboard'
import { getAnalytics } from '../../config/analytics'
import { globalEventBus } from '../../core/events/eventBus'
import { initEventLogger } from '../../core/events/eventLogger'

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

  const [cases, setCases] = useState<Case[]>(generateDemoCases())
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'ops' | 'ai'>('ops')
  const showHeatmap = false
  const showTraffic = false
  const showSearchZones = true
  const [opRadius, setOpRadius] = useState<number>(10000) // default 10000 KM (All Cases - National)
  
  // Dynamic authority coordinates center based on active cases
  const getAuthCenter = () => {
    if (selectedCase) {
      return { lat: selectedCase.location.lat, lng: selectedCase.location.lng }
    }
    if (cases.length > 0) {
      const active = cases.filter(c => c.status !== 'closed')
      if (active.length > 0) {
        return { lat: active[0].location.lat, lng: active[0].location.lng }
      }
      return { lat: cases[0].location.lat, lng: cases[0].location.lng }
    }
    return { lat: 20.5937, lng: 78.9629 } // India Center fallback
  }

  const { lat: authLat, lng: authLng } = getAuthCenter()

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
  const { notifications, markAsRead, markAllAsRead, addNotification, triggerToast } = useNotifications()
  const [bellOpen, setBellOpen] = useState(false)

  const [widgets, setWidgets] = useState<WidgetConfig[]>([])

  useEffect(() => {
    setWidgets(getWidgets(currentRole))
  }, [currentRole])

  const [actionLogs, setActionLogs] = useState<ActionLog[]>(() => {
    const saved = localStorage.getItem('guardian-action-logs')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (err) {
        console.error(err)
      }
    }
    return [
      { who: 'System Operator', role: 'admin', actionTitle: 'System Boot Triage Online', caseId: 'global', when: new Date(Date.now() - 3600000).toLocaleTimeString(), timestamp: Date.now() - 3600000 },
      { who: 'Officer Sarah J.', role: 'police', actionTitle: 'Assigned Patrol Officer', caseId: 'democase-1001', when: new Date(Date.now() - 1800000).toLocaleTimeString(), timestamp: Date.now() - 1800000 },
      { who: 'Dr. Aaron Croft', role: 'hospital', actionTitle: 'Intake Admission Completed', caseId: 'democase-1002', when: new Date(Date.now() - 900000).toLocaleTimeString(), timestamp: Date.now() - 900000 }
    ]
  })

  const logAction = (logEntry: Omit<ActionLog, 'timestamp' | 'when'>) => {
    const newLog: ActionLog = {
      ...logEntry,
      when: new Date().toLocaleTimeString(),
      timestamp: Date.now()
    }
    setActionLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 50)
      localStorage.setItem('guardian-action-logs', JSON.stringify(updated))
      return updated
    })
  }

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData('text/plain', idx.toString())
  }

  const handleDragOver = (e: React.DragEvent, _idx: number) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'))
    if (isNaN(sourceIdx)) return

    setWidgets((prev) => {
      const next = [...prev]
      const [removed] = next.splice(sourceIdx, 1)
      next.splice(targetIdx, 0, removed)
      return next;
    })
  }

  // System Health statistics
  const systemHealthMetrics = {
    supabaseStatus: 'Connected',
    supabaseLatency: '42ms',
    geminiStatus: 'Connected',
    geminiModel: 'Gemini 1.5 Flash',
    apiStatus: 'Online',
    mockMode: 'Enabled'
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

  const playEmergencyAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      playTone(ctx.currentTime, 880, 0.2);
      playTone(ctx.currentTime + 0.15, 880, 0.2);
      playTone(ctx.currentTime + 0.3, 1200, 0.4);
    } catch (e) {
      console.error("Web Audio API alert failed:", e);
    }
  }

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
            let currentLat = d.startLat + (d.targetLat - d.startLat) * nextProgress
            let currentLng = d.startLng + (d.targetLng - d.startLng) * nextProgress

            if (d.routeCoords && d.routeCoords.length > 0) {
              const idx = Math.floor(nextProgress * (d.routeCoords.length - 1))
              const pt = d.routeCoords[idx]
              if (pt) {
                currentLat = pt[0]
                currentLng = pt[1]
              }
            }

            copy[caseId] = {
              ...d,
              progress: nextProgress,
              currentLat,
              currentLng,
            }
            changed = true

            if (nextProgress === 1) {
              const label = d.type === 'hospital' ? 'Ambulance' : d.type === 'ngo' ? 'NGO Rescue Van' : 'Police Cruiser'
              triggerToast('🟢 Dispatch Arrival', `${label} has reached coordinates for Case #${caseId.slice(0, 8).toUpperCase()}. The child has been accommodated and secured!`, 'success')
            }
          }
        })

        return changed ? copy : prev
      })
    }, 150)

    return () => clearInterval(interval)
  }, [])

  // Enterprise Event Bus Real-Time Subscribers
  useEffect(() => {
    initEventLogger();

    const unsubCreated = globalEventBus.subscribe('CaseCreated', (payload) => {
      playEmergencyAlertSound();
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification("🚨 EMERGENCY ACTIVE RESCUE ALARM", {
          body: `New distress case logged: ${payload.data.location?.address || 'Unknown Address'}`,
        });
      }
      setCases((prev) => {
        if (prev.some(c => c.id === payload.caseId)) return prev;
        return [payload.data, ...prev];
      });
    });

    const unsubUpdated = globalEventBus.subscribe('CaseUpdated', (payload) => {
      setCases((prev) =>
        prev.map((c) => (c.id === payload.caseId ? { ...c, ...payload.data } : c))
      );
    });

    const unsubAccepted = globalEventBus.subscribe('CaseAccepted', (payload) => {
      setCases((prev) =>
        prev.map((c) => (c.id === payload.caseId ? { ...c, status: 'dispatched' } : c))
      );
      addNotification({
        title: `✅ Case Accepted`,
        body: `Case #${payload.caseId?.slice(0, 8).toUpperCase()} has been accepted by responders.`,
        caseId: payload.caseId || 'global',
        category: 'Police',
        priority: 'high',
      });
    });

    const unsubStarted = globalEventBus.subscribe('ResponderStarted', (payload) => {
      startDispatchAnimation(payload.caseId!, payload.data.lat, payload.data.lng, payload.data.type);
    });

    const unsubClosed = globalEventBus.subscribe('CaseClosed', (payload) => {
      setCases((prev) =>
        prev.map((c) => (c.id === payload.caseId ? { ...c, status: 'closed' } : c))
      );
      addNotification({
        title: `🏁 Rescue Case Secured`,
        body: `Case #${payload.caseId?.slice(0, 8).toUpperCase()} has been successfully closed.`,
        caseId: payload.caseId || 'global',
        category: 'System',
        priority: 'high',
      });
    });

    const unsubBroadcast = globalEventBus.subscribe('BroadcastCreated', (payload) => {
      addNotification({
        title: `📢 EMERGENCY BROADCAST`,
        body: payload.data.message || 'Area emergency warning broadcast active.',
        caseId: 'global',
        category: 'Admin',
        priority: 'high',
      });
    });

    const unsubNotification = globalEventBus.subscribe('NotificationCreated', (payload) => {
      addNotification({
        title: payload.data.title || 'System Notification',
        body: payload.data.message || '',
        caseId: payload.caseId || 'global',
        category: 'System',
        priority: 'medium',
      });
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubAccepted();
      unsubStarted();
      unsubClosed();
      unsubBroadcast();
      unsubNotification();
    };
  }, []);

  const startDispatchAnimation = async (caseId: string, targetLat: number, targetLng: number, typeOverride?: string) => {
    const type = typeOverride || (currentRole === 'hospital' ? 'hospital' : currentRole === 'ngo' ? 'ngo' : 'police')
    const startLat = targetLat + (Math.random() > 0.5 ? 0.015 : -0.015)
    const startLng = targetLng + (Math.random() > 0.5 ? 0.015 : -0.015)

    // Pre-insert with straight line fallback
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
        routeCoords: []
      },
    }))

    // Fetch OSRM coordinates asynchronously
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${targetLng},${targetLat}?overview=full&geometries=geojson`)
      const data = await res.json()
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]])
        setActiveDispatches((prev) => {
          if (!prev[caseId]) return prev
          return {
            ...prev,
            [caseId]: {
              ...prev[caseId],
              routeCoords: coords
            }
          }
        })
      }
    } catch (err) {
      console.warn("OSRM dispatch route fetch failed, using straight line fallback.", err)
    }
  }

  const loadCases = async () => {
    try {
      const response = await apiClient.get('/api/cases')
      if (response.data && Array.isArray(response.data)) {
        const realReports = response.data.filter((c: Case) => !c.id.startsWith('democase-'))
        if (demoModeActive) {
          const demoCases = generateDemoCases()
          setCases([...realReports, ...demoCases])
        } else {
          setCases(response.data)
        }
      } else {
        if (demoModeActive) setCases(generateDemoCases())
      }
    } catch (err) {
      console.warn('Backend API /api/cases offline. Using mock cases for demonstration.', err)
      if (demoModeActive) {
        setCases(generateDemoCases())
      } else {
        setCases(mockCases)
      }
    }
  }

  const handleToggleDemoData = () => {
    setDemoModeActive(!demoModeActive)
  }

  useEffect(() => {
    loadCases()
  }, [demoModeActive])

  // Supabase Realtime subscription
  useEffect(() => {
    if (IS_MOCK_MODE) {
      console.log('Realtime subscriptions disabled in Mock Mode.')
      return
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const channel = supabase
      .channel('reports-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (payload: any) => {
        const newCase: Case = {
          id: payload.new?.id || `case-${Date.now()}`,
          status: payload.new?.status || 'reported',
          created_at: payload.new?.created_at || new Date().toISOString(),
          ai_severity: payload.new?.ai_severity || 'moderate',
          ai_analysis: payload.new?.ai_analysis || 'Distress report registered.',
          ai_dispatch_reason: payload.new?.ai_dispatch_reason || '',
          evidence: payload.new?.evidence || [],
          location: {
            address: payload.new?.address || 'India (Default View)',
            lat: parseFloat(payload.new?.latitude) || 20.5937,
            lng: parseFloat(payload.new?.longitude) || 78.9629
          }
        };
        globalEventBus.publish({
          type: 'CaseCreated',
          timestamp: Date.now(),
          caseId: newCase.id,
          source: 'server',
          data: newCase
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reports' }, (payload: any) => {
        globalEventBus.publish({
          type: 'CaseUpdated',
          timestamp: Date.now(),
          caseId: payload.new?.id,
          source: 'server',
          data: payload.new
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'reports' }, (_payload: any) => {
        loadCases();
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [demoModeActive])

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



  // Admin user manager update
  const handleUserRoleChange = (userId: string, newRole: string) => {
    setMockUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    if (userId === 'usr-1') {
      // If updating Sarah J. (current user context), trigger live override change
      setActiveRoleOverride(newRole)
    }
    triggerToast('Role Updated', `User Role updated to: ${newRole.toUpperCase()}`, 'success')
  }

  const handleDownloadPDF = (reportId: string) => {
    const c = cases.find(item => item.id === reportId) || mockCases.find(item => item.id === reportId);
    if (!c) {
      triggerToast('Error', `Case #${reportId} not found.`, 'warning');
      return;
    }
    
    const content = `===========================================================
               GUARDIAN ANGEL AI - INCIDENT SUMMARY
===========================================================
CASE ID:      ${c.id.toUpperCase()}
SEVERITY:     ${(c.ai_severity || 'MODERATE').toUpperCase()}
STATUS:       ${(c.status || 'REPORTED').toUpperCase()}
REPORTED AT:  ${c.created_at}

-----------------------------------------------------------
LOCATION DETAILS:
Address:      ${c.location?.address || 'N/A'}
Coordinates:  Latitude: ${c.location?.lat}, Longitude: ${c.location?.lng}

-----------------------------------------------------------
AI INTELLIGENCE LOG:
${c.ai_analysis}

-----------------------------------------------------------
DISPATCH REASONING:
${c.ai_dispatch_reason || 'N/A'}

-----------------------------------------------------------
GENERATED BY: Guardian Angel AI System Operator
TIMESTAMP:    ${new Date().toLocaleString()}
===========================================================`;

    const blob = new Blob([content], { type: 'application/pdf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incident-summary-${c.id.slice(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
              <option value={10000}>All Cases (National)</option>
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
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto scrollbar pr-1">
            <div className="grid grid-cols-12 gap-6 auto-rows-max">
              {widgets.map((w, idx) => (
                <WidgetRenderer
                  key={w.id}
                  widget={w}
                  role={currentRole}
                  cases={filteredCases}
                  setCases={setCases}
                  selectedCase={selectedCase}
                  setSelectedCase={setSelectedCase}
                  handleStatusUpdate={handleStatusUpdate}
                  notifications={notifications}
                  addNotification={addNotification}
                  mockAgencies={mockAgencies}
                  startDispatchAnimation={startDispatchAnimation}
                  activeDispatches={activeDispatches}
                  demoModeActive={demoModeActive}
                  actionLogs={actionLogs}
                  logAction={logAction}
                  index={idx}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </div>

            {/* Dynamic Command Actions Deck Console */}
            {(() => {
              const actionContext = {
                currentCase: selectedCase,
                currentRole: currentRole,
                user: profile || { name: 'Sarah J.' },
                cases,
                setCases,
                setSelectedCase,
                activeDispatches,
                startDispatchAnimation,
                addNotification,
                playAlertSound: playEmergencyAlertSound,
                navigate,
                logAction,
              };
              const actions = getActions(currentRole, actionContext);

              if (actions.length === 0) return null;

              return (
                <div className="card border border-white/10 bg-dark-900/20 p-5 rounded-2xl shrink-0 mt-6 space-y-4">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Dynamic Command Actions Deck ({actions.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {actions.map((act) => (
                      <ActionCard key={act.id} action={act} context={{ ...actionContext, logAction }} />
                    ))}
                  </div>
                </div>
              );
            })()}
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
                    <tr key={c.id} className={`border-b border-white/5 transition-colors ${
                      c.status === 'reported' 
                        ? 'bg-red-500/[0.04] border-l-2 border-primary hover:bg-red-500/[0.08]' 
                        : 'hover:bg-white/5'
                    }`}>
                      <td className="p-4 font-mono text-white font-bold flex items-center gap-1.5 h-full">
                        #{c.id.slice(0, 10).toUpperCase()}
                        {c.status === 'reported' && (
                          <span className="animate-pulse bg-primary text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                            New
                          </span>
                        )}
                      </td>
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
                role={currentRole}
              />
            </div>
          </div>
        ) : activeTab === 'Analytics' || activeTab === 'My Rewards' ? (
          /* TAB 4: Dynamic Analytics Views */
          <div className="flex-1 flex flex-col gap-6 overflow-hidden h-full">
            {currentRole === 'admin' && (
              <div className="flex bg-dark-900/60 border border-white/5 p-1 rounded-xl shrink-0 w-80">
                <button
                  onClick={() => setAnalyticsSubTab('ops')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                    analyticsSubTab === 'ops' ? 'bg-primary text-white' : 'text-slate-450 hover:text-slate-300'
                  }`}
                >
                  Operational Stats
                </button>
                <button
                  onClick={() => setAnalyticsSubTab('ai')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                    analyticsSubTab === 'ai' ? 'bg-primary text-white' : 'text-slate-450 hover:text-slate-300'
                  }`}
                >
                  AI Intelligence
                </button>
              </div>
            )}

            {currentRole === 'admin' && analyticsSubTab === 'ai' ? (
              <AiDashboard cases={cases} />
            ) : (
              <AnalyticsDashboard config={getAnalytics(currentRole)} cases={cases} />
            )}
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
      {selectedCase && (
        <EmergencyCommandDrawer
          selectedCase={selectedCase}
          setSelectedCase={setSelectedCase}
          currentRole={currentRole}
          profile={profile}
          cases={cases}
          setCases={setCases}
          activeDispatches={activeDispatches}
          startDispatchAnimation={startDispatchAnimation}
          logAction={logAction}
        />
      )}
    </div>
  )
}
