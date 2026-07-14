import { useEffect, useState } from 'react'
import { Video, VideoOff, Scan } from 'lucide-react'

interface VideoScanCardProps {
  caseCount: number
  criticalCount: number
}

const DETECTION_STATES = [
  { label: 'Child Presence Confirmed', color: 'text-red-400', dot: '#ef4444' },
  { label: 'Motion Signature Detected', color: 'text-orange-400', dot: '#f97316' },
  { label: 'Thermal Silhouette Locked', color: 'text-purple-400', dot: '#a855f7' },
  { label: 'Face Verification Pending', color: 'text-blue-400', dot: '#3b82f6' },
  { label: 'Distress Posture Identified', color: 'text-amber-400', dot: '#f59e0b' },
]

const GRID_SIZE = 8 // 8x8 detection grid cells

export default function VideoScanCard({ caseCount, criticalCount }: VideoScanCardProps) {
  const [tick, setTick] = useState(0)
  const [scanning, setScanning] = useState(true)
  const [fps, setFps] = useState(29.7)
  const [frameCount, setFrameCount] = useState(1)
  const [detectionIdx, setDetectionIdx] = useState(0)
  const [heatCells, setHeatCells] = useState<Set<number>>(new Set([18, 19, 26, 27]))
  const [scanLine, setScanLine] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(p => p + 1)
      setScanLine(p => (p + 1) % GRID_SIZE)
      setFrameCount(p => p + 1)

      if (Math.random() > 0.85) setFps(parseFloat((Math.random() * 2 + 28.5).toFixed(1)))
      if (tick % 15 === 0) {
        setDetectionIdx(p => (p + 1) % DETECTION_STATES.length)
        // Randomly shift heat signature position
        const base = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE - GRID_SIZE))
        setHeatCells(new Set([base, base + 1, base + GRID_SIZE, base + GRID_SIZE + 1]))
      }
    }, 200)
    return () => clearInterval(interval)
  }, [tick])

  const isActive = scanning && caseCount > 0
  const detection = DETECTION_STATES[detectionIdx]

  return (
    <div
      className="card flex flex-col gap-4 p-5 border bg-dark-900/40 overflow-hidden relative"
      style={{ borderColor: isActive ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)' }}
    >
      {isActive && (
        <div className="absolute inset-0 pointer-events-none rounded-xl"
          style={{ boxShadow: 'inset 0 0 30px rgba(139,92,246,0.05)' }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isActive ? 'border-purple-500/30 bg-purple-500/10' : 'border-white/10 bg-white/5'}`}>
            {isActive ? (
              <Scan className="w-4 h-4 text-purple-400 animate-pulse" />
            ) : (
              <VideoOff className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <div>
            <p className="text-white font-bold text-[11px] uppercase tracking-wider">Video Frame Analyzer</p>
            <p className="text-slate-500 text-[8.5px] mt-0.5">AI vision scan — real-time object detection</p>
          </div>
        </div>
        <button
          className={`text-[8.5px] px-2.5 py-1 rounded-lg font-bold border transition-all ${
            scanning
              ? 'border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
              : 'border-white/10 text-slate-400 bg-white/5 hover:bg-white/10'
          }`}
          onClick={() => setScanning(s => !s)}
        >
          {scanning ? '⏸ PAUSE' : '▶ SCAN'}
        </button>
      </div>

      {/* Pixel Grid Scan View */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ background: '#050810', border: '1px solid rgba(139,92,246,0.15)', padding: '6px' }}
      >
        <div
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
            const row = Math.floor(i / GRID_SIZE)
            const isHeat = heatCells.has(i) && isActive
            const isScanLine = row === scanLine && isActive
            return (
              <div
                key={i}
                className="rounded-[2px] transition-colors duration-150"
                style={{
                  aspectRatio: '1',
                  background: isHeat
                    ? criticalCount > 0 ? '#ef4444' : '#a855f7'
                    : isScanLine
                    ? 'rgba(139,92,246,0.25)'
                    : `rgba(255,255,255,${0.02 + Math.sin(i + tick * 0.1) * 0.015})`,
                  boxShadow: isHeat ? '0 0 6px currentColor' : 'none'
                }}
              />
            )
          })}
        </div>

        {/* HUD overlays on the grid */}
        <div className="absolute top-2 left-2 text-[6.5px] font-mono text-purple-400/70 leading-none">
          <p>CAM-{criticalCount > 0 ? '02' : '01'} FEED</p>
          <p className="mt-0.5">{isActive ? `FPS: ${fps}` : 'OFFLINE'}</p>
        </div>
        <div className="absolute top-2 right-2 text-[6.5px] font-mono text-right text-purple-400/70 leading-none">
          <p>FRAME #{frameCount.toString().padStart(6, '0')}</p>
          <p className={`mt-0.5 ${isActive ? 'text-red-400' : 'text-slate-600'}`}>{isActive ? 'SCANNING' : 'IDLE'}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-[9px]">
        <div className="bg-dark-950/60 p-2 rounded-lg border border-white/5">
          <p className="text-slate-500 uppercase font-bold">FPS</p>
          <p className={`font-black mt-0.5 ${isActive ? 'text-purple-400' : 'text-slate-600'}`}>{isActive ? fps : '—'}</p>
        </div>
        <div className="bg-dark-950/60 p-2 rounded-lg border border-white/5">
          <p className="text-slate-500 uppercase font-bold">Frames</p>
          <p className={`font-black mt-0.5 ${isActive ? 'text-white' : 'text-slate-600'}`}>{isActive ? frameCount.toLocaleString() : '—'}</p>
        </div>
        <div className="bg-dark-950/60 p-2 rounded-lg border border-white/5">
          <p className="text-slate-500 uppercase font-bold">Heat Sigs</p>
          <p className={`font-black mt-0.5 ${isActive && criticalCount > 0 ? 'text-red-400' : isActive ? 'text-purple-400' : 'text-slate-600'}`}>
            {isActive ? (heatCells.size / 4).toFixed(0) : '—'}
          </p>
        </div>
      </div>

      {/* Detection status */}
      {isActive && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5">
          <div className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: detection.dot }} />
          <p className={`${detection.color} text-[9.5px] font-medium`}>{detection.label}</p>
        </div>
      )}
      {!isActive && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-white/5 bg-white/3">
          <Video className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <p className="text-slate-500 text-[9.5px]">No active cases — video scan dormant</p>
        </div>
      )}
    </div>
  )
}
