import { useEffect, useRef, useState } from 'react'
import { Volume2, AlertCircle, Mic, MicOff } from 'lucide-react'

interface AudioWaveformCardProps {
  caseCount: number
}
const ALERT_TYPES = [
  'Infant crying pattern detected',
  'Elevated distress vocalization',
  'Multiple-voice panic response',
  'High-decibel scream cluster',
  'Weak cry — possible exhaustion',
]

function generateBars(count: number, seed: number): number[] {
  const bars: number[] = []
  for (let i = 0; i < count; i++) {
    const base = Math.sin((i + seed) * 0.6) * 0.4 + 0.5
    const noise = Math.sin((i + seed) * 1.9) * 0.2
    bars.push(Math.max(0.08, Math.min(1, base + noise)))
  }
  return bars
}

export default function AudioWaveformCard({ caseCount }: AudioWaveformCardProps) {
  const [tick, setTick] = useState(0)
  const [scanning, setScanning] = useState(true)
  const [alertIdx, setAlertIdx] = useState(0)
  const [decibelLevel, setDecibelLevel] = useState(62)
  const [confidence, setConfidence] = useState(87)
  const [lastDetected, setLastDetected] = useState('00:12 ago')
  const frameRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      frameRef.current += 1
      setTick(frameRef.current)

      if (frameRef.current % 8 === 0) {
        setDecibelLevel(Math.floor(Math.random() * 35) + 52)
        setConfidence(Math.floor(Math.random() * 20) + 78)
      }
      if (frameRef.current % 20 === 0) {
        setAlertIdx(p => (p + 1) % ALERT_TYPES.length)
        const m = Math.floor(frameRef.current / 60)
        const s = frameRef.current % 60
        setLastDetected(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ago`)
      }
    }, 120)
    return () => clearInterval(interval)
  }, [])

  const bars = generateBars(38, tick * 0.35)
  const activeBars = caseCount > 0 ? bars : bars.map(b => b * 0.12)
  const isActive = scanning && caseCount > 0

  return (
    <div
      className="card flex flex-col gap-4 p-5 border bg-dark-900/40 overflow-hidden relative"
      style={{ borderColor: isActive ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.07)' }}
    >
      {/* Glow when active */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none rounded-xl"
          style={{ boxShadow: 'inset 0 0 30px rgba(245,158,11,0.05)' }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isActive ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/10 bg-white/5'}`}>
            {isActive ? (
              <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : (
              <MicOff className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <div>
            <p className="text-white font-bold text-[11px] uppercase tracking-wider">Audio Distress Scanner</p>
            <p className="text-slate-500 text-[8.5px] mt-0.5">AI acoustic signature analysis</p>
          </div>
        </div>
        <button
          className={`text-[8.5px] px-2.5 py-1 rounded-lg font-bold border transition-all ${
            scanning
              ? 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              : 'border-white/10 text-slate-400 bg-white/5 hover:bg-white/10'
          }`}
          onClick={() => setScanning(s => !s)}
        >
          {scanning ? '⏸ PAUSE' : '▶ SCAN'}
        </button>
      </div>

      {/* Waveform */}
      <div className="flex items-center gap-[2px] h-14 px-1">
        {activeBars.map((h, i) => {
          const isBeat = i === Math.floor(tick % activeBars.length)
          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-75"
              style={{
                height: `${h * 100}%`,
                background: isActive
                  ? isBeat
                    ? '#f59e0b'
                    : h > 0.7 ? '#fbbf24' : h > 0.4 ? '#d97706' : '#92400e'
                  : '#1e293b',
                minHeight: '2px',
                opacity: isActive ? 1 : 0.4
              }}
            />
          )
        })}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-[9px]">
        <div className="bg-dark-950/60 p-2 rounded-lg border border-white/5">
          <p className="text-slate-500 uppercase font-bold">Decibel</p>
          <p className={`font-black mt-0.5 ${isActive ? 'text-amber-400' : 'text-slate-600'}`}>{isActive ? decibelLevel : '—'} dB</p>
        </div>
        <div className="bg-dark-950/60 p-2 rounded-lg border border-white/5">
          <p className="text-slate-500 uppercase font-bold">Confidence</p>
          <p className={`font-black mt-0.5 ${isActive ? 'text-white' : 'text-slate-600'}`}>{isActive ? `${confidence}%` : '—'}</p>
        </div>
        <div className="bg-dark-950/60 p-2 rounded-lg border border-white/5">
          <p className="text-slate-500 uppercase font-bold">Last Hit</p>
          <p className={`font-black mt-0.5 ${isActive ? 'text-white' : 'text-slate-600'}`}>{isActive ? lastDetected : '—'}</p>
        </div>
      </div>

      {/* Alert Banner */}
      {isActive && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <p className="text-amber-300 text-[9.5px] font-medium">{ALERT_TYPES[alertIdx]}</p>
        </div>
      )}
      {!isActive && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-white/5 bg-white/3">
          <Mic className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <p className="text-slate-500 text-[9.5px]">No active cases — audio scan dormant</p>
        </div>
      )}
    </div>
  )
}
