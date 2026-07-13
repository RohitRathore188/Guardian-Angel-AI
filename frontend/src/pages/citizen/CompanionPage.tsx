import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Send, Shield, Phone, MapPin, Compass, AlertTriangle, CheckCircle, Bell, FileText, MessageSquare, List, CloudRain, Info, Navigation, Zap, Cpu, Search, Filter, Play, Pause, RotateCcw, BarChart2, ArrowRight } from 'lucide-react'
import apiClient from '../../lib/apiClient'
import { supabase, IS_MOCK_MODE } from '../../lib/supabaseClient'
import { Case, mockCases } from '../../lib/mockData'
import LiveMap, { generateMockResponders } from '../../components/LiveMap'
import SeverityBadge from '../../components/SeverityBadge'
import { useNotifications } from '../../context/NotificationContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const mockAgencies = [
  { name: 'St. Jude Emergency Center', type: 'Hospital', phone: '+91 44 9110 3829', latitude: 13.0805, longitude: 80.2730, address: 'Periamet, Chennai' },
  { name: '17th Precinct Police Station', type: 'Police Station', phone: '+91 44 9110 9988', latitude: 13.0630, longitude: 80.2520, address: 'Egmore, Chennai' },
  { name: 'Municipal Child Welfare Office', type: 'Child Welfare Office', phone: '+91 44 9110 4433', latitude: 13.0450, longitude: 80.2600, address: 'Mylapore, Chennai' },
  { name: 'Hope Family Foundation', type: 'NGO Shelter', phone: '+91 44 9110 0011', latitude: 13.0850, longitude: 80.2100, address: 'Anna Nagar, Chennai' }
]

// Distance utility
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371 // km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return parseFloat((R * c).toFixed(2))
}

export default function CompanionPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const caseId = searchParams.get('case_id') || 'mock-case'
  const initialTab = searchParams.get('tab') as any || 'chat'

  // Central Notification Hooks
  const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead } = useNotifications()

  const [activeTab, setActiveTab] = useState<'chat' | 'tracking' | 'help' | 'notifications' | 'my-reports'>(initialTab)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [currentCase, setCurrentCase] = useState<Case | null>(null)
  const [activeDispatches, setActiveDispatches] = useState<Record<string, any>>({})
  const [citizenReports, setCitizenReports] = useState<Case[]>([])
  
  // ── Rescue Timeline Step Simulator ──
  const [timelineStep, setTimelineStep] = useState(1) // 0 to 8
  const [etaSeconds, setEtaSeconds] = useState(0) // Live ETA countdown ticks

  // Bell toggle state
  const [bellOpen, setBellOpen] = useState(false)
  const [routeData, setRouteData] = useState<Record<string, { distance: string; duration: string }>>({})

  // Notifications filters
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // ── My Reports / Case Lifecycle Details state ──
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState('all')
  const [selectedHistoryCase, setSelectedHistoryCase] = useState<Case | null>(null)

  // Incident Replay states
  const [isReplaying, setIsReplaying] = useState(false)
  const [replayStep, setReplayStep] = useState(0)
  const [historyCaseSubTab, setHistoryCaseSubTab] = useState<'details' | 'vision'>('details')

  // ── Rescue Companion 2.0 States ──
  const [checklist, setChecklist] = useState<boolean[]>([true, true, false, false, false, false])
  const [voiceState, setVoiceState] = useState<'idle' | 'playing' | 'paused' | 'muted'>('idle')
  const [nearbyAgencies, setNearbyAgencies] = useState<any[]>(mockAgencies)
  const [loadingAgencies, setLoadingAgencies] = useState<boolean>(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  // Format seconds to MM:SS countdown format
  const formatCountdown = (startMin: number) => {
    const startSec = startMin * 60
    const remaining = Math.max(0, startSec - etaSeconds)
    if (remaining === 0) return 'Arrived'
    const mins = Math.floor(remaining / 60)
    const secs = remaining % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Weather configuration values based on coordinates
  const weather = {
    temp: '29°C',
    condition: 'Heavy Rain',
    icon: <CloudRain className="w-5 h-5 text-blue-400" />,
    recommendation: 'Move the child to a dry, covered area immediately to prevent exposure.'
  }

  // Generate responders list dynamically
  const respondersList = currentCase
    ? generateMockResponders(currentCase.location.lat, currentCase.location.lng)
    : []

  // Vision Analysis structured data mapper
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

  // Find nearest responder of each type
  const getNearestResponder = (type: string) => {
    if (!currentCase || !respondersList.length) return null
    const list = respondersList.filter((r: any) => r.type === type && r.availability === 'Available')
    if (!list.length) return null
    
    let nearest = list[0]
    let minDist = getDistance(currentCase.location.lat, currentCase.location.lng, nearest.lat, nearest.lng)
    
    for (let r of list) {
      const dist = getDistance(currentCase.location.lat, currentCase.location.lng, r.lat, r.lng)
      if (dist < minDist) {
        minDist = dist
        nearest = r
      }
    }
    return nearest
  }

  const nearestHospital = getNearestResponder('Hospital')
  const nearestPolice = getNearestResponder('Police Station')
  const nearestVolunteer = getNearestResponder('Volunteer')
  const nearestNGO = getNearestResponder('NGO Shelter')

  const fetchCompanionRoutes = async (childLat: number, childLng: number) => {
    const roles = [
      { id: 'hospital', r: nearestHospital },
      { id: 'police', r: nearestPolice },
      { id: 'volunteer', r: nearestVolunteer },
      { id: 'ngo', r: nearestNGO }
    ]
    
    const results: Record<string, { distance: string; duration: string }> = {}
    for (const item of roles) {
      if (item.r) {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${item.r.lng},${item.r.lat};${childLng},${childLat}`)
          const data = await res.json()
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0]
            const distKm = (route.distance / 1000).toFixed(1)
            const durationMin = Math.ceil(route.duration / 60)
            results[item.id] = {
              distance: `${distKm} km`,
              duration: `${durationMin} mins`
            }
          }
        } catch (e) {
          console.warn(`OSRM fetch failed for companion role ${item.id}`, e)
        }
      }
    }
    if (Object.keys(results).length > 0) {
      setRouteData(results)
    }
  }

  useEffect(() => {
    if (currentCase && respondersList.length > 0) {
      fetchCompanionRoutes(currentCase.location.lat, currentCase.location.lng)
    }
  }, [currentCase?.id, respondersList.length])

  const isCompleted = currentCase?.status === 'rescued' || currentCase?.status === 'closed'

  // Fetch case details from database (or mock)
  const fetchCaseDetails = async () => {
    if (caseId.startsWith('mock-')) {
      const mock = mockCases.find(c => c.id === caseId) || mockCases[0]
      setCurrentCase(mock)
    } else {
      try {
        const { data } = await supabase
          .from('reports')
          .select('*')
          .eq('id', caseId)
          .maybeSingle()
        if (data) {
          let mappedStatus = data.status
          if (data.status === 'pending') mappedStatus = 'reported'
          else if (data.status === 'assigned' || data.status === 'in_progress' || data.status === 'analysis') mappedStatus = 'dispatched'
          else if (data.status === 'resolved') mappedStatus = 'rescued'

          setCurrentCase({
            id: data.id,
            location: {
              lat: data.latitude || 13.0827,
              lng: data.longitude || 80.2707,
              address: data.address || 'Unknown Location'
            },
            status: mappedStatus,
            ai_severity: data.priority || 'high',
            ai_analysis: data.ai_analysis?.assessment || 'Emergency reported.',
            ai_dispatch_reason: 'Pending responder arrival.',
            created_at: data.created_at,
            evidence: data.image_urls?.length ? [{ file_url: data.image_urls[0] }] : [],
            structured_analysis: data.ai_analysis?.structured_analysis || null
          })

          // Sync timeline step with Supabase status
          if (mappedStatus === 'reported') setTimelineStep(1)
          else if (mappedStatus === 'dispatched') setTimelineStep(5)
          else if (mappedStatus === 'rescued') setTimelineStep(7)
          else if (mappedStatus === 'closed') setTimelineStep(8)
        }
      } catch (err) {
        console.warn("DB fetch failed, using mock fallback", err)
        const mock = mockCases.find(c => c.id === caseId) || mockCases[0]
        setCurrentCase(mock)
      }
    }
  }

  // Fetch citizen reports lists
  const loadCitizenReports = async () => {
    try {
      const response = await apiClient.get('/api/cases')
      if (response.data && Array.isArray(response.data)) {
        setCitizenReports(response.data)
      } else {
        setCitizenReports(mockCases)
      }
    } catch {
      setCitizenReports(mockCases)
    }
  }

  // Initial Load and Real-time listener
  useEffect(() => {
    fetchCaseDetails()
    loadCitizenReports()

    if (!IS_MOCK_MODE && !caseId.startsWith('mock-')) {
      const channel = supabase
        .channel(`case-tracking-${caseId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `id=eq.${caseId}` }, () => {
          fetchCaseDetails()
          loadCitizenReports()
        })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [caseId])

  // Fetch real-world verified nearby agencies based on case coordinates
  useEffect(() => {
    if (!currentCase) return;

    const fetchNearbyAgencies = async () => {
      setLoadingAgencies(true)
      const lat = currentCase.location.lat
      const lng = currentCase.location.lng
      
      try {
        const queryOsm = async (type: string, queryStr: string, limit: number) => {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${queryStr}&lat=${lat}&lon=${lng}&limit=${limit}&addressdetails=1`
          const res = await fetch(url)
          if (!res.ok) return []
          const data = await res.json()
          return data.map((item: any) => ({
            name: item.display_name.split(',')[0] || item.name || type,
            type,
            phone: item.address?.phone || '+91 44 9110 ' + Math.floor(1000 + Math.random() * 9000),
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            address: item.display_name.split(',').slice(1, 4).join(',').trim() || item.display_name
          }))
        }

        const hospitals = await queryOsm('Hospital', 'hospital', 2)
        const police = await queryOsm('Police Station', 'police', 2)
        const welfare = await queryOsm('NGO Shelter', 'social+facility', 1)

        const combined = [...hospitals, ...police, ...welfare]
        if (combined.length > 0) {
          setNearbyAgencies(combined)
        } else {
          setNearbyAgencies(mockAgencies)
        }
      } catch (err) {
        console.warn('Failed to fetch real-world nearby agencies, falling back to default mock list:', err)
        setNearbyAgencies(mockAgencies)
      } finally {
        setLoadingAgencies(false)
      }
    }

    fetchNearbyAgencies()
  }, [currentCase])

  // Bind timeline stepper progression to trigger new notifications and toasts
  useEffect(() => {
    if (currentCase) {
      let title = ''
      let body = ''
      let category: any = 'System'
      let priority: any = 'low'

      switch (timelineStep) {
        case 1:
          title = '📝 Emergency Report Submitted'
          body = `Case #${currentCase.id.slice(0, 8).toUpperCase()} logged at ${currentCase.location.address}.`
          category = 'Emergency'
          priority = currentCase.ai_severity
          break
        case 2:
          title = '🚑 Hospital Accepted Case'
          body = 'ER pediatric ambulance dispatched. Starting countdown.'
          category = 'Hospital'
          priority = 'high'
          break
        case 3:
          title = '👮 Police Team Dispatched'
          body = 'Regional patrol cruiser mobilizing with priority routing.'
          category = 'Police'
          priority = 'critical'
          break
        case 4:
          title = '🛵 Volunteer Mobilizing'
          body = 'Volunteer Rahul accepted coord grid assignment.'
          category = 'Volunteer'
          priority = 'medium'
          break
        case 5:
          title = '🤖 AI Dispatch Optimization Complete'
          body = 'Smart radius filters finalized. Best responders allocated.'
          category = 'AI'
          priority = 'high'
          break
        case 6:
          title = '📍 Responders Arrived at Site'
          body = 'First contact unit has reached coordinates.'
          category = 'System'
          priority = 'high'
          break
        case 7:
          title = '👼 Child Secured & Safe'
          body = 'Welfare officers successfully accommodated the child.'
          category = 'System'
          priority = 'low'
          break
        case 8:
          title = '🔐 Incident Registry Closed'
          body = 'Case records saved. Operations completed.'
          category = 'Admin'
          priority = 'low'
          break
      }

      if (title) {
        addNotification({
          caseId: currentCase.id,
          title,
          body,
          category,
          priority
        })
      }
    }
  }, [timelineStep, currentCase?.id])

  // Incident Replay Timer Effect
  useEffect(() => {
    let interval: any
    if (isReplaying) {
      interval = setInterval(() => {
        setReplayStep((prev) => {
          if (prev >= 8) {
            setIsReplaying(false)
            return 8
          }
          const next = prev + 1
          setTimelineStep(next)
          return next
        })
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [isReplaying])

  // Automatic Timeline progression simulator for mock cases
  useEffect(() => {
    if (caseId.startsWith('mock-')) {
      const interval = setInterval(() => {
        setTimelineStep((prev) => {
          if (prev >= 8) {
            clearInterval(interval)
            return 8
          }
          const next = prev + 1
          
          // Sync mock case status optimistically based on timeline step
          setCurrentCase((c) => {
            if (!c) return null
            let nextStatus = c.status
            if (next <= 1) nextStatus = 'reported'
            else if (next <= 6) nextStatus = 'dispatched'
            else if (next === 7) nextStatus = 'rescued'
            else nextStatus = 'closed'
            return { ...c, status: nextStatus }
          })

          return next
        })
      }, 10000) // Advance step every 10 seconds for demo pacing

      return () => clearInterval(interval)
    }
  }, [caseId])

  // Second-based countdown ticker for ETAs
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Sync active tab with search parameter updates
  useEffect(() => {
    const tabQuery = searchParams.get('tab')
    if (tabQuery && ['chat', 'tracking', 'help', 'notifications', 'my-reports'].includes(tabQuery)) {
      setActiveTab(tabQuery as any)
    }
  }, [searchParams])

  // Mock vehicle dispatch glide animation
  useEffect(() => {
    if (currentCase && currentCase.status === 'dispatched') {
      const targetLat = currentCase.location.lat
      const targetLng = currentCase.location.lng
      const startLat = targetLat + 0.009
      const startLng = targetLng - 0.009

      setActiveDispatches({
        [currentCase.id]: {
          caseId: currentCase.id,
          startLat,
          startLng,
          currentLat: startLat,
          currentLng: startLng,
          targetLat,
          targetLng,
          progress: 0,
          type: currentCase.ai_severity === 'critical' ? 'police' : 'hospital'
        }
      })
    } else {
      setActiveDispatches({})
    }
  }, [currentCase])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDispatches((prev) => {
        const copy = { ...prev }
        let changed = false

        Object.keys(copy).forEach((id) => {
          const d = copy[id]
          if (d.progress < 1) {
            const nextProgress = Math.min(d.progress + 0.02, 1)
            copy[id] = {
              ...d,
              progress: nextProgress,
              currentLat: d.startLat + (d.targetLat - d.startLat) * nextProgress,
              currentLng: d.startLng + (d.targetLng - d.startLng) * nextProgress
            }
            changed = true
          }
        })

        return changed ? copy : prev
      })
    }, 200)

    return () => clearInterval(interval)
  }, [])

  // Initial greeting from AI
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content:
          "I'm your Rescue Companion 2.0 👼 Connected to dispatch and active. Please let me know how the child is doing while rescue units approach.",
      },
    ])
  }, [caseId])

  // Context-aware mock chat response router
  const getMockResponse = (userMsg: string, caseObj: Case | null) => {
    const q = userMsg.toLowerCase()
    if (!caseObj) return "I am monitoring the case. Help is on the way."
    
    if (q.includes('move')) {
      return `Based on the case details and current weather (${weather.condition}), do NOT move the child unless there is immediate danger. Try to protect them from exposure.`
    }
    if (q.includes('long') || q.includes('help') || q.includes('arrive') || q.includes('eta')) {
      return `Hospital ambulance is en route (ETA: ${formatCountdown(6)}). The nearest responder is estimated to arrive shortly. Please stay in place.`
    }
    if (q.includes('do') || q.includes('checklist') || q.includes('what')) {
      return `Please focus on these priorities: 1. Keep the child warm and calm. 2. Keep bystanders away. 3. Avoid giving food or water in case of internal trauma. 4. Wait for the responders.`
    }
    if (q.includes('injur') || q.includes('hurt')) {
      return "If the child has visible injuries, keep them still and apply gentle pressure to any bleeding with a clean cloth. Do not attempt to reset limbs. Responders are approaching."
    }
    return `I am keeping watch over Case #${caseObj.id.slice(0, 8).toUpperCase()}. Authorities are responding. Please stay safe.`
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const text = input
    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await apiClient.post('/api/chat', {
        case_id: caseId,
        message: text,
        context: {
          priority: currentCase?.ai_severity,
          summary: currentCase?.ai_analysis,
          timelineStep,
          weather: `${weather.temp}, ${weather.condition}`,
          responders: respondersList.map(r => ({ name: r.name, type: r.type, dist: currentCase ? getDistance(currentCase.location.lat, currentCase.location.lng, r.lat, r.lng) : 0 }))
        }
      })
      const reply = typeof response.data?.reply === 'string' && response.data.reply.trim()
        ? response.data.reply
        : getMockResponse(text, currentCase)
      const aiMsg: Message = { role: 'assistant', content: reply }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const reply = getMockResponse(text, currentCase)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    }

    setLoading(false)
  }

  const handleQuickQuestion = (text: string) => {
    if (text.startsWith('Call')) {
      if (text.includes('Hospital')) window.open(`tel:${mockAgencies[0].phone}`)
      else window.open(`tel:${mockAgencies[1].phone}`)
      return
    }
    setInput(text)
  }

  const handleToggleChecklist = (idx: number) => {
    setChecklist((prev) => {
      const copy = [...prev]
      copy[idx] = !copy[idx]
      return copy
    })
  }

  const handleDownloadPDF = (reportId: string) => {
    const c = currentCase || mockCases.find(item => item.id === reportId);
    const id = c?.id || reportId;
    const severity = c?.ai_severity || 'MODERATE';
    const status = c?.status || 'REPORTED';
    const createdAt = c?.created_at || new Date().toISOString();
    const address = c?.location?.address || 'N/A';
    const lat = c?.location?.lat || 0;
    const lng = c?.location?.lng || 0;
    const aiAnalysis = c?.ai_analysis || 'No AI log available.';

    const content = `===========================================================
               GUARDIAN ANGEL AI - INCIDENT SUMMARY
===========================================================
CASE ID:      ${id.toUpperCase()}
SEVERITY:     ${severity.toUpperCase()}
STATUS:       ${status.toUpperCase()}
REPORTED AT:  ${createdAt}

-----------------------------------------------------------
LOCATION DETAILS:
Address:      ${address}
Coordinates:  Latitude: ${lat}, Longitude: ${lng}

-----------------------------------------------------------
AI INTELLIGENCE LOG:
${aiAnalysis}

-----------------------------------------------------------
GENERATED BY: Guardian Angel AI Citizen Companion
TIMESTAMP:    ${new Date().toLocaleString()}
===========================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incident-summary-${id.slice(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Dynamic status mappings for authority responders
  const getResponderStatus = (role: string) => {
    const route = routeData[role];
    const defaultDist = role === 'hospital' ? '2.4 km' : role === 'police' ? '1.2 km' : role === 'ngo' ? '3.1 km' : '0.8 km';
    const defaultEta = role === 'hospital' ? '6 min' : role === 'police' ? '4 min' : role === 'ngo' ? '7 min' : '3 min';
    
    const dist = route ? route.distance : defaultDist;
    const eta = route ? route.duration : defaultEta;

    switch (role) {
      case 'hospital':
        if (timelineStep < 2) return { status: 'Waiting', eta, dist, vehicle: 'Ambulance', activity: 'Awaiting triage allocation', color: 'text-slate-500' }
        if (timelineStep === 2) return { status: 'Accepted', eta, dist, vehicle: 'Ambulance', activity: 'ER team preparing unit', color: 'text-blue-400 font-bold' }
        if (timelineStep < 6) return { status: 'Travelling', eta, dist, vehicle: 'Ambulance', activity: 'En route with life-support', color: 'text-orange-400 font-bold animate-pulse' }
        if (timelineStep < 7) return { status: 'Arrived', eta: 'Arrived', dist: '0.00 km', vehicle: 'Ambulance', activity: 'Triage team conducting assessment', color: 'text-green-400 font-bold' }
        return { status: 'Completed', eta: 'Arrived', dist: '0.00 km', vehicle: 'Ambulance', activity: 'Child accommodated at facility', color: 'text-green-500 font-bold' }
      case 'police':
        if (timelineStep < 3) return { status: 'Waiting', eta, dist, vehicle: 'Police SUV', activity: 'Pending dispatch broadcast', color: 'text-slate-500' }
        if (timelineStep === 3) return { status: 'Accepted', eta, dist, vehicle: 'Police SUV', activity: 'Cruiser preparing dispatch', color: 'text-blue-400 font-bold' }
        if (timelineStep < 6) return { status: 'Travelling', eta, dist, vehicle: 'Police SUV', activity: 'Responding with emergency flashers', color: 'text-orange-400 font-bold animate-pulse' }
        if (timelineStep < 7) return { status: 'Arrived', eta: 'Arrived', dist: '0.00 km', vehicle: 'Police SUV', activity: 'Securing reporting environment', color: 'text-green-400 font-bold' }
        return { status: 'Completed', eta: 'Arrived', dist: '0.00 km', vehicle: 'Police SUV', activity: 'Area secured, case logged', color: 'text-green-500 font-bold' }
      case 'ngo':
        if (timelineStep < 4) return { status: 'Waiting', eta, dist, vehicle: 'Welfare Van', activity: 'Awaiting dispatch confirmation', color: 'text-slate-500' }
        if (timelineStep === 4) return { status: 'Accepted', eta, dist, vehicle: 'Welfare Van', activity: 'Welfare staff preparing supplies', color: 'text-blue-400 font-bold' }
        if (timelineStep < 7) return { status: 'Travelling', eta, dist, vehicle: 'Welfare Van', activity: 'En route with family counseling kits', color: 'text-orange-400 font-bold animate-pulse' }
        return { status: 'Completed', eta: 'Arrived', dist: '0.00 km', vehicle: 'Welfare Van', activity: 'Shelter accommodations prepared', color: 'text-green-500 font-bold' }
      case 'volunteer':
        if (timelineStep < 5) return { status: 'Waiting', eta, dist, vehicle: 'Motorbike', activity: 'Searching coordinate grid', color: 'text-slate-500' }
        if (timelineStep === 5) return { status: 'Accepted', eta, dist, vehicle: 'Motorbike', activity: 'Volunteer accepting task', color: 'text-blue-400 font-bold' }
        if (timelineStep < 6) return { status: 'Travelling', eta, dist, vehicle: 'Motorbike', activity: 'Bypassing vehicle traffic', color: 'text-orange-400 font-bold animate-pulse' }
        if (timelineStep < 7) return { status: 'Arrived', eta: 'Arrived', dist: '0.00 km', vehicle: 'Motorbike', activity: 'Providing basic first aid', color: 'text-green-400 font-bold' }
        return { status: 'Completed', eta: 'Arrived', dist: '0.00 km', vehicle: 'Motorbike', activity: 'Volunteer assistance complete', color: 'text-green-500 font-bold' }
      case 'welfare':
      default:
        if (timelineStep < 7) return { status: 'Waiting', eta: '--', dist: '--', vehicle: 'Office Bureau', activity: 'Monitoring child custody records', color: 'text-slate-500' }
        return { status: 'Completed', eta: 'Arrived', dist: '0.00 km', vehicle: 'Office Bureau', activity: 'Custody case registered', color: 'text-green-500 font-bold' }
    }
  }

  const isTrackingView = activeTab === 'tracking' && !isCompleted

  // Filter central notifications list on Notifications tab
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.body.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || n.priority === priorityFilter
    return matchesSearch && matchesPriority
  }).sort((a, b) => {
    const tA = new Date(a.timestamp).getTime()
    const tB = new Date(b.timestamp).getTime()
    return sortOrder === 'desc' ? tB - tA : tA - tB
  })

  // Fixed top Emergency Banner logic
  const hasCriticalCase = currentCase?.ai_severity === 'critical' && !isCompleted

  // ── My Reports Filter Logic ──
  const filteredHistoryReports = citizenReports.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(historySearch.toLowerCase()) || c.location.address.toLowerCase().includes(historySearch.toLowerCase())
    
    if (historyFilter === 'all') return matchesSearch
    if (historyFilter === 'active') return matchesSearch && c.status !== 'closed'
    if (historyFilter === 'critical') return matchesSearch && c.ai_severity === 'critical'
    if (historyFilter === 'completed') return matchesSearch && (c.status === 'rescued' || c.status === 'closed')
    
    if (historyFilter === 'hospital') return matchesSearch && c.ai_severity !== 'moderate'
    if (historyFilter === 'police') return matchesSearch && c.ai_severity === 'critical'
    if (historyFilter === 'volunteer') return matchesSearch && c.ai_severity !== 'moderate'
    if (historyFilter === 'ngo') return matchesSearch
    
    return matchesSearch
  })

  // Checklist progress calculator
  const checklistCheckedCount = checklist.filter(Boolean).length
  const checklistPercent = Math.round((checklistCheckedCount / 6) * 100)

  return (
    <div className="min-h-screen bg-white/30 flex flex-col relative overflow-hidden w-full">
      {/* ── Fixed Critical Emergency Banner ── */}
      {hasCriticalCase && (
        <div className="bg-red-600 text-white text-xs font-bold py-2.5 px-4 flex justify-between items-center z-50 relative animate-pulse shrink-0">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            🚨 Critical Child Rescue Active — Authorities Responding (ETA: 3 mins)
          </span>
          <button 
            onClick={() => {
              setActiveTab('tracking')
              window.history.pushState({ path: `?case_id=${caseId}&tab=tracking` }, '', `?case_id=${caseId}&tab=tracking`)
            }} 
            className="bg-white text-red-600 px-3 py-1 rounded font-bold uppercase text-[9px] hover:bg-slate-100 transition-colors"
          >
            Open Live Tracking
          </button>
        </div>
      )}

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 glow-red opacity-15 pointer-events-none" />

      {/* Unified Header */}
      <header className="header-glass px-5 py-4 flex items-center justify-between relative z-20 w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-white font-bold text-sm truncate max-w-[150px] md:max-w-none">
              Rescue Command {currentCase && `#${currentCase.id.slice(0, 8).toUpperCase()}`}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />
              <p className={`text-[10px] uppercase font-bold ${isCompleted ? 'text-green-400' : 'text-orange-400'}`}>
                {currentCase?.status === 'reported' ? 'AI Analyzing' : currentCase?.status || 'Pending'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          
          {/* Notification Bell Icon */}
          <div className="relative">
            <button 
              onClick={() => setBellOpen(!bellOpen)}
              className="w-9 h-9 rounded-xl bg-dark-800/80 border border-white/5 flex items-center justify-center relative hover:bg-dark-800 transition-all"
            >
              <Bell className="w-4 h-4 text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[8px] font-black text-white flex items-center justify-center rounded-full border border-dark-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Bell Dropdown popover */}
            {bellOpen && (
              <div className="absolute right-0 mt-2.5 w-64 bg-dark-900/95 border border-white/10 rounded-xl p-3 shadow-2xl z-[1000] backdrop-blur-md text-xs text-white">
                <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Notifications ({unreadCount})</span>
                  <button onClick={markAllAsRead} className="text-[9px] text-primary hover:underline">Mark all read</button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar pr-0.5">
                  {notifications.length === 0 ? (
                    <p className="text-slate-500 py-3 text-center">No alerts logged</p>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
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
                            n.priority === 'critical' ? 'text-red-400' :
                            n.priority === 'high' ? 'text-orange-400' : 'text-slate-500'
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

          <a href="tel:1098" className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold px-3 py-1.5 rounded-lg">
            <Phone className="w-3.5 h-3.5" />
            1098
          </a>
          <button 
            onClick={() => navigate('/citizen-dashboard')} 
            className="text-[10px] text-slate-400 border border-white/5 bg-dark-800/40 px-3 py-1.5 rounded-lg font-semibold hover:text-white"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Case Completed Success Screen */}
      {isCompleted ? (
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 text-center relative z-10 scrollbar overflow-y-auto max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6 border border-green-500/30 shadow-lg shadow-green-500/20 animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <span className="text-green-400 text-xs font-bold tracking-[2px] uppercase mb-2">Rescue Completed</span>
          <h2 className="text-2xl font-black text-white mb-3">Child Secured & Safe! 👼</h2>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-8">
            Thank you! Authorities have successfully accommodated the child and placed them under safe welfare custody. The family reunification protocol is underway.
          </p>

          <div className="card-glass p-5 w-full text-left border border-white/5 space-y-4 mb-8">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Accommodation Status</h4>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-green-400 mt-0.5" />
              <div>
                <p className="text-white text-xs font-bold">St. Jude Pediatric Trauma & Welfare Center</p>
                <p className="text-slate-400 text-[10px]">Periamet, Chennai, Tamil Nadu</p>
              </div>
            </div>
            <div className="border-t border-white/5 pt-3">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Dispatch Operations Logs</p>
              <p className="text-slate-300 text-xs mt-1">Responder Units mobilized: Medical Ambulance Unit #3, Adyar Precinct Patrol.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => handleDownloadPDF(caseId)}
              className="btn-secondary py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Download Case PDF Record
            </button>
            <button
              onClick={() => navigate('/citizen-dashboard')}
              className="btn-primary py-3 text-xs font-bold rounded-xl"
            >
              Return to Citizen Workspace
            </button>
          </div>
        </div>
      ) : (
        /* Regular workspace containing tabs */
        <>
          {/* Tabs Container */}
          <div className="flex bg-dark-950/80 border-b border-white/5 relative z-15 w-full">
            <div className="flex w-full max-w-7xl mx-auto px-5">
              {[
                { id: 'chat', label: 'AI Chat', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                { id: 'tracking', label: 'Tracking & Monitoring', icon: <Compass className="w-3.5 h-3.5" /> },
                { id: 'help', label: 'Nearby Help', icon: <MapPin className="w-3.5 h-3.5" /> },
                { id: 'notifications', label: 'Updates', icon: <Bell className="w-3.5 h-3.5" /> },
                { id: 'my-reports', label: 'History', icon: <List className="w-3.5 h-3.5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any)
                    const newUrl = `${window.location.pathname}?case_id=${caseId}&tab=${tab.id}`
                    window.history.pushState({ path: newUrl }, '', newUrl)
                  }}
                  className={`flex-1 py-3 text-[10px] font-bold flex flex-col items-center gap-1.5 border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── TAB 1: AI Rescue Companion 2.0 ── */}
          {activeTab === 'chat' && currentCase && (
            <div className="flex-1 w-full max-w-7xl mx-auto px-5 py-6 flex flex-col md:grid md:grid-cols-12 md:gap-6 overflow-hidden relative z-10">
              
              {/* Left Column: Chat Console, Prompts, and Soundwave Deck */}
              <div className="col-span-12 md:col-span-7 flex flex-col gap-4 overflow-hidden h-[450px] md:h-full">
                
                {/* Guardian AI Header banner */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                    <div>
                      <p className="text-white text-xs font-bold uppercase tracking-wider">Guardian AI Companion</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Online | Active Rescue Monitoring</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-500">
                    <span className="font-mono text-white block">#{currentCase.id.slice(0, 10).toUpperCase()}</span>
                    <span className="uppercase text-[9px] font-bold text-slate-400">Severity: {currentCase.ai_severity}</span>
                  </div>
                </div>

                {(() => {
                  const faceMatch = (currentCase as any).structured_analysis?.face_match || (currentCase as any).ai_analysis?.face_match || null;
                  if (faceMatch && faceMatch.match_found) {
                    return (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3.5 text-xs text-yellow-400 space-y-1">
                        <p className="font-bold text-yellow-500 flex items-center gap-1">
                          🚨 AMBER ALERT: CHILD IDENTIFIED ({faceMatch.confidence}% Match)
                        </p>
                        <p className="text-white font-semibold text-sm">Name: {faceMatch.matched_child?.name}</p>
                        <p className="text-slate-300">Parent Name: {faceMatch.matched_child?.parent_name}</p>
                        <p className="text-slate-400">Emergency Status: Parents have been notified via Email and coordinate details have been routed.</p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Message Log */}
                <div className="flex-1 overflow-y-auto px-1 py-2 space-y-3.5 scrollbar border border-white/5 bg-dark-950/20 rounded-xl p-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                          <Shield className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-dark-800 border border-white/10 text-slate-200 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mr-2 flex-shrink-0">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="bg-dark-800 border border-white/10 px-4 py-2.5 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Quick prompts scroll list */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
                  {[
                    'What should I do?',
                    'Should I move the child?',
                    'How long until help arrives?',
                    'Is the child injured?',
                    'Call Hospital',
                    'Call Police'
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleQuickQuestion(chip)}
                      className="px-3 py-1.5 bg-dark-800 hover:bg-dark-700 border border-white/5 text-[10px] text-slate-300 hover:text-white rounded-full whitespace-nowrap transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Voice guidance deck */}
                <div className="card p-3 border border-white/5 bg-dark-950/40 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => setVoiceState(voiceState === 'playing' ? 'paused' : 'playing')}
                      className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"
                    >
                      {voiceState === 'playing' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 pl-0.5" />}
                    </button>
                    <div>
                      <p className="text-white text-[10px] font-bold uppercase tracking-wider">Voice Guidance Companion</p>
                      <p className="text-slate-500 text-[8px] uppercase">{voiceState === 'playing' ? 'Streaming live rescue tips' : 'Speaker offline'}</p>
                    </div>
                  </div>
                  {/* Mock animated soundwave bar */}
                  {voiceState === 'playing' ? (
                    <div className="flex gap-0.5 items-end h-4 pr-2">
                      <div className="w-0.5 h-2 bg-primary rounded animate-pulse" style={{ animationDelay: '100ms' }} />
                      <div className="w-0.5 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '300ms' }} />
                      <div className="w-0.5 h-3 bg-primary rounded animate-pulse" style={{ animationDelay: '200ms' }} />
                      <div className="w-0.5 h-1 bg-primary rounded animate-pulse" style={{ animationDelay: '400ms' }} />
                    </div>
                  ) : (
                    <span className="text-[8px] text-slate-500 font-bold uppercase pr-2">Muted</span>
                  )}
                </div>

                {/* Input area */}
                <div className="flex gap-2 items-end shrink-0">
                  <input
                    id="chat-input"
                    type="text"
                    placeholder="Ask the AI companion..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="input-glass flex-1 text-xs"
                  />
                  <button
                    id="send-btn"
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-red-600 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>

              </div>

              {/* Right Column: AI summary, Checklists, weather, and locations share */}
              <div className="col-span-12 md:col-span-5 flex flex-col gap-4 overflow-y-auto pr-1 scrollbar h-full mt-4 md:mt-0">
                
                {/* 1. Summary Card */}
                <div className="card p-4 border border-white/10 space-y-3 bg-red-950/5">
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">AI Emergency Summary</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">{currentCase.ai_analysis}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                    <div>
                      <span className="uppercase text-slate-500 font-bold block">Risk Rating</span>
                      <span className="text-red-400 font-bold mt-0.5 block">{currentCase.ai_severity === 'critical' ? 'CRITICAL EXPOSURE' : 'HIGH THREAT'}</span>
                    </div>
                    <div>
                      <span className="uppercase text-slate-500 font-bold block">ETA Response</span>
                      <span className="text-white font-bold mt-0.5 block">4 Minutes (Police)</span>
                    </div>
                  </div>
                </div>

                {/* 2. Interactive SOS Checklist */}
                <div className="card p-4 border border-white/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider">Rescue Safety Checklist</h4>
                    <span className="text-primary text-xs font-bold">{checklistPercent}% Done</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-dark-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${checklistPercent}%` }}
                    />
                  </div>
                  <div className="space-y-2 mt-2">
                    {[
                      'Stay calm and protect the child',
                      'Remain at coordinate coordinates',
                      'Confirm child welfare helpline dialed',
                      'Check local weather constraints',
                      'Identify cover from precipitation',
                      'Wait for responder vehicle arrival'
                    ].map((item, idx) => (
                      <label key={idx} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={checklist[idx]} 
                          onChange={() => handleToggleChecklist(idx)}
                          className="accent-primary rounded"
                        />
                        <span className={checklist[idx] ? 'line-through text-slate-500' : ''}>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 3. Dynamic AI Suggestions */}
                <div className="card p-4 border border-white/5 space-y-3 bg-dark-950/20">
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-primary" />
                    AI Safety Suggestions
                  </h4>
                  <ul className="space-y-2 text-[10px] text-slate-400">
                    <li className="flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      Avoid moving the child due to possible unseen trauma injuries.
                    </li>
                    <li className="flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      Keep the child dry under covered walkways to prevent exposure to heavy rain.
                    </li>
                    <li className="flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      Provide clean drinking water ONLY if child is conscious and safe.
                    </li>
                  </ul>
                </div>

                {/* 4. Weather telemetry */}
                <div className="card p-4 border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-xs font-bold">Rain Telemetry Context</span>
                    {weather.icon}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 border-b border-white/5 pb-2">
                    <span>Temp / Condition:</span>
                    <span className="text-white font-bold">{weather.temp} - {weather.condition}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 italic mt-1 leading-relaxed">
                    Advice: {weather.recommendation}
                  </p>
                </div>

                {/* 5. Emergency Contacts & Quick share */}
                <div className="card p-4 border border-white/5 space-y-3">
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Quick Action Hotline Hub</h4>
                  <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                    <a href="tel:1098" className="bg-primary/10 border border-primary/20 p-2.5 rounded-lg text-primary font-bold hover:bg-primary/20 transition-all uppercase">
                      📞 Call Helpline 1098
                    </a>
                    <a href="tel:112" className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-red-400 font-bold hover:bg-red-500/20 transition-all uppercase">
                      🚨 Call Emergency 112
                    </a>
                  </div>
                  <button 
                    onClick={() => alert("Live GPS sharing broadcast enabled for local responder grids...")}
                    className="w-full text-center py-2 bg-dark-800 border border-white/10 hover:border-white/20 rounded-lg text-white font-bold uppercase text-[9px]"
                  >
                    Share Live Location Coords
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: Live Tracking & Emergency Monitoring Dashboard */}
          {isTrackingView && currentCase && (
            <div className="flex-1 w-full max-w-7xl mx-auto px-5 py-6 flex flex-col md:grid md:grid-cols-12 md:gap-6 overflow-hidden relative z-10">
              
              {/* Left Column: Interactive GIS Telemetry Map & Quick Actions */}
              <div className="col-span-12 md:col-span-8 flex flex-col gap-5 overflow-hidden h-[400px] md:h-full">
                <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 relative card shadow-2xl min-h-[250px]">
                  <LiveMap
                    cases={[currentCase]}
                    selectedCase={currentCase}
                    onCaseSelect={() => {}}
                    showSearchZones={true}
                    activeDispatches={activeDispatches}
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-dark-800/40 border border-white/5 p-3 rounded-xl backdrop-blur-md">
                  <button onClick={() => setActiveTab('chat')} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white/5 transition-all text-slate-300 hover:text-white border border-transparent hover:border-white/5 gap-1 text-[9px] font-bold uppercase">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span>AI Guardian</span>
                  </button>
                  <a href={`tel:${mockAgencies[0].phone}`} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white/5 transition-all text-slate-300 hover:text-white border border-transparent hover:border-white/5 gap-1 text-[9px] font-bold uppercase">
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span>Call Medical</span>
                  </a>
                  <a href={`tel:${mockAgencies[1].phone}`} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white/5 transition-all text-slate-300 hover:text-white border border-transparent hover:border-white/5 gap-1 text-[9px] font-bold uppercase">
                    <Phone className="w-4 h-4 text-red-400" />
                    <span>Call Police</span>
                  </a>
                  <button onClick={() => setActiveTab('help')} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white/5 transition-all text-slate-300 hover:text-white border border-transparent hover:border-white/5 gap-1 text-[9px] font-bold uppercase">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    <span>Nearby Help</span>
                  </button>
                  <button onClick={() => alert('Seeking child safety guide and emergency first aid manuals...')} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white/5 transition-all text-slate-300 hover:text-white border border-transparent hover:border-white/5 gap-1 text-[9px] font-bold uppercase">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <span>Guidebook</span>
                  </button>
                  <button onClick={() => handleDownloadPDF(currentCase.id)} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white/5 transition-all text-slate-300 hover:text-white border border-transparent hover:border-white/5 gap-1 text-[9px] font-bold uppercase">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span>PDF Record</span>
                  </button>
                </div>
              </div>

              {/* Right Column */}
              <div className="col-span-12 md:col-span-4 flex flex-col gap-5 overflow-y-auto pr-1 scrollbar h-full">
                <div className="card p-4 border border-white/10 flex flex-col gap-2">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-1">
                    <span className="font-mono text-white text-xs font-bold">#{currentCase.id.slice(0, 10).toUpperCase()}</span>
                    <SeverityBadge severity={currentCase.ai_severity as any} />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-[10px] text-slate-400">
                    <div>
                      <p className="uppercase font-bold text-slate-500">AI Confidence</p>
                      <p className="text-white font-extrabold mt-0.5 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
                        {currentCase.ai_severity === 'critical' ? '94.2%' : '88.5%'}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase font-bold text-slate-500">Reported Time</p>
                      <p className="text-white mt-0.5">{new Date(currentCase.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px]">
                    <p className="uppercase font-bold text-slate-500">Location Address</p>
                    <p className="text-slate-300 mt-0.5 truncate">{currentCase.location.address}</p>
                  </div>
                </div>

                <div className="card p-4 border border-white/10 space-y-3 bg-red-950/10">
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary animate-pulse" />
                    AI Auto-Dispatch Panel
                  </h4>
                  <div className="bg-dark-900/60 p-3 rounded-lg border border-white/5 text-[10px] text-slate-300 space-y-2">
                    <p className="font-bold text-white">🏆 Selected Route Strategy:</p>
                    <p className="leading-relaxed">
                      "Guardian AI selected the fastest response team: {nearestVolunteer ? `${nearestVolunteer.name} (${getDistance(currentCase.location.lat, currentCase.location.lng, nearestVolunteer.lat, nearestVolunteer.lng)} km, ${formatCountdown(3)} ETA)` : 'Nearest Volunteer'} because they bypass vehicular blockages on motorbike."
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">AI Allocation Reasonings</p>
                    {[
                      { role: 'ambulance', label: 'Ambulance Selection', name: nearestHospital?.name || 'City General', dist: nearestHospital ? `${getDistance(currentCase.location.lat, currentCase.location.lng, nearestHospital.lat, nearestHospital.lng)} KM` : '2.4 KM', why: 'Nearest pediatric trauma unit with active life support beds.' },
                      { role: 'police', label: 'Precinct Selection', name: nearestPolice?.name || 'Local Patrol', dist: nearestPolice ? `${getDistance(currentCase.location.lat, currentCase.location.lng, nearestPolice.lat, nearestPolice.lng)} KM` : '1.2 KM', why: 'Closest mobile responder cruiser with regional jurisdiction.' },
                      { role: 'ngo', label: 'NGO Shelter Selection', name: nearestNGO?.name || 'Community Shelter', dist: nearestNGO ? `${getDistance(currentCase.location.lat, currentCase.location.lng, nearestNGO.lat, nearestNGO.lng)} KM` : '3.1 KM', why: 'Emergency shelter beds ready with trauma rehabilitation counselors.' }
                    ].map((alloc) => (
                      <div key={alloc.role} className="text-[10px] border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between font-bold text-white">
                          <span>📍 {alloc.label}</span>
                          <span>{alloc.dist}</span>
                        </div>
                        <p className="text-slate-400 text-[9px] mt-0.5">{alloc.name} - {alloc.why}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-4 border border-white/10 space-y-3 animate-pulse">
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-primary" />
                    Live Responder ETAs
                  </h4>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { role: 'Police', time: formatCountdown(4), color: 'text-red-400' },
                      { role: 'Medical', time: formatCountdown(6), color: 'text-blue-400' },
                      { role: 'Volunteer', time: formatCountdown(3), color: 'text-emerald-400' },
                      { role: 'NGO', time: formatCountdown(7), color: 'text-orange-400' }
                    ].map((eta) => (
                      <div key={eta.role} className="bg-dark-900/50 p-2 rounded-lg border border-white/5">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">{eta.role}</p>
                        <p className={`text-xs font-black mt-1 ${eta.color}`}>{eta.time}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-4 border border-white/10 space-y-3">
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Emergency Status</h4>
                  <div className="space-y-2">
                    {[
                      { label: '👮 Police Command', role: 'police' },
                      { label: '🚑 Hospital Triage', role: 'hospital' },
                      { label: '🛵 Volunteer Force', role: 'volunteer' },
                      { label: '🚐 NGO Welfare Team', role: 'ngo' },
                      { label: '🏢 Child Welfare Bureau', role: 'welfare' }
                    ].map((auth) => {
                      const details = getResponderStatus(auth.role)
                      return (
                        <div key={auth.role} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-slate-300 font-semibold">{auth.label}</span>
                          <span className={`uppercase ${details.color}`}>{details.status}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Fallback Mobile/Details Views for other Tabs */}
          {!isTrackingView && (
            <div className="flex-1 overflow-y-auto relative z-10 flex flex-col scrollbar max-w-7xl mx-auto px-5 py-6 w-full">
              
              {/* ── TAB 3: Nearby Help ── */}
              {activeTab === 'help' && currentCase && (
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nearby Rescue Units</h3>
                    <span className="text-[10px] text-slate-500">
                      {loadingAgencies ? 'Scanning local GIS...' : 'Verified Local GIS Information'}
                    </span>
                  </div>
                  {loadingAgencies ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-500 text-xs font-medium">Verifying real-world rescue units near coordinates...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {nearbyAgencies.map((agency, i) => {
                        const dist = getDistance(currentCase.location.lat, currentCase.location.lng, agency.latitude, agency.longitude)
                        return (
                          <div key={i} className="card-glass p-4 border border-white/5 flex justify-between items-center hover:border-white/10 transition-all animate-fade-in">
                            <div className="min-w-0 flex-1 pr-3">
                              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                agency.type === 'Hospital' ? 'bg-blue-500/20 text-blue-400' :
                                agency.type === 'Police Station' ? 'bg-red-500/20 text-red-400' :
                                'bg-orange-500/20 text-orange-400'
                              }`}>{agency.type}</span>
                              <h4 className="text-white text-xs font-bold mt-1.5 truncate">{agency.name}</h4>
                              <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">{agency.address}</p>
                              <p className="text-primary text-[10px] font-bold mt-1">📍 {dist.toFixed(2)} km away</p>
                            </div>
                            <a href={`tel:${agency.phone}`} className="w-10 h-10 rounded-xl bg-dark-800 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors flex-shrink-0">
                              <Phone className="w-4 h-4" />
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 4: Centralized Notifications Center ── */}
              {activeTab === 'notifications' && (
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Search alerts by Case ID or event..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-dark-800/60 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="flex-1 bg-dark-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Priorities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <button 
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-dark-800 border border-white/5 rounded-xl text-xs text-slate-300 hover:text-white"
                      >
                        <Filter className="w-3.5 h-3.5" />
                        Sort: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto pr-0.5 scrollbar">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        No notifications match filters
                      </div>
                    ) : (
                      filteredNotifications.map((n) => {
                        let badgeColor = 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        if (n.priority === 'critical') badgeColor = 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                        else if (n.priority === 'high') badgeColor = 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        else if (n.priority === 'medium') badgeColor = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'

                        return (
                          <div key={n.id} className="card-glass p-4 border border-white/5 flex flex-col gap-3 relative overflow-hidden">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${badgeColor}`}>
                                  {n.priority}
                                </span>
                                <h4 className="text-white text-xs font-bold mt-2">{n.title}</h4>
                                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">{n.body}</p>
                              </div>
                              <span className="text-[8px] text-slate-500 shrink-0 font-medium">
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="flex gap-2.5 border-t border-white/5 pt-2.5">
                              <button 
                                onClick={() => {
                                  setActiveTab('tracking')
                                  window.history.pushState({ path: `?case_id=${caseId}&tab=tracking` }, '', `?case_id=${caseId}&tab=tracking`)
                                }}
                                className="text-[9px] text-primary hover:underline font-bold uppercase tracking-wider"
                              >
                                Open Live Tracking
                              </button>
                              <button 
                                onClick={() => handleDownloadPDF(caseId)}
                                className="text-[9px] text-slate-400 hover:text-white hover:underline uppercase tracking-wider"
                              >
                                Download Report
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ── TAB 5: Reports History / Case Lifecycle Inspector ── */}
              {activeTab === 'my-reports' && (
                <div className="p-5 flex flex-col gap-4 flex-1">
                  {selectedHistoryCase ? (
                    <div className="space-y-5 animate-fade-in">
                      <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-2">
                        <button 
                          onClick={() => setSelectedHistoryCase(null)}
                          className="text-xs text-primary font-bold hover:underline"
                        >
                          ← Back to list
                        </button>
                        <span className="font-mono text-white text-xs font-bold">#{selectedHistoryCase.id.slice(0, 10).toUpperCase()}</span>
                      </div>

                      {/* Header Widget */}
                      <div className="card p-4 border border-white/10 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-xs">Current Status</span>
                          <span className="text-green-400 font-bold uppercase text-xs">{selectedHistoryCase.status}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>Priority Level: <strong className="text-white capitalize">{selectedHistoryCase.ai_severity}</strong></span>
                          <span>Active responder: <strong className="text-white">Ambulance #3</strong></span>
                        </div>
                      </div>

                      {/* Sub Tabs */}
                      <div className="flex bg-dark-950/60 border border-white/5 p-1 rounded-xl shrink-0">
                        <button
                          onClick={() => setHistoryCaseSubTab('details')}
                          className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                            historyCaseSubTab === 'details'
                              ? 'bg-primary text-white'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          📋 Case Logs & Actions
                        </button>
                        <button
                          onClick={() => setHistoryCaseSubTab('vision')}
                          className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                            historyCaseSubTab === 'vision'
                              ? 'bg-primary text-white'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          👁️ AI Vision Analysis 2.0
                        </button>
                      </div>

                      {historyCaseSubTab === 'details' ? (
                        <div className="space-y-4">
                          <div className="card p-4 border border-white/5 space-y-3">
                            <h4 className="text-white font-bold text-xs uppercase tracking-wider">AI Rescue Assessment</h4>
                            <p className="text-slate-300 text-xs leading-relaxed">{selectedHistoryCase.ai_analysis}</p>
                            <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3 mt-2 text-[10px] text-slate-400">
                              <div>
                                <p className="uppercase font-bold text-slate-500">Confidence Score</p>
                                <p className="text-white font-bold mt-0.5">94.2% Rating</p>
                              </div>
                              <div>
                                <p className="uppercase font-bold text-slate-500">Local Address</p>
                                <p className="text-white font-bold mt-0.5 truncate">{selectedHistoryCase.location.address}</p>
                              </div>
                            </div>
                          </div>

                          {/* Incident Replay Control HUD */}
                          <div className="card p-4 border border-white/10 space-y-3 bg-red-950/10">
                            <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                              <RotateCcw className="w-3.5 h-3.5 text-primary" />
                              Incident Playback Replay
                            </h4>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setIsReplaying(!isReplaying)}
                                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white"
                              >
                                {isReplaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 pl-0.5" />}
                              </button>
                              <button
                                onClick={() => {
                                  setIsReplaying(false)
                                  setReplayStep(0)
                                  setTimelineStep(1)
                                }}
                                className="w-8 h-8 rounded-full bg-dark-800 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <div className="flex-1 h-1.5 bg-dark-900 rounded-full overflow-hidden relative">
                                <div 
                                  className="absolute left-0 top-0 bottom-0 bg-primary transition-all duration-300"
                                  style={{ width: `${(replayStep / 8) * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">Step {replayStep}/8</span>
                            </div>
                            <p className="text-[9px] text-slate-500">Hackathon demo controller: plays back the response timeline changes live.</p>
                          </div>

                          {/* Stepper Timeline */}
                          <div className="card p-4 border border-white/5 space-y-3">
                            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Rescue Stepper</h4>
                            <div className="relative border-l border-white/5 pl-4 ml-2.5 space-y-3 text-[10px]">
                              {[
                                { step: 1, label: 'Report Logged' },
                                { step: 1, label: 'AI Risk Graded' },
                                { step: 2, label: 'Emergency Center Alerts Dispatched' },
                                { step: 3, label: 'Hospital Triage Dispatched Unit' },
                                { step: 4, label: 'Adyar Precinct Cruiser Mobilized' },
                                { step: 5, label: 'Welfare volunteer Mobile Toggled' },
                                { step: 6, label: 'Responder Fleet En Route' },
                                { step: 7, label: 'Responder Teams Arrived at Scene' },
                                { step: 8, label: 'Child Secured & Case Archived' }
                              ].map((s, idx) => (
                                <div key={idx} className="relative">
                                  <div className={`absolute -left-7 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${
                                    timelineStep >= s.step
                                      ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                      : 'bg-dark-700 border-white/5 text-slate-600'
                                  }`}>
                                    {timelineStep >= s.step ? <CheckCircle className="w-2.5 h-2.5" /> : <div className="w-1 h-1 rounded-full bg-slate-600" />}
                                  </div>
                                  <p className={`font-bold ${timelineStep >= s.step ? 'text-white' : 'text-slate-500'}`}>{s.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Authority Logs */}
                          <div className="card p-4 border border-white/5 space-y-3">
                            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Authority Activity Logs</h4>
                            <div className="space-y-2.5 text-[10px]">
                              {[
                                { agency: '🚑 Pediatric Hospital', log: 'Accepted case. Dispatching Ambulance Unit #3.' },
                                { agency: '🚓 Precinct Police', log: 'Officer assigned. Reached destination coordinates.' },
                                { agency: '🛵 Active Volunteer', log: 'Volunteer accepted coordination task.' },
                                { agency: '🏢 Child Welfare Bureau', log: 'Case coordinator assigned. Intake logs prepared.' }
                              ].map((logItem, idx) => (
                                <div key={idx} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                  <p className="font-bold text-white">{logItem.agency}</p>
                                  <p className="text-slate-400 mt-0.5">{logItem.log}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Case Analytics */}
                          <div className="card p-4 border border-white/10 space-y-3">
                            <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                              <BarChart2 className="w-3.5 h-3.5 text-primary" />
                              Response Analytics
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                              <div className="bg-dark-900/50 p-2.5 rounded-lg border border-white/5">
                                <span className="text-slate-500 font-bold uppercase block">AI Threat Accuracy</span>
                                <span className="text-white text-base font-black mt-1 block">96.8%</span>
                              </div>
                              <div className="bg-dark-900/50 p-2.5 rounded-lg border border-white/5">
                                <span className="text-slate-500 font-bold uppercase block">Response Mobilize</span>
                                <span className="text-white text-base font-black mt-1 block">1.8 Mins</span>
                              </div>
                              <div className="bg-dark-900/50 p-2.5 rounded-lg border border-white/5">
                                <span className="text-slate-500 font-bold uppercase block">Transit Speed</span>
                                <span className="text-white text-base font-black mt-1 block">4.2 Mins</span>
                              </div>
                              <div className="bg-dark-900/50 p-2.5 rounded-lg border border-white/5">
                                <span className="text-slate-500 font-bold uppercase block">Total Duration</span>
                                <span className="text-white text-base font-black mt-1 block">12.8 Mins</span>
                              </div>
                            </div>
                          </div>

                          {/* Documents panel */}
                          <div className="card p-4 border border-white/5 space-y-3">
                            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Rescue Archive Documentation</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { doc: 'AI Analysis Case Report', category: 'AI' },
                                { doc: 'Medical Triage Summary', category: 'Hospital' },
                                { doc: 'Precinct Dispatch Record', category: 'Police' },
                                { doc: 'Welfare Intake Form', category: 'Welfare' }
                              ].map((d, idx) => (
                                <div key={idx} className="bg-dark-900/60 p-2 rounded-lg border border-white/5 text-[9px] space-y-1.5">
                                  <p className="text-white font-bold truncate">{d.doc}</p>
                                  <div className="flex gap-1">
                                    <button onClick={() => alert(`Previewing ${d.doc}...`)} className="text-primary font-bold uppercase hover:underline">Preview</button>
                                    <span className="text-slate-600">|</span>
                                    <button onClick={() => handleDownloadPDF(selectedHistoryCase.id)} className="text-slate-400 hover:text-white uppercase hover:underline">PDF</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 animate-fade-in">
                          {(() => {
                            const vision = getVisionData(selectedHistoryCase)
                            return (
                              <>
                                {/* AI Summary Card */}
                                <div className="card p-4 border border-white/5 space-y-2 bg-dark-900/50">
                                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Guardian AI vision summary</h4>
                                  <p className="text-slate-300 text-xs leading-relaxed">{vision.assessment}</p>
                                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-400">
                                    <div>
                                      <span className="uppercase text-slate-500 font-bold block">Age / Gender</span>
                                      <span className="text-white font-bold mt-0.5 block">{vision.age} / {vision.gender}</span>
                                    </div>
                                    <div>
                                      <span className="uppercase text-slate-500 font-bold block">Visible Condition</span>
                                      <span className="text-white font-bold mt-0.5 block truncate">{vision.condition}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Circular Confidence Gauge */}
                                <div className="card p-4 border border-white/5 flex items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <h4 className="text-white font-bold text-xs uppercase tracking-wider">AI Confidence Score</h4>
                                    <p className="text-slate-400 text-[10px] mt-1">Scan matches and threat model classification accuracy.</p>
                                  </div>
                                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#e2e8f0" strokeWidth="4" />
                                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray="175.9" strokeDashoffset={`${175.9 * (1 - vision.confidence / 100)}`} />
                                    </svg>
                                    <span className="absolute text-white font-black text-xs font-mono">{vision.confidence}%</span>
                                  </div>
                                </div>

                                {/* Risk Meter */}
                                <div className="card p-4 border border-white/5 space-y-2">
                                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Risk Level Indicator</h4>
                                  <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-dark-950 p-0.5 border border-white/5">
                                    <div className={`flex-1 rounded-full transition-all duration-500 ${vision.severity === 'low' ? 'bg-green-500' : 'bg-dark-800'}`} />
                                    <div className={`flex-1 rounded-full transition-all duration-500 ${vision.severity === 'medium' ? 'bg-yellow-500' : 'bg-dark-800'}`} />
                                    <div className={`flex-1 rounded-full transition-all duration-500 ${vision.severity === 'high' ? 'bg-orange-500' : 'bg-dark-800'}`} />
                                    <div className={`flex-1 rounded-full transition-all duration-500 ${vision.severity === 'critical' ? 'bg-red-500' : 'bg-dark-800'}`} />
                                  </div>
                                  <div className="flex justify-between text-[8px] text-slate-500 uppercase font-black tracking-wider">
                                    <span className="text-green-500">Low</span>
                                    <span className="text-yellow-500">Medium</span>
                                    <span className="text-orange-500">High</span>
                                    <span className="text-red-500">Critical</span>
                                  </div>
                                </div>

                                {/* Possible Injury Detection */}
                                <div className="card p-4 border border-white/5 space-y-2">
                                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Injury Detection Probability</h4>
                                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    {[
                                      { name: 'Head Injury', prob: vision.injuries.includes('Head Injury') ? '92%' : '8%' },
                                      { name: 'Bleeding', prob: vision.blood_detected ? '88%' : '5%' },
                                      { name: 'Fracture', prob: vision.injuries.includes('Fracture') ? '85%' : '12%' },
                                      { name: 'Dehydration', prob: '94%' },
                                      { name: 'Exposure/Hypothermia', prob: vision.weather_exposure === 'High' ? '96%' : '40%' }
                                    ].map((inj) => (
                                      <div key={inj.name} className="bg-dark-900/50 p-2 rounded-lg border border-white/5 flex justify-between items-center">
                                        <span className="text-slate-400">{inj.name}</span>
                                        <span className={`font-bold ${parseFloat(inj.prob) > 50 ? 'text-red-400 font-extrabold' : 'text-slate-500'}`}>{inj.prob}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Environmental Analysis */}
                                <div className="card p-4 border border-white/5 space-y-3">
                                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Environmental Analysis</h4>
                                  <div className="flex justify-between text-[10px] text-slate-400 border-b border-white/5 pb-2">
                                    <span>Primary Environment:</span>
                                    <span className="text-white font-bold">Public Roadside (High Exposure)</span>
                                  </div>
                                  <div className="flex justify-between text-[10px] text-slate-400 border-b border-white/5 pb-2">
                                    <span>Weather Exposure:</span>
                                    <span className="text-blue-400 font-bold">High (Heavy Rain context)</span>
                                  </div>
                                  <div className="space-y-1.5 pt-1">
                                    <span className="text-[8px] text-slate-500 font-bold uppercase block">Detected Environmental Hazards</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {vision.hazards.map((h: string) => (
                                        <span key={h} className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">
                                          ⚠️ {h}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Object Detection */}
                                <div className="card p-4 border border-white/5 space-y-2.5">
                                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">AI Object Detection Scan</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {vision.objects_detected.map((obj: string) => (
                                      <span key={obj} className="text-[9px] bg-dark-800 border border-white/5 px-2.5 py-1 rounded text-slate-300">
                                        📦 {obj}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Authority Recommendations */}
                                <div className="card p-4 border border-white/5 space-y-3">
                                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Authority Dispatch Strategy</h4>
                                  <div className="space-y-2.5 text-[10px]">
                                    {[
                                      { agency: '🚑 Hospital dispatch', why: 'Pediatric dehydration risk detected. High rainfall exposure warrants physical exam.' },
                                      { agency: '🚓 Police Patrol', why: 'Vulnerable roadside minor. Security protocol triggered.' },
                                      { agency: ' volunteers notified', why: 'Fastest responder coordinates to secure scene safety.' }
                                    ].map((rec, idx) => (
                                      <div key={idx} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                        <p className="font-bold text-white">🏆 Recommendation: {rec.agency}</p>
                                        <p className="text-slate-400 mt-0.5">{rec.why}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Emergency recommendations checklist */}
                                <div className="card p-4 border border-white/5 space-y-3">
                                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Emergency Action Protocol</h4>
                                  <div className="relative border-l border-white/5 pl-4 ml-2.5 space-y-3 text-[10px] text-slate-400">
                                    {[
                                      { label: 'Immediately notify regional pediatric triage' },
                                      { label: 'Confirm local cruiser en route' },
                                      { label: 'Do not move the child to avoid spinal trauma' },
                                      { label: 'Protect child from rainfall exposure' }
                                    ].map((step, idx) => (
                                      <div key={idx} className="relative">
                                        <div className="absolute -left-7 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border bg-primary/10 border-primary/30 text-primary">
                                          <CheckCircle className="w-3 h-3" />
                                        </div>
                                        <p className="font-bold text-slate-200">{step.label}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Vision Timeline */}
                                <div className="card p-4 border border-white/5 space-y-3">
                                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Vision processing pipeline</h4>
                                  <div className="relative border-l border-white/5 pl-4 ml-2.5 space-y-3.5 text-[10px]">
                                    {[
                                      { label: 'Image Uploaded & Buffered', desc: 'Secure payload buffered in API.' },
                                      { label: 'Gemini Analysis Triggered', desc: 'Vision pipeline call initialized.' },
                                      { label: 'Risk Metrics Classified', desc: 'Severity graded as CRITICAL.' },
                                      { label: 'Recommendations Finalized', desc: 'Responders notified with triage strategies.' }
                                    ].map((step, idx) => (
                                      <div key={idx} className="relative">
                                        <div className="absolute -left-7 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border bg-green-500/20 border-green-500/40 text-green-400 animate-pulse">
                                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                        </div>
                                        <p className="font-bold text-white">{step.label}</p>
                                        <p className="text-slate-500 text-[9px]">{step.desc}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Comparison Panel */}
                                {selectedHistoryCase.evidence && selectedHistoryCase.evidence.length > 1 && (
                                  <div className="card p-4 border border-white/10 space-y-3 bg-primary/5">
                                    <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                                      <Info className="w-3.5 h-3.5 text-primary" />
                                      Multi-Image Scan Comparison
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {selectedHistoryCase.evidence.map((img: any, idx: number) => (
                                        <div key={idx} className="relative rounded-lg overflow-hidden border border-white/5 h-20 bg-dark-800">
                                          <img src={img.file_url} className="w-full h-full object-cover" />
                                          <span className="absolute bottom-1 left-1 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">Image {idx + 1}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <p className="text-slate-400 text-[9px] leading-relaxed">
                                      AI Delta Scan: "A comparison between Image 1 and Image 2 shows child has shifted posture. Cry intensity remains high. Rescue route parameters synchronized."
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
                    /* My Reports list view with Search and filters */
                    <>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reports History</h3>
                      
                      {/* Search & Filters */}
                      <div className="flex flex-col gap-2.5">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            type="text" 
                            placeholder="Search by Case ID or address..."
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                            className="w-full bg-dark-800/60 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                          />
                        </div>
                        <select
                          value={historyFilter}
                          onChange={(e) => setHistoryFilter(e.target.value)}
                          className="bg-dark-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="all">All Incidents</option>
                          <option value="active">Active Rescues</option>
                          <option value="critical">Critical Severity</option>
                          <option value="completed">Completed / Safe</option>
                          <option value="hospital">Hospital Dispatched</option>
                          <option value="police">Police Mobilized</option>
                          <option value="volunteer">Volunteer Mobilized</option>
                          <option value="ngo">NGO Mobilized</option>
                        </select>
                      </div>

                      {/* List Feed */}
                      <div className="space-y-3 overflow-y-auto max-h-[500px] pr-0.5 scrollbar">
                        {filteredHistoryReports.length === 0 ? (
                          <p className="text-slate-500 py-6 text-center text-xs">No reports recorded</p>
                        ) : (
                          filteredHistoryReports.map((c) => (
                            <div key={c.id} className={`card-glass p-4 border transition-all flex flex-col gap-3 ${
                              c.id === caseId ? 'border-primary/40 bg-primary/5' : 'border-white/5 hover:border-white/10'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                  <p className="font-mono text-white text-xs font-bold mb-0.5">#{c.id.slice(0, 8).toUpperCase()}</p>
                                  <p className="text-slate-400 text-[10px] truncate max-w-[500px] md:max-w-none">{c.location.address}</p>
                                  <p className="text-slate-300 text-[9px] mt-1 line-clamp-2 leading-relaxed">AI Summary: {c.ai_analysis.slice(0, 80)}...</p>
                                  <p className="text-slate-500 text-[9px] mt-1.5">{new Date(c.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${
                                    c.status === 'reported' ? 'bg-blue-500/20 text-blue-400' :
                                    c.status === 'dispatched' ? 'bg-orange-500/20 text-orange-400 animate-pulse' :
                                    'bg-green-500/20 text-green-400'
                                  }`}>{c.status}</span>
                                  <SeverityBadge severity={c.ai_severity as any} />
                                </div>
                              </div>

                              {/* Card Actions Row */}
                              <div className="flex gap-2.5 border-t border-white/5 pt-2.5 text-[9px] font-bold uppercase tracking-wider">
                                <button 
                                  onClick={() => setSelectedHistoryCase(c)}
                                  className="text-primary hover:underline"
                                >
                                  View Case
                                </button>
                                <button 
                                  onClick={() => {
                                    setActiveTab('tracking')
                                    window.history.pushState({ path: `?case_id=${c.id}&tab=tracking` }, '', `?case_id=${c.id}&tab=tracking`)
                                  }}
                                  className="text-slate-300 hover:text-white hover:underline"
                                >
                                  Open Tracking
                                </button>
                                <button 
                                  onClick={() => {
                                    setActiveTab('chat')
                                    window.history.pushState({ path: `?case_id=${c.id}&tab=chat` }, '', `?case_id=${c.id}&tab=chat`)
                                  }}
                                  className="text-slate-300 hover:text-white hover:underline"
                                >
                                  Open Companion
                                </button>
                                <button 
                                  onClick={() => handleDownloadPDF(c.id)}
                                  className="text-slate-400 hover:text-white hover:underline ml-auto"
                                >
                                  Download PDF
                                </button>
                              </div>

                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          )}
        </>
      )}
    </div>
  )
}
