import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Case } from '../lib/mockData'

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

// Mock Responders Generator (Chennai Centered or Case Centered)
export const generateMockResponders = (centerLat: number, centerLng: number) => {
  const responders: any[] = []
  let seed = centerLat + centerLng
  const random = () => {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  // 10 Hospitals
  for (let i = 1; i <= 10; i++) {
    const offsetLat = (random() - 0.5) * 0.05
    const offsetLng = (random() - 0.5) * 0.05
    responders.push({
      id: `hosp-${i}`,
      name: `City Pediatric Hospital #${i}`,
      type: 'Hospital',
      lat: centerLat + offsetLat,
      lng: centerLng + offsetLng,
      phone: `+91 44 9110 880${i}`,
      availability: i % 3 === 0 ? 'Busy' : 'Available',
      rating: (4.0 + random() * 0.9).toFixed(1)
    })
  }

  // 8 Police Units
  for (let i = 1; i <= 8; i++) {
    const offsetLat = (random() - 0.5) * 0.05
    const offsetLng = (random() - 0.5) * 0.05
    responders.push({
      id: `pol-${i}`,
      name: `Adyar Precinct Unit #${i}`,
      type: 'Police Station',
      lat: centerLat + offsetLat,
      lng: centerLng + offsetLng,
      phone: `+91 44 9110 770${i}`,
      availability: i % 4 === 0 ? 'Busy' : 'Available',
      rating: (3.8 + random() * 1.1).toFixed(1)
    })
  }

  // 20 Volunteers
  const skillsList = ['First Aid', 'Search & Rescue', 'Child Psychology', 'Languages', 'Trauma Triage']
  for (let i = 1; i <= 20; i++) {
    const offsetLat = (random() - 0.5) * 0.04
    const offsetLng = (random() - 0.5) * 0.04
    responders.push({
      id: `vol-${i}`,
      name: `Volunteer Rahul ${String.fromCharCode(65 + i)}`,
      type: 'Volunteer',
      lat: centerLat + offsetLat,
      lng: centerLng + offsetLng,
      phone: `+91 99000 880${i < 10 ? '0' : ''}${i}`,
      availability: i % 5 === 0 ? 'Offline' : 'Available',
      rating: (4.2 + random() * 0.8).toFixed(1),
      skills: [skillsList[i % skillsList.length], 'Disaster Response'],
      languages: ['Tamil', 'English']
    })
  }

  // 6 NGOs
  for (let i = 1; i <= 6; i++) {
    const offsetLat = (random() - 0.5) * 0.05
    const offsetLng = (random() - 0.5) * 0.05
    responders.push({
      id: `ngo-${i}`,
      name: `Hope Foundation Shelter #${i}`,
      type: 'NGO Shelter',
      lat: centerLat + offsetLat,
      lng: centerLng + offsetLng,
      phone: `+91 44 9110 550${i}`,
      availability: 'Available',
      rating: (4.4 + random() * 0.6).toFixed(1)
    })
  }

  // 4 Child Welfare Offices
  for (let i = 1; i <= 4; i++) {
    const offsetLat = (random() - 0.5) * 0.06
    const offsetLng = (random() - 0.5) * 0.06
    responders.push({
      id: `welf-${i}`,
      name: `Child Welfare Office #${i}`,
      type: 'Child Welfare Office',
      lat: centerLat + offsetLat,
      lng: centerLng + offsetLng,
      phone: `+91 44 9110 440${i}`,
      availability: 'Available',
      rating: '4.0'
    })
  }

  return responders
}

// Custom Leaflet DivIcon Creators
const createIcon = (color: string, emoji: string) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        display: flex; align-items: center; justify-content: center;
        width: 32px; height: 32px;
        background: #ffffff;
        border: 2px solid ${color};
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 0 2px ${color};
        font-size: 16px;
        animation: pulse-tracking 2s infinite alternate;
      ">${emoji}</div>
      <style>
        @keyframes pulse-tracking {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); box-shadow: 0 6px 16px rgba(0,0,0,0.12), 0 0 4px ${color}; }
        }
      </style>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })

const createCircleIcon = (color: string, label?: string) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        display: flex; flex-direction: column; align-items: center; justify-content: center;
      ">
        <div style="
          width: 16px; height: 16px;
          background: ${color};
          border-radius: 50%;
          border: 2.5px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 0 4px ${color};
        "></div>
        ${label ? `
          <div style="
            background: #ffffff;
            border: 1px solid rgba(226, 232, 240, 1);
            color: #111827;
            font-size: 8px;
            padding: 2px 4px;
            border-radius: 4px;
            font-weight: 800;
            white-space: nowrap;
            margin-top: 3px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            letter-spacing: 0.3px;
          ">${label}</div>
        ` : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })

const icons = {
  critical: createCircleIcon('#ef4444', 'CRITICAL'),
  high: createCircleIcon('#f97316', 'HIGH'),
  moderate: createCircleIcon('#eab308', 'MODERATE'),
}

const specialIcons = {
  child: createIcon('#ef4444', '👶'),
  citizen: createIcon('#3b82f6', '🙋'),
  Hospital: createIcon('#3b82f6', '🚑'),
  'Police Station': createIcon('#ef4444', '🚓'),
  Volunteer: createIcon('#10b981', '🛵'),
  'NGO Shelter': createIcon('#f97316', '🚐'),
  'Child Welfare Office': createIcon('#8b5cf6', '🏢'),
}

// Flyer Map Controller
function MapControlsHandler({ 
  centerCoords, 
  fitBoundsTrigger, 
  bounds 
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
}

export default function LiveMap({ 
  cases, 
  selectedCase, 
  onCaseSelect,
  showHeatmap = false,
  showTraffic = false,
  showSearchZones = true,
  activeDispatches = {}
}: LiveMapProps) {
  const [selectedRadius, setSelectedRadius] = useState<number>(2) // Default 2 KM
  const [toggleRadius, setToggleRadius] = useState<boolean>(true)
  const [toggleRoutes, setToggleRoutes] = useState<boolean>(true)
  const [centerTarget, setCenterTarget] = useState<[number, number] | null>(null)
  const [boundsList, setBoundsList] = useState<[number, number][] | null>(null)
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState<number>(0)

  const defaultCenter: [number, number] = cases.length > 0
    ? [cases[0].location.lat, cases[0].location.lng]
    : [13.0827, 80.2707] // Chennai fallback

  // Generate responders around selected case coordinates
  const respondersList = selectedCase
    ? generateMockResponders(selectedCase.location.lat, selectedCase.location.lng)
    : []

  // Filter responders inside the selected search radius
  const visibleResponders = selectedCase
    ? respondersList.filter(
        (r) => getDistance(selectedCase.location.lat, selectedCase.location.lng, r.lat, r.lng) <= selectedRadius
      )
    : []

  // Find nearest responder of a given type
  const getNearestResponder = (type: string) => {
    if (!selectedCase || !visibleResponders.length) return null
    const list = visibleResponders.filter(r => r.type === type && r.availability === 'Available')
    if (!list.length) return null
    
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

  // Center Map triggers
  const handleCenterOnChild = () => {
    if (selectedCase) {
      setCenterTarget([selectedCase.location.lat, selectedCase.location.lng])
      // reset target to prevent repeated triggers
      setTimeout(() => setCenterTarget(null), 500)
    }
  }

  const handleCenterOnResponders = () => {
    if (selectedCase) {
      const bounds: [number, number][] = [
        [selectedCase.location.lat, selectedCase.location.lng]
      ]
      visibleResponders.forEach(r => bounds.push([r.lat, r.lng]))
      setBoundsList(bounds)
      setFitBoundsTrigger(prev => prev + 1)
    }
  }

  return (
    <div className="w-full h-full relative">
      <style>{`
        @keyframes route-dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animated-route-line {
          stroke-dasharray: 8, 8;
          animation: route-dash 1.2s linear infinite;
        }
      `}</style>

      {/* Floating Map Controls HUD */}
      {selectedCase && (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 bg-dark-900/95 border border-white/10 text-white rounded-xl p-3 shadow-2xl backdrop-blur-md w-48 text-[11px]">
          <p className="font-bold border-b border-white/5 pb-1.5 uppercase text-[9px] tracking-wider text-slate-400">Map Controls</p>
          
          {/* Configurable Search Radius */}
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase">Search Radius Filter</span>
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

          {/* Toggle Switches */}
          <div className="flex justify-between items-center mt-1">
            <span>Show Radius</span>
            <input 
              type="checkbox" 
              checked={toggleRadius} 
              onChange={(e) => setToggleRadius(e.target.checked)} 
              className="accent-primary"
            />
          </div>

          <div className="flex justify-between items-center">
            <span>Show Routes</span>
            <input 
              type="checkbox" 
              checked={toggleRoutes} 
              onChange={(e) => setToggleRoutes(e.target.checked)} 
              className="accent-primary"
            />
          </div>

          {/* Positioning Buttons */}
          <button 
            onClick={handleCenterOnChild}
            className="w-full text-center py-1.5 bg-dark-800 border border-white/5 hover:border-primary/20 rounded font-semibold text-slate-300 hover:text-white transition-all mt-1"
          >
            Center on Child
          </button>
          <button 
            onClick={handleCenterOnResponders}
            className="w-full text-center py-1.5 bg-dark-800 border border-white/5 hover:border-primary/20 rounded font-semibold text-slate-300 hover:text-white transition-all"
          >
            Fit Responders Box
          </button>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Map Controller hooks */}
        <MapControlsHandler 
          centerCoords={centerTarget} 
          bounds={boundsList} 
          fitBoundsTrigger={fitBoundsTrigger} 
        />

        {/* Heatmap overlay circles */}
        {showHeatmap && cases.map((c) => (
          <Circle
            key={`heat-${c.id}`}
            center={[c.location.lat, c.location.lng]}
            radius={900}
            pathOptions={{
              fillColor: '#ef4444',
              fillOpacity: 0.12,
              color: 'transparent'
            }}
          />
        ))}

        {/* Search Zone overlay dashed circles */}
        {showSearchZones && cases.map((c) => (
          <Circle
            key={`zone-${c.id}`}
            center={[c.location.lat, c.location.lng]}
            radius={450}
            pathOptions={{
              fillColor: 'transparent',
              color: c.ai_severity === 'critical' ? '#ef4444' : '#f97316',
              weight: 1.5,
              dashArray: '6, 6'
            }}
          />
        ))}

        {/* Traffic congestion mock lines */}
        {showTraffic && (
          <>
            <Polyline
              positions={[
                [13.0827, 80.2707],
                [13.0720, 80.2550],
                [13.0550, 80.2450]
              ]}
              pathOptions={{ color: '#ef4444', weight: 4, opacity: 0.75 }}
            />
            <Polyline
              positions={[
                [13.0130, 80.2500],
                [13.0280, 80.2350],
                [13.0420, 80.2180]
              ]}
              pathOptions={{ color: '#f97316', weight: 3, opacity: 0.65 }}
            />
          </>
        )}

        {/* ── CONDITIONAL RENDER: Live Tracking Workspace Mode ── */}
        {selectedCase ? (
          <>
            {/* Child Marker */}
            <Marker position={[selectedCase.location.lat, selectedCase.location.lng]} icon={specialIcons.child}>
              <Popup>
                <div className="p-1">
                  <p className="text-xs font-bold text-slate-800">Abandoned Child Location</p>
                  <p className="text-[10px] text-slate-500">{selectedCase.location.address}</p>
                </div>
              </Popup>
            </Marker>

            {/* Citizen Marker */}
            <Marker position={[selectedCase.location.lat + 0.002, selectedCase.location.lng - 0.002]} icon={specialIcons.citizen}>
              <Popup><p className="text-xs font-bold text-slate-800">Reporting Citizen</p></Popup>
            </Marker>

            {/* Emergency & Search Radius Rings */}
            {toggleRadius && (
              <>
                {/* 2 KM search boundaries */}
                <Circle
                  center={[selectedCase.location.lat, selectedCase.location.lng]}
                  radius={selectedRadius * 1000}
                  pathOptions={{
                    fillColor: '#ef4444',
                    fillOpacity: 0.04,
                    color: '#ef4444',
                    weight: 1.5,
                    dashArray: '5, 5'
                  }}
                />
              </>
            )}

            {/* Render all generated responders within selected radius */}
            {visibleResponders.map((resp) => {
              const markerIcon = specialIcons[resp.type as keyof typeof specialIcons] || specialIcons.Volunteer
              const distance = getDistance(selectedCase.location.lat, selectedCase.location.lng, resp.lat, resp.lng)
              
              return (
                <Marker key={resp.id} position={[resp.lat, resp.lng]} icon={markerIcon}>
                  <Popup>
                    <div className="p-1 text-slate-800">
                      <p className="text-xs font-bold">{resp.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase mt-0.5">{resp.type}</p>
                      <p className="text-[10px] font-bold mt-1 text-primary">Distance: {distance} KM</p>
                      <p className="text-[10px] mt-0.5">Availability: {resp.availability}</p>
                    </div>
                  </Popup>
                </Marker>
              )
            })}

            {/* Draw animated routes towards the child coordinates */}
            {toggleRoutes && (
              <>
                {/* Hospital Route */}
                {nearestHospital && (
                  <Polyline
                    positions={[[nearestHospital.lat, nearestHospital.lng], [selectedCase.location.lat, selectedCase.location.lng]]}
                    pathOptions={{
                      color: '#3b82f6',
                      weight: 3.5,
                      className: 'animated-route-line'
                    }}
                  />
                )}

                {/* Police Route */}
                {nearestPolice && (
                  <Polyline
                    positions={[[nearestPolice.lat, nearestPolice.lng], [selectedCase.location.lat, selectedCase.location.lng]]}
                    pathOptions={{
                      color: '#ef4444',
                      weight: 3.5,
                      className: 'animated-route-line'
                    }}
                  />
                )}

                {/* Volunteer Route */}
                {nearestVolunteer && (
                  <Polyline
                    positions={[[nearestVolunteer.lat, nearestVolunteer.lng], [selectedCase.location.lat, selectedCase.location.lng]]}
                    pathOptions={{
                      color: '#10b981',
                      weight: 3.5,
                      className: 'animated-route-line'
                    }}
                  />
                )}
              </>
            )}
          </>
        ) : (
          /* ── STANDARD MODE: Incident Markers list ── */
          cases.map((c) => (
            <Marker
              key={c.id}
              position={[c.location.lat, c.location.lng]}
              icon={icons[c.ai_severity] || icons.moderate}
              eventHandlers={{
                click: () => onCaseSelect(c),
              }}
            >
              <Popup>
                <div className="p-1">
                  <p className="text-xs font-semibold text-slate-800">{c.location.address}</p>
                  <p className="text-[10px] text-slate-500 capitalize mt-0.5">Status: {c.status}</p>
                </div>
              </Popup>
            </Marker>
          ))
        )}

        {/* Vehicle dispatches animations */}
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

          return (
            <Marker
              key={`vehicle-${d.caseId}`}
              position={[d.currentLat, d.currentLng]}
              icon={vehicleIcon}
            />
          )
        })}
      </MapContainer>

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-dark-800/90 backdrop-blur border border-white/10 rounded-xl px-4 py-3 text-xs space-y-1.5 z-[1000] shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-300">🔴 Critical / Police</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-slate-300">🔵 Hospital / Medical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-slate-300">🧡 NGO Welfare</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-300">🟢 Volunteer Force</span>
        </div>
      </div>
    </div>
  )
}
