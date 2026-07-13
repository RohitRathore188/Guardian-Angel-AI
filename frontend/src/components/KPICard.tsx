import * as Icons from 'lucide-react';
import { KPIDefinition } from '../config/analytics/types';

// Helper to resolve dynamic Lucide icons from string name
const getIconComponent = (iconName: string, statusColor: string) => {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent ? (
    <IconComponent className={`w-4 h-4 ${statusColor}`} />
  ) : (
    <Icons.Activity className={`w-4 h-4 ${statusColor}`} />
  );
};

interface KPICardProps {
  kpi: KPIDefinition;
}

export default function KPICard({ kpi }: KPICardProps) {
  const statusColors = {
    success: 'text-emerald-450 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-450 bg-amber-500/10 border-amber-500/20',
    danger: 'text-primary bg-primary/10 border-primary/20',
    info: 'text-blue-450 bg-blue-500/10 border-blue-500/20',
    neutral: 'text-slate-450 bg-white/5 border-white/10',
  };

  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400',
  };

  const iconColor = {
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-primary',
    info: 'text-blue-400',
    neutral: 'text-slate-400',
  }[kpi.status];

  // Draw points for mini sparkline SVG
  const points = kpi.sparklineData
    .map((val, idx) => {
      const x = (idx / (kpi.sparklineData.length - 1)) * 80 + 10;
      const y = 25 - (val / 100) * 20;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="card p-5 border border-white/10 bg-dark-900/40 hover:border-white/20 transition-all flex flex-col justify-between h-32 relative group overflow-hidden">
      {/* Sparkline background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="flex justify-between items-start shrink-0 mb-1">
        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
          {kpi.title}
        </span>
        <div className={`p-1.5 rounded-lg border ${statusColors[kpi.status]}`}>
          {getIconComponent(kpi.icon, iconColor)}
        </div>
      </div>

      {/* Value & Sparkline Split row */}
      <div className="flex justify-between items-end mt-auto">
        <div className="space-y-0.5">
          <p className="text-2xl font-black text-white tracking-tight">{kpi.value}</p>
          <p className="text-[9px] text-slate-500 flex items-center gap-1">
            <span className={`font-mono font-bold ${trendColors[kpi.trendDirection]}`}>
              {kpi.trend}
            </span>
            <span>{kpi.comparison}</span>
          </p>
        </div>

        {/* CSS/SVG Sparkline */}
        <div className="w-16 h-8 text-slate-600 group-hover:text-primary transition-colors shrink-0">
          <svg className="w-full h-full" viewBox="0 0 100 30">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
