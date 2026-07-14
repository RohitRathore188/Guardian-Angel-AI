import { useEffect, useState } from 'react'
import { ShieldAlert, ShieldCheck, Siren, Zap } from 'lucide-react'

export type ThreatLevel = 'SECURE' | 'ELEVATED' | 'HIGH' | 'CRITICAL' | 'EXTREME'

interface ThreatLevelBannerProps {
  criticalCases: number
  totalActiveCases: number
}

const LEVEL_CONFIG: Record<ThreatLevel, {
  label: string
  sublabel: string
  color: string
  bg: string
  border: string
  pulse: boolean
  icon: typeof ShieldCheck
}> = {
  SECURE:   { label: 'SECURE',   sublabel: 'All systems nominal. No immediate threat detected.', color: 'text-emerald-400', bg: 'from-emerald-950/60 to-dark-900/80', border: 'border-emerald-500/20', pulse: false, icon: ShieldCheck },
  ELEVATED: { label: 'ELEVATED', sublabel: 'Potential indicators detected. Monitoring active.', color: 'text-yellow-400',  bg: 'from-yellow-950/60 to-dark-900/80',  border: 'border-yellow-500/25', pulse: false, icon: ShieldAlert },
  HIGH:     { label: 'HIGH',     sublabel: 'Multiple active cases. Heightened response posture.', color: 'text-orange-400', bg: 'from-orange-950/60 to-dark-900/80', border: 'border-orange-500/30', pulse: true,  icon: ShieldAlert },
  CRITICAL: { label: 'CRITICAL', sublabel: 'Critical incidents active. All units on standby.', color: 'text-red-400',    bg: 'from-red-950/60 to-dark-900/80',    border: 'border-red-500/30',    pulse: true,  icon: Siren },
  EXTREME:  { label: 'EXTREME',  sublabel: 'Maximum threat threshold breached. Immediate action required.', color: 'text-rose-300', bg: 'from-rose-950/80 to-dark-900/80', border: 'border-rose-500/40', pulse: true,  icon: Zap },
}

const LEVELS: ThreatLevel[] = ['SECURE', 'ELEVATED', 'HIGH', 'CRITICAL', 'EXTREME']

function computeLevel(criticalCases: number, totalActiveCases: number): ThreatLevel {
  if (criticalCases >= 5 || totalActiveCases >= 20) return 'EXTREME'
  if (criticalCases >= 3 || totalActiveCases >= 12) return 'CRITICAL'
  if (criticalCases >= 2 || totalActiveCases >= 6)  return 'HIGH'
  if (criticalCases >= 1 || totalActiveCases >= 2)  return 'ELEVATED'
  return 'SECURE'
}

export default function ThreatLevelBanner({ criticalCases, totalActiveCases }: ThreatLevelBannerProps) {
  const level = computeLevel(criticalCases, totalActiveCases)
  const cfg = LEVEL_CONFIG[level]
  const levelIdx = LEVELS.indexOf(level)
  const Icon = cfg.icon

  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      className={`relative rounded-2xl border ${cfg.border} bg-gradient-to-r ${cfg.bg} p-5 overflow-hidden shrink-0`}
      style={{ boxShadow: level === 'EXTREME' ? '0 0 30px rgba(244,63,94,0.2)' : level === 'CRITICAL' ? '0 0 20px rgba(239,68,68,0.12)' : 'none' }}
    >
      {/* Animated scan line for high threat */}
      {cfg.pulse && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)`,
            backgroundSize: '200% 100%',
            animation: 'banner-scan 2.5s linear infinite'
          }}
        />
      )}
      <style>{`
        @keyframes banner-scan {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div className="flex items-center gap-5">
        {/* Icon + Level Label */}
        <div className="flex items-center gap-3 shrink-0">
          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center border ${cfg.border}`} style={{ background: 'rgba(0,0,0,0.3)' }}>
            <Icon className={`w-5 h-5 ${cfg.color} ${cfg.pulse ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <p className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider">National Threat Level</p>
            <p className={`text-xl font-black tracking-widest ${cfg.color}`}>{cfg.label}</p>
          </div>
        </div>

        {/* Threat Bar */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex gap-1 h-3">
            {LEVELS.map((l, i) => {
              const active = i <= levelIdx
              return (
                <div
                  key={l}
                  className="flex-1 rounded-sm transition-all duration-700"
                  style={{
                    background: active
                      ? i === 0 ? '#10b981'
                      : i === 1 ? '#eab308'
                      : i === 2 ? '#f97316'
                      : i === 3 ? '#ef4444'
                      : '#f43f5e'
                      : 'rgba(255,255,255,0.05)',
                    opacity: active ? 1 : 0.3,
                    boxShadow: active && i === levelIdx ? '0 0 8px currentColor' : 'none'
                  }}
                />
              )
            })}
          </div>
          <p className={`text-[10px] ${cfg.color} leading-snug`}>{cfg.sublabel}</p>
        </div>

        {/* Metrics */}
        <div className="shrink-0 text-right">
          <p className="text-[8.5px] text-slate-500 uppercase font-bold tracking-wider">Active</p>
          <p className="text-white font-black text-lg">{totalActiveCases} <span className="text-[10px] font-normal text-slate-400">Cases</span></p>
          <p className={`text-[9px] font-bold ${criticalCases > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {criticalCases} Critical • {String(tick % 60).padStart(2, '0')}s
          </p>
        </div>
      </div>
    </div>
  )
}
