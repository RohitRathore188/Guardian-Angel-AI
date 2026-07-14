import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet'
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

interface LiveMapProps {
  cases: Case[]
  selectedCase: Case | null
  onCaseSelect: (c: Case) => void
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

  // OSRM Routes
  const [hospitalRoute, setHospitalRoute] = useState<[number, number][]>([])
  const [policeRoute, setPoliceRoute] = useState<[number, number][]>([])
  const [volunteerRoute, setVolunteerRoute] = useState<[number, number][]>([])

  // Nearest responders
  const getNearestResponder = (type: string) => {
    const list = visibleResponders.filter((r) => r.type === type && r.availability === 'Available')
    if (!list.length || !selectedCase) return null
    let nearest = list[0]
    let minDist = getDistance(selectedCase.location.lat, selectedCase.location.lng, nearest.lat, nearest.lng)
    for (let r of list) {
      const dist = getDistance(selectedCase.location.lat, selectedCase.location.lng, r.lat, r.lng)
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
    if (selectedCase) {
      const childCoords: [number, number] = [selectedCase.location.lat, selectedCase.location.lng]
      if (nearestHospital) fetchRoute([nearestHospital.lat, nearestHospital.lng], childCoords, setHospitalRoute)
      if (nearestPolice) fetchRoute([nearestPolice.lat, nearestPolice.lng], childCoords, setPoliceRoute)
      if (nearestVolunteer) fetchRoute([nearestVolunteer.lat, nearestVolunteer.lng], childCoords, setVolunteerRoute)
    } else {
      setHospitalRoute([])
      setPoliceRoute([])
      setVolunteerRoute([])
    }
  }, [selectedCase, nearestHospital?.id, nearestPolice?.id, nearestVolunteer?.id])

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

        {/* Search boundaries overlay */}
        {showSearchZones &&
          cases.map((c) => (
            <Circle
              key={`zone-${c.id}`}
              center={[c.location.lat, c.location.lng]}
              radius={450}
              pathOptions={{
                fillColor: 'transparent',
                color: c.ai_severity === 'critical' ? '#ef4444' : '#f97316',
                weight: 1.5,
                dashArray: '6, 6',
              }}
            />
          ))}

        {/* Traffic lines */}
        {(showTraffic || mapConfig.visibleLayers.includes('traffic')) && (
          <>
            {cases.map((c, idx) => (
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
            ))}
          </>
        )}

        {/* Selected Incident View */}
        {selectedCase ? (
          <>
            {/* Child Marker */}
            <Marker
              position={[selectedCase.location.lat, selectedCase.location.lng]}
              icon={gisIcons.Emergency}
            />

            {/* Highlighted emergency radius for selected case */}
            <Circle
              center={[selectedCase.location.lat, selectedCase.location.lng]}
              radius={2000} // 2km default search zone radius
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
                center={[selectedCase.location.lat, selectedCase.location.lng]}
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

            {/* Display nearest responders & OSRM Routes */}
            {visibleResponders.map((resp) => {
              const markerIcon =
                resp.type === 'Hospital'
                  ? gisIcons.Hospital
                  : resp.type === 'Police Station'
                  ? gisIcons.Police
                  : resp.type === 'Volunteer'
                  ? gisIcons.Volunteer
                  : resp.type === 'NGO Shelter'
                  ? gisIcons.NGO
                  : gisIcons.Shelter;

              const distance = getDistance(selectedCase.location.lat, selectedCase.location.lng, resp.lat, resp.lng)

              return (
                <Marker key={resp.id} position={[resp.lat, resp.lng]} icon={markerIcon}>
                  <Popup>
                    <div className="p-2 text-slate-800 text-[11px] min-w-[150px]">
                      <p className="font-black">{resp.name}</p>
                      <p className="text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">{resp.type}</p>
                      <p className="text-primary font-bold mt-1.5">Distance: {distance} KM</p>
                      <p className="text-slate-600 mt-0.5">Availability Status: {resp.availability}</p>
                    </div>
                  </Popup>
                </Marker>
              )
            })}

            {/* Dotted polyline animations */}
            {toggleRoutes && mapConfig.visibleLayers.includes('routes') && (
              <>
                {nearestHospital && hospitalRoute.length > 0 && (
                  <>
                    <Polyline positions={hospitalRoute} pathOptions={{ color: '#3b82f6', weight: 3.5, className: 'animated-route-line route-hospital' }} />
                    {(() => {
                      const pos = getProgressCoordinate(hospitalRoute, routeProgress)
                      return pos ? (
                        <Marker position={pos} icon={gisIcons.Hospital}>
                          <Popup>
                            <div className="text-[10px] bg-dark-950 text-white p-2 rounded border border-white/10">
                              <p className="font-bold text-primary">🚑 AMBULANCE EN ROUTE</p>
                              <p className="text-[8.5px] text-slate-400 mt-1">Origin: {nearestHospital.name}</p>
                              <p className="text-[8.5px] text-slate-400">Destination: {selectedCase.location.address}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ) : null
                    })()}
                  </>
                )}
                {nearestPolice && policeRoute.length > 0 && (
                  <>
                    <Polyline positions={policeRoute} pathOptions={{ color: '#ef4444', weight: 3.5, className: 'animated-route-line route-police' }} />
                    {(() => {
                      const pos = getProgressCoordinate(policeRoute, (routeProgress + 40) % 100)
                      return pos ? (
                        <Marker position={pos} icon={gisIcons.Police}>
                          <Popup>
                            <div className="text-[10px] bg-dark-950 text-white p-2 rounded border border-white/10">
                              <p className="font-bold text-red-400">🚓 POLICE CRUISER DISPATCHED</p>
                              <p className="text-[8.5px] text-slate-400 mt-1">Origin: {nearestPolice.name}</p>
                              <p className="text-[8.5px] text-slate-400">Destination: {selectedCase.location.address}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ) : null
                    })()}
                  </>
                )}
                {nearestVolunteer && volunteerRoute.length > 0 && (
                  <>
                    <Polyline positions={volunteerRoute} pathOptions={{ color: '#10b981', weight: 3.5, className: 'animated-route-line route-volunteer' }} />
                    {(() => {
                      const pos = getProgressCoordinate(volunteerRoute, (routeProgress + 75) % 100)
                      return pos ? (
                        <Marker position={pos} icon={gisIcons.Volunteer}>
                          <Popup>
                            <div className="text-[10px] bg-dark-950 text-white p-2 rounded border border-white/10">
                              <p className="font-bold text-emerald-400">🛵 NEAREST VOLUNTEER SQUAD</p>
                              <p className="text-[8.5px] text-slate-400 mt-1">Origin: {nearestVolunteer.name}</p>
                              <p className="text-[8.5px] text-slate-400">Destination: {selectedCase.location.address}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ) : null
                    })()}
                  </>
                )}
                {toggleDrone && (
                  (() => {
                    const droneBase: [number, number] = [
                      selectedCase.location.lat + 0.012,
                      selectedCase.location.lng - 0.015
                    ];
                    const droneRoute: [number, number][] = [
                      droneBase,
                      [selectedCase.location.lat, selectedCase.location.lng]
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
          </>
        ) : (
          /* Standard dashboard mode: all case markers */
          cases.map((c) => {
            const markerIcon = c.ai_severity === 'critical' ? gisIcons.Emergency : gisIcons.Police;
            const isNew = c.status === 'reported';
            const isDispatched = c.status === 'dispatched';

            // Generate mock route points for cases that are dispatched
            const mockRoute: [number, number][] = [
              [c.location.lat - 0.015, c.location.lng - 0.018],
              [c.location.lat - 0.008, c.location.lng - 0.010],
              [c.location.lat, c.location.lng]
            ];
            const vehiclePos = getProgressCoordinate(mockRoute, routeProgress);
            const vehicleIcon = c.ai_severity === 'critical' ? gisIcons.Hospital : gisIcons.Police;

            return (
              <span key={c.id}>
                <Marker
                  position={[c.location.lat, c.location.lng]}
                  icon={markerIcon}
                  eventHandlers={{
                    click: () => onCaseSelect(c),
                  }}
                />
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
                {isDispatched && (
                  <>
                    <Polyline 
                      positions={mockRoute} 
                      pathOptions={{ 
                        color: c.ai_severity === 'critical' ? '#3b82f6' : '#ef4444', 
                        weight: 3, 
                        className: `animated-route-line ${c.ai_severity === 'critical' ? 'route-hospital' : 'route-police'}` 
                      }} 
                    />
                    {vehiclePos && (
                      <Marker position={vehiclePos} icon={vehicleIcon}>
                        <Popup>
                          <div className="text-[10px] bg-dark-950 text-white p-2 rounded border border-white/10">
                            <p className="font-bold text-primary">🚨 DISPATCH ROUTE ACTIVE</p>
                            <p className="text-[8.5px] text-slate-400 mt-1">Vehicle responding to Case #{c.id.slice(0, 8)}</p>
                            <p className="text-[8.5px] text-slate-400">Destination: {c.location.address}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
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
                              pathOptions={{ color: '#a855f7', weight: 2.5, className: 'animated-route-line route-drone' }} 
                            />
                            {dronePos && (
                              <Marker position={dronePos} icon={gisIcons.Drone}>
                                <Popup>
                                  <div className="text-[10px] bg-dark-950 text-white p-2 rounded border border-white/10">
                                    <p className="font-bold text-purple-400">🛸 AERIAL RESCUE DRONE</p>
                                    <p className="text-[8.5px] text-slate-400 mt-1">Responding to Case #{c.id.slice(0, 8)}</p>
                                    <p className="text-[8.5px] text-slate-400">Mission: Thermal Scanning Area</p>
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
          })
        )}

        {/* Gliding active vehicle dispatches */}
        {Object.values(activeDispatches).map((d) => {
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
    </div>
  )
}
