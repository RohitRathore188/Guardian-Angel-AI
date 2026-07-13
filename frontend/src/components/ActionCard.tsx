import { ActionConfig, ActionContext } from '../config/actions/types';
import ActionButton from './ActionButton';

interface ActionCardProps {
  action: ActionConfig;
  context: ActionContext;
}

export default function ActionCard({ action, context }: ActionCardProps) {
  const categoryColors: Record<string, string> = {
    Emergency: 'bg-red-500/10 text-red-400 border-red-500/20',
    Medical: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Police: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Volunteer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    NGO: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Child Welfare': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    Administration: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    AI: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    Reports: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    Navigation: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };

  const tagColor = categoryColors[action.category] || 'bg-white/5 text-slate-400 border-white/10';

  return (
    <div className="card p-4 border border-white/10 bg-dark-900/40 hover:border-white/20 transition-all flex flex-col justify-between h-44 group relative overflow-hidden">
      {/* Category Indicator Tag */}
      <div className="flex justify-between items-center mb-2.5">
        <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border ${tagColor}`}>
          {action.category}
        </span>
        <span className="text-slate-600 text-[8px] uppercase font-semibold">Priority P{action.priority}</span>
      </div>

      {/* Title & Description */}
      <div className="flex-1 mb-4">
        <h4 className="text-white font-bold text-xs uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-1.5">
          {action.title}
        </h4>
        <p className="text-slate-400 text-[10px] leading-relaxed mt-1 line-clamp-2">
          {action.description}
        </p>
      </div>

      {/* Execution Button */}
      <div className="shrink-0 mt-auto">
        <ActionButton action={action} context={context} size="sm" />
      </div>
    </div>
  );
}
