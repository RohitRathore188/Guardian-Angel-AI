import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Case } from '../lib/mockData'
import { getMapConfig } from '../config/maps'
import * as Icons from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

// Coordinate distance utility
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

// Generate Responders with realistic locations around center
export const generateMockResponders = (centerLat: number, centerLng: number) => {
  const responders: any[] = []
  let seed = centerLat + centerLng
  const random = () => {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  const adjustInland = (lat: number, lng: number, offsetLng: number) => {
    if (lat > 12.8 && lat < 13.3 && lng > 80.1 && lng < 80.4) {
      const coastLine = 80.275 + (lat - 13.0827) * 0.08
      if (lng > coastLine) {
        return centerLng - Math.abs(offsetLng)
      }
    }
    return lng
  }

  // 20 Hospitals
  for (let i = 1; i <= 20; i++) {
    const offsetLat = (random() - 0.5) * 0.06
    const offsetLng = (random() - 0.5) * 0.06
    const lat = centerLat + offsetLat
    const lng = adjustInland(lat, centerLng + offsetLng, offsetLng)
    responders.push({
      id: `hosp-${i}`,
      name: `City Hospital Center #${i}`,
      type: 'Hospital',
      lat,
      lng,
      phone: `+91 44 9110 88${i < 10 ? '0' : ''}${i}`,
      availability: i % 4 === 0 ? 'Busy' : 'Available',
    })
  }

  // 15 Police Units
  for (let i = 1; i <= 15; i++) {
    const offsetLat = (random() - 0.5) * 0.06
    const offsetLng = (random() - 0.5) * 0.06
    const lat = centerLat + offsetLat
    const lng = adjustInland(lat, centerLng + offsetLng, offsetLng)
    responders.push({
      id: `pol-${i}`,
      name: `Precinct Unit #${i}`,
      type: 'Police Station',
      lat,
      lng,
      phone: `+91 44 9110 77${i < 10 ? '0' : ''}${i}`,
      availability: i % 5 === 0 ? 'Busy' : 'Available',
    })
  }

  // 25 Volunteers
  for (let i = 1; i <= 25; i++) {
    const offsetLat = (random() - 0.5) * 0.05
    const offsetLng = (random() - 0.5) * 0.05
    const lat = centerLat + offsetLat
    const lng = adjustInland(lat, centerLng + offsetLng, offsetLng)
    responders.push({
      id: `vol-${i}`,
      name: `Volunteer Squad ${String.fromCharCode(65 + i)}`,
      type: 'Volunteer',
      lat,
      lng,
      phone: `+91 99000 88${i < 10 ? '0' : ''}${i}`,
      availability: i % 6 === 0 ? 'Offline' : 'Available',
    })
  }

  // 10 NGOs
  for (let i = 1; i <= 10; i++) {
    const offsetLat = (random() - 0.5) * 0.06
    const offsetLng = (random() - 0.5) * 0.06
    const lat = centerLat + offsetLat
    const lng = adjustInland(lat, centerLng + offsetLng, offsetLng)
    responders.push({
      id: `ngo-${i}`,
      name: `NGO Aid Placement #${i}`,
      type: 'NGO Shelter',
      lat,
      lng,
      phone: `+91 44 9110 55${i < 10 ? '0' : ''}${i}`,
      availability: 'Available',
    })
  }

  // 8 Shelters
  for (let i = 1; i <= 8; i++) {
    const offsetLat = (random() - 0.5) * 0.06
    const offsetLng = (random() - 0.5) * 0.06
    const lat = centerLat + offsetLat
    const lng = adjustInland(lat, centerLng + offsetLng, offsetLng)
    responders.push({
      id: `shelter-${i}`,
      name: `Safehouse Sanctuary #${i}`,
      type: 'Shelter',
      lat,
      lng,
      phone: `+91 44 9110 33${i < 10 ? '0' : ''}${i}`,
      availability: 'Available',
    })
  }

  return responders
}

// Premium animated HTML DivIcons
const createPremiumIcon = (color: string, emoji: string, glowClass: string) =>
  L.divIcon({
    className: '',
    html: `
      <div class="premium-gis-marker ${glowClass}" style="
        display: flex; align-items: center; justify-content: center;
        width: 34px; height: 34px;
        background: #0a0a0f;
        border: 2px solid ${color};
        border-radius: 50%;
        box-shadow: 0 0 10px ${color}80;
        position: relative;
      ">
        <span style="font-size: 16px; z-index: 2;">${emoji}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })

const gisIcons = {
  Emergency: createPremiumIcon('#ef4444', '👶', 'gis-strobe'),
  Police: createPremiumIcon('#ef4444', '🚓', 'gis-pulse-red'),
  Hospital: createPremiumIcon('#3b82f6', '🏥', 'gis-pulse-blue'),
  Volunteer: createPremiumIcon('#10b981', '🛵', 'gis-pulse-green'),
  NGO: createPremiumIcon('#f97316', '🚐', 'gis-pulse-orange'),
  Shelter: createPremiumIcon('#f5a623', '⛺', 'gis-pulse-orange'),
  ChildWelfare: createPremiumIcon('#8b5cf6', '🏢', 'gis-pulse-purple'),
  AI: createPremiumIcon('#8b5cf6', '🧠', 'gis-pulse-purple'),
  Drone: createPremiumIcon('#a855f7', '🛸', 'gis-pulse-purple'),
}

// Flyer Map Controller
function MapControlsHandler({
  centerCoords,
  fitBoundsTrigger,
  bounds,
}: {
  centerCoords: [number, number] | null
  fitBoundsTrigger: number
  bounds: [number, number][] | null
}) {
  const map = useMap()

  useEffect(() => {
    if (centerCoords) {
      map.flyTo(centerCoords, 14, { duration: 1.2 })
    }
  }, [centerCoords, map])

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], duration: 1.5 })
    }
  }, [fitBoundsTrigger, bounds, map])

  return null
}

function getChildName(caseId: string) {
  const hash = caseId.split('-')[1] || '1001';
  const names: Record<string, string> = {
    '1001': 'Aryan Dev',
    '1002': 'Kiara Sen',
    '1003': 'Kabir Rathore',
    '1004': 'Ananya Roy',
    '1005': 'Rahul Sharma',
    '1006': 'Priya Das'
  };
  return names[hash] || `Child #${caseId.slice(-4).toUpperCase()}`;
}

function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click: (e) => {
      const target = e.originalEvent.target as HTMLElement;
      if (target.classList.contains('leaflet-container') || target.classList.contains('leaflet-grab')) {
        onMapClick();
      }
    }
  });
  return null;
}

interface LiveMapProps {
  cases: Case[]
  selectedCase: Case | null
  onCaseSelect: (c: Case | null) => void
  showHeatmap?: boolean
  showTraffic?: boolean
  showSearchZones?: boolean
  activeDispatches?: Record<string, any>
  role?: string
}

export default function LiveMap({
  cases,
  selectedCase,
  onCaseSelect,
  showHeatmap = false,
  showTraffic = false,
  showSearchZones = true,
  activeDispatches = {},
  role = 'admin',
}: LiveMapProps) {
  const { triggerToast } = useNotifications()
  const mapConfig = getMapConfig(role)

  const [selectedRadius, setSelectedRadius] = useState<number>(mapConfig.defaultRadius)
  const [toggleRadius, setToggleRadius] = useState<boolean>(mapConfig.showControls.radiusToggle)
  const [toggleRoutes, setToggleRoutes] = useState<boolean>(true)
  const [toggleDrone, setToggleDrone] = useState<boolean>(true)
  const [mapStyle, setMapStyle] = useState<'dark' | 'streets' | 'satellite'>('dark')
  const [centerTarget, setCenterTarget] = useState<[number, number] | null>(null)
  const [boundsList, setBoundsList] = useState<[number, number][] | null>(null)
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Single-path routing states
  const [selectedRoute, setSelectedRoute] = useState<[number, number][]>([])
  const [routeCache, setRouteCache] = useState<Record<string, [number, number][]>>({})
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false)

  // Fly to selected case when chosen
  useEffect(() => {
    if (selectedCase) {
      setCenterTarget([selectedCase.location.lat, selectedCase.location.lng])
    }
  }, [selectedCase])

  const [hasFitInitialBounds, setHasFitInitialBounds] = useState(false)

  // Fit map bounds to show all active cases on load only once
  useEffect(() => {
    if (cases.length > 0 && !hasFitInitialBounds) {
      const activeCoords = cases
        .filter((c) => c.location && c.location.lat !== 0)
        .map((c) => [c.location.lat, c.location.lng] as [number, number])
      if (activeCoords.length > 0) {
        setBoundsList(activeCoords)
        setFitBoundsTrigger((prev) => prev + 1)
        setHasFitInitialBounds(true)
      }
    }
  }, [cases, hasFitInitialBounds])

  const [routeProgress, setRouteProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setRouteProgress((prev) => (prev + 1) % 100)
    }, 400)
    return () => clearInterval(interval)
  }, [])

  const getProgressCoordinate = (route: [number, number][], progressPercent: number): [number, number] | null => {
    if (!route || route.length === 0) return null
    const index = Math.floor((progressPercent / 100) * route.length)
    return route[Math.min(index, route.length - 1)]
  }

  const [gpsLocation, setGpsLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation([pos.coords.latitude, pos.coords.longitude])
        },
        () => console.warn('No GPS coords available for map center')
      )
    }
  }, [])

  // Dynamic Priority Centering Logic
  const getDynamicCenter = (): [number, number] => {
    // 1. Selected Incident
    if (selectedCase) {
      return [selectedCase.location.lat, selectedCase.location.lng]
    }
    // 2. Live GPS Location
    if (gpsLocation) {
      return gpsLocation
    }
    // 3. Reported Case Location
    if (cases.length > 0) {
      const activeCases = cases.filter(c => c.status !== 'closed')
      if (activeCases.length > 0) {
        return [activeCases[0].location.lat, activeCases[0].location.lng]
      }
      return [cases[0].location.lat, cases[0].location.lng]
    }
    // 4. Default India Center
    return [20.5937, 78.9629]
  }

  const defaultCenter = getDynamicCenter()
  const defaultZoom = cases.length > 0 ? 11 : 5

  useEffect(() => {
    console.log('[GIS AUDIT LOGS]', {
      currentMapCenter: defaultCenter,
      currentIncident: selectedCase,
      currentGPS: gpsLocation,
      currentSearchResult: centerTarget,
      currentBounds: boundsList
    })
  }, [defaultCenter, selectedCase, gpsLocation, centerTarget, boundsList])

  // Generate responders list around center
  const respondersList = selectedCase
    ? generateMockResponders(selectedCase.location.lat, selectedCase.location.lng)
    : generateMockResponders(defaultCenter[0], defaultCenter[1])

  // Filter visible responders based on radius and role configs
  const visibleResponders = respondersList.filter((resp) => {
    // Distance filter if a case is selected
    if (selectedCase) {
      const dist = getDistance(selectedCase.location.lat, selectedCase.location.lng, resp.lat, resp.lng)
      if (dist > selectedRadius) return false
    }

    // Role layer filter checks
    if (role !== 'admin') {
      if (resp.type === 'Hospital' && !mapConfig.visibleLayers.includes('hospitals')) return false
      if (resp.type === 'Police Station' && !mapConfig.visibleLayers.includes('police')) return false
      if (resp.type === 'Volunteer' && !mapConfig.visibleLayers.includes('volunteers')) return false
      if (resp.type === 'NGO Shelter' && !mapConfig.visibleLayers.includes('ngos')) return false
      if (resp.type === 'Shelter' && !mapConfig.visibleLayers.includes('shelters')) return false
    }
    return true
  })

  // Single-path cached OSRM Route logic
  const getAssignedAuthority = () => {
    if (!selectedCase) return null
    const authorityType = selectedCase.ai_severity === 'critical'
      ? 'Hospital'
      : selectedCase.ai_severity === 'high'
      ? 'Police Station'
      : 'Volunteer'
    const list = visibleResponders.filter((r) => r.type === authorityType && r.availability === 'Available')
    return list.length > 0 ? list[0] : null
  }

  const assignedAuthority = getAssignedAuthority()

  const fetchRoute = async (start: [number, number], end: [number, number], setRoute: (r: [number, number][]) => void) => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`)
      const data = await res.json()
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number])
        setRoute(coords)
      } else {
        setRoute([start, end])
      }
    } catch {
      setRoute([start, end])
    }
  }

  useEffect(() => {
    if (selectedCase && assignedAuthority) {
      const cacheKey = `${assignedAuthority.id}-${selectedCase.id}`
      if (routeCache[cacheKey]) {
        setSelectedRoute(routeCache[cacheKey])
      } else {
        setLoadingRoute(true)
        const start: [number, number] = [assignedAuthority.lat, assignedAuthority.lng]
        const end: [number, number] = [selectedCase.location.lat, selectedCase.location.lng]
        fetchRoute(start, end, (coords) => {
          setRouteCache((prev) => ({ ...prev, [cacheKey]: coords }))
          setSelectedRoute(coords)
          setLoadingRoute(false)
        })
      }
    } else {
      setSelectedRoute([])
    }
  }, [selectedCase?.id, assignedAuthority?.id])

  const handleCenterOnChild = () => {
    if (selectedCase) {
      setCenterTarget([selectedCase.location.lat, selectedCase.location.lng])
      setTimeout(() => setCenterTarget(null), 500)
    }
  }

  const handleCenterOnResponders = () => {
    if (selectedCase) {
      const bounds: [number, number][] = [[selectedCase.location.lat, selectedCase.location.lng]]
      visibleResponders.forEach((r) => bounds.push([r.lat, r.lng]))
      setBoundsList(bounds)
      setFitBoundsTrigger((prev) => prev + 1)
    }
  }

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const query = searchQuery.toLowerCase()

    // 1. Check Cases
    const matchCase = cases.find(
      (c) => c.id.toLowerCase().includes(query) || c.location.address.toLowerCase().includes(query)
    )
    if (matchCase) {
      onCaseSelect(matchCase)
      setCenterTarget([matchCase.location.lat, matchCase.location.lng])
      return
    }

    // 2. Check Responders
    const matchResp = respondersList.find(
      (r) => r.name.toLowerCase().includes(query) || r.type.toLowerCase().includes(query)
    )
    if (matchResp) {
      setCenterTarget([matchResp.lat, matchResp.lng])
      return
    }

    // 3. Fallback: Query Nominatim Geocoding API for real-time address geocoding
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      const data = await res.json()
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        setCenterTarget([lat, lon])
        return
      }
    } catch (err) {
      console.warn('Geocoding search failed:', err)
    }

    triggerToast('Search Failed', 'No matching GIS assets, incidents, or locations found.', 'warning')
  }

  const getRescueInfoDetails = () => {
    if (!selectedCase) return null;
    
    const authorityType = selectedCase.ai_severity === 'critical'
      ? 'Hospital'
      : selectedCase.ai_severity === 'high'
      ? 'Police Station'
      : 'Volunteer';
      
    const responders = generateMockResponders(selectedCase.location.lat, selectedCase.location.lng);
    const list = responders.filter((r) => r.type === authorityType && r.availability === 'Available');
    const assigned = list.length > 0 ? list[0] : null;
    
    const childName = getChildName(selectedCase.id);
    const distance = assigned ? getDistance(selectedCase.location.lat, selectedCase.location.lng, assigned.lat, assigned.lng) : 1.8;
    
    const vehicleId = selectedCase.ai_severity === 'critical'
      ? 'AMB-904'
      : selectedCase.ai_severity === 'high'
      ? 'PCR-412'
      : 'VOL-704';
      
    const startTime = new Date(selectedCase.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const etaMinutes = Math.max(2, Math.round(distance * 3));
    const arrivalTime = selectedCase.status === 'rescued' || selectedCase.status === 'closed'
      ? 'Arrived (10m ago)'
      : `Pending (ETA ${etaMinutes}m)`;
      
    return {
      childId: selectedCase.id,
      childName,
      status: selectedCase.status,
      severity: selectedCase.ai_severity,
      authorityName: assigned ? assigned.name : 'Emergency Unit',
      authorityType,
      vehicleId,
      startTime,
      arrivalTime,
      distance: loadingRoute ? 'Calculating...' : `${distance} KM`,
      responseTime: loadingRoute ? 'Calculating...' : `${etaMinutes + 4} mins`
    };
  }

  return (
    <div className="w-full h-full relative">
      <style>{`
        @keyframes strobe-flash {
          0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.6); }
          50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.95); border-color: #ef4444; }
        }
        @keyframes pulse-blue-flash {
          0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.6); }
          50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.95); border-color: #3b82f6; }
        }
        @keyframes pulse-green-flash {
          0%, 100% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.6); }
          50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.95); border-color: #10b981; }
        }
        @keyframes pulse-orange-flash {
          0%, 100% { box-shadow: 0 0 10px rgba(249, 115, 22, 0.6); }
          50% { box-shadow: 0 0 25px rgba(249, 115, 22, 0.95); border-color: #f97316; }
        }
        .gis-strobe { animation: strobe-flash 1s infinite; }
        .gis-pulse-red { animation: strobe-flash 1.5s infinite; }
        .gis-pulse-blue { animation: pulse-blue-flash 1.5s infinite; }
        .gis-pulse-green { animation: pulse-green-flash 1.5s infinite; }
        .gis-pulse-orange { animation: pulse-orange-flash 1.5s infinite; }
        .new-case-highlight-pulse {
          animation: map-pulse 1.8s infinite ease-in-out;
        }
        @keyframes map-pulse {
          0% { stroke-opacity: 0.8; fill-opacity: 0.25; stroke-width: 2px; }
          50% { stroke-opacity: 0.2; fill-opacity: 0.05; stroke-width: 4px; }
          100% { stroke-opacity: 0.8; fill-opacity: 0.25; stroke-width: 2px; }
        }
        
        .animated-route-line {
          stroke-dasharray: 8, 8;
          animation: route-dash 1.2s linear infinite;
        }
        @keyframes route-dash {
          to { stroke-dashoffset: -20; }
        }
        
        /* Premium GIS map contrast filters */
        .leaflet-tile-container {
          filter: brightness(0.95) contrast(1.05) saturate(1.1);
        }

        /* Vignette overlay styling */
        .map-vignette {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.9);
          pointer-events: none;
          z-index: 999;
        }

        /* Neon routes glow styling */
        .route-hospital {
          filter: drop-shadow(0 0 5px #00f0ff);
        }
        .route-police {
          filter: drop-shadow(0 0 5px #ff0055);
        }
        .route-volunteer {
          filter: drop-shadow(0 0 5px #39ff14);
        }
        .route-drone {
          filter: drop-shadow(0 0 5px #a855f7);
        }
      `}</style>

      {/* Top-Left Location Search Overlay */}
      <div className="absolute top-3 left-14 z-[1000] flex items-center bg-dark-900/90 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md px-2.5 py-1 w-64 h-8">
        <Icons.Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <input
            type="text"
            placeholder="Search location, address, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white text-[10.5px] placeholder-slate-400 focus:outline-none"
          />
        </form>
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white ml-1.5 text-xs">
            ✕
          </button>
        )}
      </div>

      {/* Floating HUD controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 bg-dark-900/95 border border-white/10 text-white rounded-xl p-3 shadow-2xl backdrop-blur-md w-48 text-[11px]">
        <p className="font-bold border-b border-white/5 pb-1.5 uppercase text-[9px] tracking-wider text-slate-400">GIS Command HUD</p>

        {/* Dynamic Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-1 mt-1">
          <input
            type="text"
            placeholder="Search Case, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-dark-800 border border-white/10 rounded px-1.5 py-0.5 text-white text-[9px] focus:outline-none"
          />
          <button type="submit" className="p-1 bg-primary rounded hover:bg-primary/80 transition-colors">
            <Icons.Search className="w-3 h-3 text-white" />
          </button>
        </form>

        {/* Radius filter */}
        {mapConfig.showControls.radiusToggle && (
          <div className="flex flex-col gap-0.5 mt-1">
            <span className="text-[8px] text-slate-500 font-bold uppercase">Search Radius</span>
            <select
              value={selectedRadius}
              onChange={(e) => setSelectedRadius(parseFloat(e.target.value))}
              className="bg-dark-800 border border-white/10 rounded px-2 py-1 text-white focus:outline-none text-[10px]"
            >
              <option value={1}>1 KM Radius</option>
              <option value={2}>2 KM Radius</option>
              <option value={5}>5 KM Radius</option>
              <option value={10}>10 KM Radius</option>
              <option value={10000}>All Cases (National)</option>
            </select>
          </div>
        )}

        {/* Theme select */}
        <div className="flex flex-col gap-0.5 mt-1">
          <span className="text-[8px] text-slate-500 font-bold uppercase">Map Theme</span>
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value as any)}
            className="bg-dark-800 border border-white/10 rounded px-2 py-1 text-white focus:outline-none text-[10px]"
          >
            <option value="dark">🌌 Dark Radar</option>
            <option value="streets">🛣️ Street Map</option>
            <option value="satellite">🗺️ Satellite Hybrid</option>
          </select>
        </div>

        {/* Layer Switches */}
        {mapConfig.showControls.radiusToggle && (
          <div className="flex justify-between items-center mt-1">
            <span>Show Radius</span>
            <input
              type="checkbox"
              checked={toggleRadius}
              onChange={(e) => setToggleRadius(e.target.checked)}
              className="accent-primary"
            />
          </div>
        )}

        <div className="flex justify-between items-center">
          <span>Show Routes</span>
          <input
            type="checkbox"
            checked={toggleRoutes}
            onChange={(e) => setToggleRoutes(e.target.checked)}
            className="accent-primary"
            disabled={!mapConfig.visibleLayers.includes('routes')}
          />
        </div>

        <div className="flex justify-between items-center">
          <span>Show Drones</span>
          <input
            type="checkbox"
            checked={toggleDrone}
            onChange={(e) => setToggleDrone(e.target.checked)}
            className="accent-primary"
          />
        </div>

        <button
          onClick={handleCenterOnChild}
          className="w-full text-center py-1.5 bg-dark-800 border border-white/5 hover:border-primary/20 rounded font-semibold text-slate-300 hover:text-white transition-all mt-1"
        >
          Center on Incident
        </button>
        <button
          onClick={handleCenterOnResponders}
          className="w-full text-center py-1.5 bg-dark-800 border border-white/5 hover:border-primary/20 rounded font-semibold text-slate-300 hover:text-white transition-all"
        >
          Fit Assets View
        </button>
      </div>

      {/* Vignette Overlay */}
      <div className="map-vignette" />

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
      >
        <TileLayer
          key={mapStyle}
          attribution="&copy; Guardian Angel AI GIS"
          url={
            mapStyle === 'satellite'
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              : mapStyle === 'dark'
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          }
          subdomains="abcd"
        />

        <MapControlsHandler centerCoords={centerTarget} bounds={boundsList} fitBoundsTrigger={fitBoundsTrigger} />

        <MapClickHandler onMapClick={() => onCaseSelect(null)} />

        {/* Heatmap overlay */}
        {(showHeatmap || mapConfig.visibleLayers.includes('heatmap')) &&
          cases.map((c) => (
            <span key={`heat-${c.id}`}>
              {/* Core - High Intensity Red */}
              <Circle
                center={[c.location.lat, c.location.lng]}
                radius={800}
                pathOptions={{
                  fillColor: '#ef4444',
                  fillOpacity: 0.35,
                  color: '#ef4444',
                  opacity: 0.2,
                  weight: 1,
                }}
              />
              {/* Mid Ring - Medium Intensity Orange */}
              <Circle
                center={[c.location.lat, c.location.lng]}
                radius={1800}
                pathOptions={{
                  fillColor: '#f97316',
                  fillOpacity: 0.18,
                  color: 'transparent',
                  weight: 0,
                }}
              />
              {/* Outer Halo - Low Intensity Yellow with pulse */}
              <Circle
                center={[c.location.lat, c.location.lng]}
                radius={3200}
                pathOptions={{
                  fillColor: '#eab308',
                  fillOpacity: 0.08,
                  color: '#eab308',
                  opacity: 0.05,
                  weight: 1,
                  className: 'new-case-highlight-pulse'
                }}
              />
            </span>
          ))}

        {/* Traffic lines */}
        {(showTraffic || mapConfig.visibleLayers.includes('traffic')) && (
          <>
            {cases.map((c, idx) => {
              return (
                <span key={idx}>
                  <Polyline
                    positions={[
                      [c.location.lat, c.location.lng],
                      [c.location.lat - 0.005, c.location.lng - 0.008],
                      [c.location.lat - 0.012, c.location.lng - 0.015],
                    ]}
                    pathOptions={{ color: '#ef4444', weight: 4, opacity: 0.75 }}
                  />
                  <Polyline
                    positions={[
                      [c.location.lat + 0.004, c.location.lng + 0.005],
                      [c.location.lat + 0.010, c.location.lng + 0.012],
                      [c.location.lat + 0.018, c.location.lng + 0.020],
                    ]}
                    pathOptions={{ color: '#f97316', weight: 3, opacity: 0.65 }}
                  />
                </span>
              );
            })}
          </>
        )}

        {/* Dynamic Case Markers & Specific Active Dispatch Routing */}
        {cases.map((c) => {
          const isSelected = selectedCase?.id === c.id;
          const markerIcon = c.ai_severity === 'critical' ? gisIcons.Emergency : gisIcons.Police;
          const isNew = c.status === 'reported';
          const isDispatched = c.status === 'dispatched';

          // Dim markers that are not selected when a child is focused
          const markerOpacity = selectedCase ? (isSelected ? 1.0 : 0.35) : 1.0;

          return (
            <span key={c.id}>
              {/* Lost Child Marker - ALWAYS rendered on map */}
              <Marker
                position={[c.location.lat, c.location.lng]}
                icon={markerIcon}
                opacity={markerOpacity}
                eventHandlers={{
                  click: () => onCaseSelect(c),
                }}
              >
                <Popup>
                  <div className="p-2 text-slate-800 text-[11px] min-w-[175px] space-y-1 bg-white rounded-lg">
                    <p className="font-black text-xs border-b pb-1 text-slate-900 uppercase">Case #{c.id.slice(0, 8)}</p>
                    <p className="text-[10px] text-slate-600"><strong>Location:</strong> {c.location.address}</p>
                    <p className="text-[10px] text-slate-600">
                      <strong>Status:</strong>{' '}
                      <span className={`font-bold ${c.status === 'reported' ? 'text-red-500 animate-pulse' : c.status === 'dispatched' ? 'text-blue-500' : 'text-emerald-500'}`}>
                        {c.status.toUpperCase()}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-600">
                      <strong>Severity:</strong> <span className="font-bold text-red-500">{c.ai_severity.toUpperCase()}</span>
                    </p>

                    {/* Responding Authority details */}
                    {isDispatched && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[10px] space-y-0.5">
                        <p className="font-extrabold flex items-center gap-1">
                          {c.ai_severity === 'critical' ? '🚑 Hospital Ambulance' : '🚓 Police Cruiser'}
                        </p>
                        <p className="text-[8.5px] text-blue-700 leading-normal">
                          {c.ai_severity === 'critical' 
                            ? 'St. Jude Emergency Center dispatch team is en route.' 
                            : '17th Precinct Police Cruiser dispatched to rescue child.'}
                        </p>
                      </div>
                    )}
                    {c.status === 'reported' && (
                      <p className="text-[8.5px] text-slate-500 italic mt-2">No authority dispatched yet. Tap Dispatch units in Command Deck console.</p>
                    )}
                    {c.status === 'rescued' && (
                      <p className="text-[9.5px] text-emerald-700 font-bold mt-2">✓ Child successfully rescued.</p>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Pulsing ring for reported cases */}
              {isNew && (
                <Circle
                  center={[c.location.lat, c.location.lng]}
                  radius={1500}
                  pathOptions={{
                    fillColor: '#ef4444',
                    fillOpacity: 0.15,
                    color: '#ef4444',
                    weight: 2,
                    className: 'new-case-highlight-pulse'
                  }}
                />
              )}

              {/* Specific dispatch details rendered ONLY for the selected case */}
              {isSelected && (
                <>
                  {/* Highlighted emergency radius for selected case */}
                  <Circle
                    center={[c.location.lat, c.location.lng]}
                    radius={2000}
                    pathOptions={{
                      fillColor: '#ef4444',
                      fillOpacity: 0.08,
                      color: '#ef4444',
                      weight: 2,
                      dashArray: '6, 6',
                    }}
                  />

                  {/* Rescue circle boundaries */}
                  {toggleRadius && (
                    <Circle
                      center={[c.location.lat, c.location.lng]}
                      radius={selectedRadius * 1000}
                      pathOptions={{
                        fillColor: '#ef4444',
                        fillOpacity: 0.04,
                        color: '#ef4444',
                        weight: 1.5,
                        dashArray: '5, 5',
                      }}
                    />
                  )}

                  {/* Search boundaries overlay */}
                  {showSearchZones && (
                    <Circle
                      center={[c.location.lat, c.location.lng]}
                      radius={450}
                      pathOptions={{
                        fillColor: 'transparent',
                        color: c.ai_severity === 'critical' ? '#ef4444' : '#f97316',
                        weight: 1.5,
                        dashArray: '6, 6',
                      }}
                    />
                  )}

                  {/* Display nearest responders surrounding this selected case */}
                  {visibleResponders.map((resp) => {
                    const responderIcon =
                      resp.type === 'Hospital'
                        ? gisIcons.Hospital
                        : resp.type === 'Police Station'
                        ? gisIcons.Police
                        : resp.type === 'Volunteer'
                        ? gisIcons.Volunteer
                        : resp.type === 'NGO Shelter'
                        ? gisIcons.NGO
                        : gisIcons.Shelter;

                    const distance = getDistance(c.location.lat, c.location.lng, resp.lat, resp.lng)
                    const isAssigned = assignedAuthority?.id === resp.id

                    return (
                      <span key={resp.id}>
                        <Marker position={[resp.lat, resp.lng]} icon={responderIcon} opacity={isAssigned ? 1.0 : 0.75}>
                          <Popup>
                            <div className="p-2 text-slate-800 text-[11px] min-w-[150px]">
                              <p className="font-black">{resp.name}</p>
                              <p className="text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">{resp.type}</p>
                              <p className="text-primary font-bold mt-1.5">Distance: {distance} KM</p>
                              <p className="text-slate-600 mt-0.5">Availability Status: {resp.availability}</p>
                              {isAssigned && <p className="text-emerald-600 font-extrabold mt-1">⭐️ ASSIGNED DISPATCH</p>}
                            </div>
                          </Popup>
                        </Marker>
                        {isAssigned && (
                          <Circle
                            center={[resp.lat, resp.lng]}
                            radius={100}
                            pathOptions={{
                              fillColor: '#10b981',
                              fillOpacity: 0.15,
                              color: '#10b981',
                              weight: 1.5,
                              className: 'new-case-highlight-pulse'
                            }}
                          />
                        )}
                      </span>
                    )
                  })}

                  {/* Dotted polyline dispatch animations - ONLY for selected case */}
                  {toggleRoutes && mapConfig.visibleLayers.includes('routes') && selectedRoute.length > 0 && (
                    <>
                      <Polyline 
                        positions={selectedRoute} 
                        pathOptions={{ 
                          color: c.ai_severity === 'critical' ? '#3b82f6' : c.ai_severity === 'high' ? '#ef4444' : '#10b981', 
                          weight: 5.5, 
                          className: 'animated-route-line route-prominent' 
                        }} 
                      />
                      {(() => {
                        const pos = getProgressCoordinate(selectedRoute, routeProgress)
                        const vehicleIcon = c.ai_severity === 'critical' 
                          ? gisIcons.Hospital 
                          : c.ai_severity === 'high' 
                          ? gisIcons.Police 
                          : gisIcons.Volunteer;

                        return pos ? (
                          <Marker position={pos} icon={vehicleIcon}>
                            <Popup>
                              <div className="text-[10px] bg-dark-950 text-white p-2 rounded border border-white/10">
                                <p className="font-bold text-primary">🚑 RESPONDING SQUAD ACTIVE</p>
                                <p className="text-[8.5px] text-slate-400 mt-1">Status: En Route via OSRM</p>
                                <p className="text-[8.5px] text-slate-400 font-mono">Team ID: {c.ai_severity === 'critical' ? 'AMB-904' : c.ai_severity === 'high' ? 'PCR-412' : 'VOL-704'}</p>
                              </div>
                            </Popup>
                          </Marker>
                        ) : null
                      })()}
                    </>
                  )}

                  {/* Aerial rescue drone straight-line scanning path */}
                  {toggleDrone && (
                    (() => {
                      const droneBase: [number, number] = [
                        c.location.lat + 0.012,
                        c.location.lng - 0.015
                      ];
                      const droneRoute: [number, number][] = [
                        droneBase,
                        [c.location.lat, c.location.lng]
                      ];
                      const dronePos = getProgressCoordinate(droneRoute, (routeProgress + 20) % 100);
                      return (
                        <>
                          <Polyline 
                            positions={droneRoute} 
                            pathOptions={{ color: '#a855f7', weight: 3, className: 'animated-route-line route-drone' }} 
                          />
                          {dronePos && (
                            <Marker position={dronePos} icon={gisIcons.Drone}>
                              <Popup>
                                <div className="text-[10px] bg-dark-950 text-white p-2 rounded border border-white/10">
                                  <p className="font-bold text-purple-400">🛸 RESCUE DRONE ACTIVE</p>
                                  <p className="text-[8.5px] text-slate-400 mt-1">Status: Scanning Flight Path</p>
                                  <p className="text-[8.5px] text-slate-400">FLIR Sensor: Enabled</p>
                                </div>
                              </Popup>
                            </Marker>
                          )}
                        </>
                      );
                    })()
                  )}
                </>
              )}
            </span>
          );
        })}

        {/* Gliding active vehicle dispatches (ONLY for selected case) */}
        {Object.values(activeDispatches)
          .filter((d: any) => selectedCase && d.caseId === selectedCase.id)
          .map((d: any) => {
            const emoji = d.type === 'hospital' ? '🚑' : d.type === 'ngo' ? '🚐' : '🚓'
            const label = d.type === 'hospital' ? 'AMBULANCE' : d.type === 'ngo' ? 'NGO VAN' : 'POLICE CAR'
            const color = d.type === 'hospital' ? '#3b82f6' : d.type === 'ngo' ? '#f97316' : '#ef4444'

            const vehicleIcon = L.divIcon({
              className: '',
              html: `
                <div style="
                  display: flex; flex-direction: column; align-items: center; justify-content: center;
                  animation: glide-float 1s ease-in-out infinite alternate;
                ">
                  <div style="
                    font-size: 26px;
                    filter: drop-shadow(0 0 6px ${color});
                  ">${emoji}</div>
                  <div style="
                    background: #0a0a0f;
                    border: 1px solid ${color};
                    color: #fff;
                    font-size: 7px;
                    padding: 1.5px 3px;
                    border-radius: 4px;
                    font-weight: bold;
                    white-space: nowrap;
                    margin-top: 1px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.6);
                    letter-spacing: 0.5px;
                  ">${label}</div>
                </div>
              `,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            })

            return <Marker key={`vehicle-${d.caseId}`} position={[d.currentLat, d.currentLng]} icon={vehicleIcon} />
          })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-dark-800/90 backdrop-blur border border-white/10 rounded-xl px-4 py-3 text-xs space-y-1.5 z-[1000] shadow-xl">
        <p className="font-bold border-b border-white/5 pb-1 uppercase text-[8px] tracking-wider text-slate-400">Legend</p>
        {mapConfig.legendItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-[10px]">
            <span className="shrink-0">{item.emoji}</span>
            <span className="text-slate-300 font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      {/* ── Rescue Information Panel ── */}
      {selectedCase && (
        (() => {
          const info = getRescueInfoDetails();
          if (!info) return null;
          return (
            <div 
              className="absolute bottom-4 right-4 z-[1000] p-4 border border-white/15 bg-dark-900/95 backdrop-blur-md rounded-2xl w-[320px] shadow-2xl flex flex-col gap-3 transition-all duration-300"
              style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)' }}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white font-black text-[10px] uppercase tracking-wider">Rescue Mission Control</span>
                </div>
                <button 
                  onClick={() => onCaseSelect(null)}
                  className="text-slate-400 hover:text-white transition-colors text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Child Info */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-extrabold text-xs">{info.childName}</p>
                  <p className="text-slate-500 text-[8.5px] font-mono mt-0.5">ID: #{info.childId.slice(0, 8).toUpperCase()}</p>
                </div>
                <span className={`text-[8.5px] px-2 py-0.5 rounded font-extrabold border ${
                  info.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                }`}>{info.severity.toUpperCase()}</span>
              </div>

              {/* Authority Details */}
              <div className="bg-dark-950/60 p-2.5 rounded-xl border border-white/5 space-y-1">
                <p className="text-[8px] text-slate-500 uppercase font-black tracking-wider">Assigned Responder</p>
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-white font-bold">{info.authorityName}</span>
                  <span className="text-slate-400 font-mono text-[9px]">{info.vehicleId}</span>
                </div>
                <p className="text-[8.5px] text-slate-500 mt-0.5">{info.authorityType} Division Squad</p>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div className="bg-dark-950/40 p-2 rounded-lg border border-white/5">
                  <p className="text-slate-500 font-bold uppercase">Rescue Status</p>
                  <p className="text-primary font-black mt-0.5 uppercase tracking-wide">{info.status}</p>
                </div>
                <div className="bg-dark-950/40 p-2 rounded-lg border border-white/5">
                  <p className="text-slate-500 font-bold uppercase">Distance</p>
                  <p className="text-white font-black mt-0.5">{info.distance}</p>
                </div>
                <div className="bg-dark-950/40 p-2 rounded-lg border border-white/5">
                  <p className="text-slate-500 font-bold uppercase">Departed</p>
                  <p className="text-white font-black mt-0.5">{info.startTime}</p>
                </div>
                <div className="bg-dark-950/40 p-2 rounded-lg border border-white/5">
                  <p className="text-slate-500 font-bold uppercase">ETA / Arrival</p>
                  <p className="text-emerald-400 font-black mt-0.5">{info.arrivalTime}</p>
                </div>
              </div>

              {/* Clear button */}
              <button 
                onClick={() => onCaseSelect(null)}
                className="w-full text-center py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[9px] uppercase tracking-wider transition-all mt-1"
              >
                ✕ Clear Selection
              </button>
            </div>
          )
        })()
      )}
    </div>
  )
}
