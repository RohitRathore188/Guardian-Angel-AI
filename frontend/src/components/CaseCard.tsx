import { Case } from '../lib/mockData'
import { MapPin, Clock } from 'lucide-react'

interface CaseCardProps {
  case_: Case
  isSelected?: boolean
  onClick?: () => void
}

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export default function CaseCard({ case_, isSelected, onClick }: CaseCardProps) {
  const imageSrc = case_.evidence && case_.evidence.length > 0 && case_.evidence[0].file_url
    ? case_.evidence[0].file_url
    : 'https://placehold.co/100x100/111118/e94560?text=GA'

  return (
    <div
      onClick={onClick}
      className={`card cursor-pointer flex gap-3 transition-all duration-300 hover:border-white/30 hover:bg-dark-800/80 p-3.5 relative overflow-hidden ${
        isSelected ? 'border-primary/80 bg-primary/5 shadow-lg shadow-primary/5' : ''
      } ${
        case_.ai_severity === 'critical' ? 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.08)]' : ''
      }`}
    >
      {/* Dynamic left color stripe */}
      <div className={`absolute top-0 left-0 w-1 h-full ${
        case_.ai_severity === 'critical' ? 'bg-red-500'
        : case_.ai_severity === 'high' ? 'bg-orange-500'
        : 'bg-yellow-500'
      }`} />

      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-900 flex-shrink-0 border border-white/10 relative">
        <img 
          src={imageSrc} 
          alt="Child evidence preview" 
          className="w-full h-full object-cover"
        />
        {case_.ai_severity === 'critical' && (
          <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-dark-900 animate-pulse" />
        )}
      </div>

      {/* Details info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="flex items-start justify-between gap-1">
          <span className="text-white font-bold text-xs truncate">
            {case_.id.startsWith('mock-case-') ? `Case: ${case_.id.toUpperCase()}` : `Case: ${case_.id.slice(0, 8).toUpperCase()}`}
          </span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            case_.ai_severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : case_.ai_severity === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {case_.ai_severity}
          </span>
        </div>

        {/* Location Landmark */}
        <div className="flex items-center gap-1 text-slate-400 text-xs my-1">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="truncate">{case_.location.address}</span>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{timeAgo(case_.created_at)}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase ${
            case_.status === 'reported' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            : case_.status === 'dispatched' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
            : case_.status === 'rescued' ? 'bg-green-500/10 text-green-400 border border-green-500/20'
            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
          }`}>
            {case_.status}
          </span>
        </div>
      </div>
    </div>
  )
}
