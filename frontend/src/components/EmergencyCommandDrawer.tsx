import { useEffect, useState } from 'react'
import { 
  X, Shield, MapPin, Clock, Brain, User 
} from 'lucide-react'
import { Case } from '../lib/mockData'
import { getActions } from '../config/actions'
import ActionButton from './ActionButton'
import { useNotifications } from '../context/NotificationContext'
import { generateMockResponders } from './LiveMap'

interface EmergencyCommandDrawerProps {
  selectedCase: Case
  setSelectedCase: (c: Case | null) => void
  currentRole: string
  profile: any
  cases: Case[]
  setCases: React.Dispatch<React.SetStateAction<Case[]>>
  activeDispatches: Record<string, any>
  startDispatchAnimation: (caseId: string, lat: number, lng: number) => void
  logAction: (log: any) => void
}

export default function EmergencyCommandDrawer({
  selectedCase,
  setSelectedCase,
  currentRole,
  profile,
  cases,
  setCases,
  activeDispatches,
  startDispatchAnimation,
  logAction
}: EmergencyCommandDrawerProps) {
  const { addNotification, triggerToast } = useNotifications()
  const [loading, setLoading] = useState(true)

  // Simulate loading delay for skeleton UI (as requested by Step 15)
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [selectedCase.id])

  // Get dynamic mock responders near this case
  const respondersList = generateMockResponders(selectedCase.location.lat, selectedCase.location.lng)
  
  // Calculate map routes or status checks
  const isDispatched = activeDispatches[selectedCase.id]
  const dispatchProgress = isDispatched ? isDispatched.progress : 0

  // 10-step custom timeline index mapping
  const getTimelineStage = () => {
    switch (selectedCase.status as string) {
      case 'reported': return 1
      case 'assigned': return 2
      case 'dispatched': return 3
      case 'travelling': return 4
      case 'arrived': return 5
      case 'rescued': return 6
      case 'closed': return 7
      default: return 1
    }
  }
  const currentStage = getTimelineStage()

  // Prepare Action Context
  const actionContext = {
    currentCase: selectedCase,
    currentRole: currentRole,
    user: profile || { name: 'Sarah J.' },
    cases,
    setCases,
    setSelectedCase: (c: any) => setSelectedCase(c as Case | null),
    activeDispatches,
    startDispatchAnimation,
    addNotification,
    logAction,
    triggerToast
  }

  const actions = getActions(currentRole, actionContext)

  // Map case severity badge styles
  const severityBadgeStyles: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }

  return (
    <>
      {/* Background overlay */}
      <div 
        onClick={() => setSelectedCase(null)} 
        className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm transition-all duration-300"
      />

      {/* Slide-out glass drawer */}
      <div className="fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-dark-900/95 border-l border-white/10 shadow-2xl z-[9999] backdrop-blur-md flex flex-col transition-all duration-300">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-dark-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
            <div>
              <h2 className="text-white font-extrabold text-sm uppercase tracking-wider">
                Emergency Command Deck
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                Case ID: #{selectedCase.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedCase(null)}
            className="p-1.5 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Skeleton state */}
        {loading ? (
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="h-44 bg-white/5 rounded-2xl animate-pulse" />
            <div className="space-y-3">
              <div className="h-6 w-1/3 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-6 w-1/4 bg-white/5 rounded animate-pulse" />
              <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
              <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
            </div>
          </div>
        ) : (
          /* Drawer Content */
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Meta row card */}
            <div className="card bg-dark-950/45 p-4 rounded-xl border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Severity Score</span>
                <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${severityBadgeStyles[selectedCase.ai_severity] || severityBadgeStyles.low}`}>
                  {selectedCase.ai_severity}
                </span>
              </div>
              <div className="space-y-1 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Status</span>
                <span className="text-white font-extrabold text-xs uppercase tracking-widest">{selectedCase.status}</span>
              </div>
              <div className="space-y-1 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Threat Index</span>
                {(() => {
                  const score = selectedCase.ai_severity === 'critical' ? 88
                    : selectedCase.ai_severity === 'high' ? 62
                    : 34
                  const color = score >= 80 ? 'text-red-400' : score >= 60 ? 'text-orange-400' : 'text-yellow-400'
                  return (
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black text-sm ${color}`}>{score}</span>
                      <span className="text-[8px] text-slate-500">/100</span>
                    </div>
                  )
                })()}
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">AI Confidence</span>
                <span className="text-primary font-black text-xs">94.2%</span>
              </div>
            </div>

            {/* GPS & Address Block */}
            <div className="space-y-2.5">
              <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                <MapPin className="w-4 h-4 text-primary" />
                Coordinates Telemetry
              </h3>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2">
                <p className="text-slate-200 text-xs font-semibold leading-relaxed">
                  {selectedCase.location.address}
                </p>
                <div className="flex gap-4 text-[10px] text-slate-400 font-bold uppercase">
                  <div>Lat: {selectedCase.location.lat.toFixed(5)}</div>
                  <div>Lng: {selectedCase.location.lng.toFixed(5)}</div>
                </div>
              </div>
            </div>

            {/* Guardian AI Analysis Deck */}
            <div className="space-y-2.5">
              <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Brain className="w-4 h-4 text-primary" />
                Guardian AI Diagnostic Audit
              </h3>
              <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 space-y-3.5">
                <div>
                  <span className="text-[9px] text-primary font-black uppercase tracking-widest block mb-1">AI Assessment Summary</span>
                  <p className="text-slate-200 text-xs leading-relaxed italic">
                    "{selectedCase.ai_analysis}"
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Key Risk Factors</span>
                    <ul className="text-[10px] text-slate-300 space-y-1 list-disc pl-3 leading-relaxed">
                      <li>Immediate Traffic Hazard</li>
                      <li>Severe Temp. Exposure</li>
                      <li>High Vulnerability Index</li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Resolution Pathway</span>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">
                      Deploy rescue units, block local traffic grids, trigger emergency warning sound.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Responders / Authority Section */}
            <div className="space-y-2.5">
              <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                <User className="w-4 h-4 text-primary" />
                Assigned Emergency Responders
              </h3>
              <div className="space-y-2">
                {respondersList.map((resp, idx) => {
                  let statusText = 'Standby'
                  let etaText = '---'
                  let distText = '---'
                  let activityText = 'Awaiting Command Dispatch'

                  if (isDispatched) {
                    if (dispatchProgress >= 0.98) {
                      statusText = 'Arrived'
                      etaText = 'Arrived'
                      distText = '0.0 km'
                      activityText = 'Active Site Securing Operations'
                    } else {
                      statusText = 'En Route'
                      const minutes = Math.max(1, Math.floor((1 - dispatchProgress) * 8))
                      etaText = `${minutes} min`
                      distText = `${((1 - dispatchProgress) * 2.8).toFixed(1)} km`
                      activityText = 'Responding to GPS coordinates'
                    }
                  }

                  return (
                    <div 
                      key={idx} 
                      className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{resp.type === 'Hospital' ? '🚑' : resp.type === 'Police Station' ? '🚓' : '🛵'}</span>
                        <div>
                          <p className="text-white font-bold">{resp.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{activityText}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-extrabold uppercase text-[9px] ${statusText === 'Arrived' ? 'text-green-400' : statusText === 'En Route' ? 'text-primary animate-pulse' : 'text-slate-500'}`}>
                          {statusText}
                        </p>
                        <p className="text-[10px] text-slate-300 font-bold mt-0.5">{distText} | {etaText}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Chronological Rescue Timeline */}
            <div className="space-y-2.5">
              <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Clock className="w-4 h-4 text-primary" />
                Operational Rescue Timeline
              </h3>
              <div className="pl-4 border-l-2 border-white/10 space-y-4">
                {[
                  { label: 'Report Submitted', stage: 1, desc: 'Incident log created via Citizen Portal.' },
                  { label: 'AI Diagnostic Analysis', stage: 2, desc: 'Visual recognition parsed age, pose and weather constraints.' },
                  { label: 'Rescue Forces Mobilized', stage: 3, desc: 'Police grids, hospital triage notified.' },
                  { label: 'En-Route GPS Tracking', stage: 4, desc: 'Emergency responder vehicles route locked.' },
                  { label: 'Target Site Securement', stage: 5, desc: 'Personnel arrived at child location.' },
                  { label: 'Safety Allocation', stage: 6, desc: 'Child secured and transferred to shelter.' },
                  { label: 'Case Finalization', stage: 7, desc: 'Incident audit trail locked and closed.' }
                ].map((item) => {
                  const isActive = currentStage >= item.stage
                  return (
                    <div key={item.stage} className="relative pl-4">
                      <div className={`absolute -left-[23px] top-0.5 w-2.5 h-2.5 rounded-full border-2 transition-all ${
                        isActive 
                          ? 'bg-primary border-primary shadow-[0_0_8px_rgba(233,69,96,0.5)] scale-110' 
                          : 'bg-dark-900 border-slate-650'
                      }`} />
                      <p className={`text-[11px] font-extrabold uppercase tracking-wide ${isActive ? 'text-white' : 'text-slate-550'}`}>
                        {item.label}
                      </p>
                      {isActive && (
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Command Action deck Console */}
            <div className="space-y-2.5 shrink-0 pt-4 border-t border-white/10">
              <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <Shield className="w-4 h-4 text-primary" />
                Incident Control Room Actions ({actions.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {actions.map((act) => (
                  <ActionButton 
                    key={act.id} 
                    action={act} 
                    context={actionContext} 
                    size="sm" 
                  />
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  )
}
