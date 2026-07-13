import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Case } from '../lib/mockData'
import { getMapConfig } from '../config/maps'
import * as Icons from 'lucide-react'

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
  const mapConfig = getMapConfig(role)

  const [selectedRadius, setSelectedRadius] = useState<number>(mapConfig.defaultRadius)
  const [toggleRadius, setToggleRadius] = useState<boolean>(mapConfig.showControls.radiusToggle)
  const [toggleRoutes, setToggleRoutes] = useState<boolean>(true)
  const [mapStyle, setMapStyle] = useState<'dark' | 'streets' | 'satellite'>('dark')
  const [centerTarget, setCenterTarget] = useState<[number, number] | null>(null)
  const [boundsList, setBoundsList] = useState<[number, number][] | null>(null)
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')

  const defaultCenter: [number, number] = cases.length > 0
    ? [cases[0].location.lat, cases[0].location.lng]
    : [13.0827, 80.2707] // Chennai fallback coordinates

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

    alert('No matching GIS assets, incidents, or locations found.')
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
        
        .animated-route-line {
          stroke-dasharray: 8, 8;
          animation: route-dash 1.2s linear infinite;
        }
        @keyframes route-dash {
          to { stroke-dashoffset: -20; }
        }
      `}</style>

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

      <MapContainer
        center={defaultCenter}
        zoom={13}
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
        />

        <MapControlsHandler centerCoords={centerTarget} bounds={boundsList} fitBoundsTrigger={fitBoundsTrigger} />

        {/* Heatmap overlay */}
        {(showHeatmap || mapConfig.visibleLayers.includes('heatmap')) &&
          cases.map((c) => (
            <Circle
              key={`heat-${c.id}`}
              center={[c.location.lat, c.location.lng]}
              radius={c.ai_severity === 'critical' ? 900 : 500}
              pathOptions={{
                fillColor: '#ef4444',
                fillOpacity: 0.12,
                color: 'transparent',
              }}
            />
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
            <Polyline
              positions={[
                [13.0827, 80.2707],
                [13.072, 80.255],
                [13.055, 80.245],
              ]}
              pathOptions={{ color: '#ef4444', weight: 4, opacity: 0.75 }}
            />
            <Polyline
              positions={[
                [13.013, 80.25],
                [13.028, 80.235],
                [13.042, 80.218],
              ]}
              pathOptions={{ color: '#f97316', weight: 3, opacity: 0.65 }}
            />
          </>
        )}

        {/* Selected Incident View */}
        {selectedCase ? (
          <>
            {/* Child Marker */}
            <Marker position={[selectedCase.location.lat, selectedCase.location.lng]} icon={gisIcons.Emergency}>
              <Popup>
                <div className="p-3 text-slate-800 space-y-2 text-[11px] min-w-[200px]">
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <span className="font-extrabold text-primary">Case #{selectedCase.id.slice(0, 8).toUpperCase()}</span>
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded font-black text-[9px] uppercase">
                      {selectedCase.ai_severity}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-700 leading-normal">{selectedCase.location.address}</p>
                  <p className="text-slate-500 italic leading-normal">AI Summary: {selectedCase.ai_analysis}</p>

                  {/* Timeline representation inside popup */}
                  <div className="flex justify-between text-[8px] text-slate-400 uppercase tracking-widest font-extrabold pt-1">
                    <span>SOS Alarm</span>
                    <span>Triage</span>
                    <span>Dispatched</span>
                  </div>

                  {/* Popup Quick Actions */}
                  <div className="pt-2">
                    <button
                      onClick={() => alert(`Initiating direct rescue operations for case #${selectedCase.id.slice(0,8)}`)}
                      className="w-full text-center py-1.5 bg-primary hover:bg-primary/90 text-white rounded font-bold uppercase tracking-wider text-[9px]"
                    >
                      {role === 'citizen' ? 'Open Guardian AI' : role === 'police' ? 'Dispatch Cruiser' : role === 'hospital' ? 'Send Trauma Ambulance' : 'Accept Mission'}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>

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
                  <Polyline positions={hospitalRoute} pathOptions={{ color: '#3b82f6', weight: 3.5, className: 'animated-route-line' }} />
                )}
                {nearestPolice && policeRoute.length > 0 && (
                  <Polyline positions={policeRoute} pathOptions={{ color: '#ef4444', weight: 3.5, className: 'animated-route-line' }} />
                )}
                {nearestVolunteer && volunteerRoute.length > 0 && (
                  <Polyline positions={volunteerRoute} pathOptions={{ color: '#10b981', weight: 3.5, className: 'animated-route-line' }} />
                )}
              </>
            )}
          </>
        ) : (
          /* Standard dashboard mode: all case markers */
          cases.map((c) => {
            const markerIcon = c.ai_severity === 'critical' ? gisIcons.Emergency : gisIcons.Police;
            return (
              <Marker
                key={c.id}
                position={[c.location.lat, c.location.lng]}
                icon={markerIcon}
                eventHandlers={{
                  click: () => onCaseSelect(c),
                }}
              >
                <Popup>
                  <div className="p-2 text-slate-800 text-[11px] min-w-[150px]">
                    <p className="font-extrabold text-primary">Case #{c.id.slice(0, 8).toUpperCase()}</p>
                    <p className="font-semibold text-slate-700 leading-normal mt-1">{c.location.address}</p>
                    <p className="text-slate-500 capitalize mt-0.5">Priority: {c.ai_severity}</p>
                  </div>
                </Popup>
              </Marker>
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
