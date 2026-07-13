import { ChartDefinition } from '../config/analytics/types';

interface AnalyticsChartProps {
  chart: ChartDefinition;
}

export default function AnalyticsChart({ chart }: AnalyticsChartProps) {
  const renderChartBody = () => {
    switch (chart.type) {
      case 'Area Chart':
      case 'Line Chart': {
        const rawList = Array.isArray(chart.data) ? chart.data : [10, 20, 30, 40, 50];
        const points = rawList
          .map((val: number, idx: number) => {
            const x = (idx / (rawList.length - 1)) * 100;
            const y = 90 - (val / 150) * 80; // normalized to max 150
            return `${x},${y}`;
          })
          .join(' ');

        const closedPoints = `0,100 ${points} 100,100`;

        return (
          <div className="relative w-full h-44 flex flex-col justify-between">
            <svg className="w-full h-36" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`grad-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e94560" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#e94560" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {chart.type === 'Area Chart' && (
                <polygon points={closedPoints} fill={`url(#grad-${chart.id})`} />
              )}
              <polyline
                points={points}
                fill="none"
                stroke="#e94560"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 border-t border-white/5 pt-1.5">
              <span>Start Range</span>
              <span>Midpoint</span>
              <span>Target Standard</span>
            </div>
          </div>
        );
      }

      case 'Bar Chart': {
        const rawList = Array.isArray(chart.data) ? chart.data : [30, 60, 45, 90, 40];
        const maxVal = Math.max(...rawList, 100);

        return (
          <div className="flex flex-col justify-between h-44">
            <div className="flex gap-2 items-end h-36 border-b border-white/5 pb-2">
              {rawList.map((h: number, idx: number) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div
                    className="w-full bg-primary/20 border border-primary/50 rounded-t hover:bg-primary/40 transition-all duration-300 relative"
                    style={{ height: `${(h / maxVal) * 100}%` }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-dark-950 border border-white/10 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {h} units
                    </span>
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono mt-1">P{idx + 1}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1">
              <span>Sector 1-3</span>
              <span>Sector 4-6</span>
              <span>Sector 7-10</span>
            </div>
          </div>
        );
      }

      case 'Pie Chart':
      case 'Donut Chart': {
        const segments = Array.isArray(chart.data) ? chart.data : [];
        const isDonut = chart.type === 'Donut Chart';

        return (
          <div className="flex items-center gap-6 h-40">
            {/* SVG Ring representation */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="45" fill="transparent" stroke="#1e1e2d" strokeWidth="12" />
                {segments.map((seg, i) => {
                  const total = segments.reduce((acc, c) => acc + c.value, 0);
                  const strokeVal = (seg.value / total) * 282.7; // circumference
                  // Calculate cumulative offset
                  const offset = segments.slice(0, i).reduce((acc, c) => acc + (c.value / total) * 282.7, 0);
                  return (
                    <circle
                      key={i}
                      cx="56"
                      cy="56"
                      r="45"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={isDonut ? '10' : '22'}
                      strokeDasharray="282.7"
                      strokeDashoffset={282.7 - strokeVal + offset}
                      className="transition-all duration-500"
                    />
                  );
                })}
              </svg>
              {isDonut && (
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-white font-black text-xs font-mono">100%</span>
                  <span className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">Caseload</span>
                </div>
              )}
            </div>

            {/* Labels legends list */}
            <div className="flex-1 space-y-2 text-[10px]">
              {segments.map((seg, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-1">
                  <div className="flex items-center gap-1.5 text-slate-350">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <span>{seg.label}</span>
                  </div>
                  <span className="text-white font-mono font-bold">{seg.value}%</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'Gauge': {
        const val = chart.data?.value || 75;
        // Circumference for semicircle is 125.6
        const offset = 125.6 * (1 - val / 100);

        return (
          <div className="flex flex-col items-center justify-center h-40 relative">
            <svg className="w-48 h-32 transform rotate-180" viewBox="0 0 100 60">
              {/* Semicircle track */}
              <path
                d="M10,50 A40,40 0 0,1 90,50"
                fill="none"
                stroke="#1e1e2d"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Highlight value */}
              <path
                d="M10,50 A40,40 0 0,1 90,50"
                fill="none"
                stroke="#e94560"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="125.6"
                strokeDashoffset={offset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute bottom-6 flex flex-col items-center justify-center">
              <span className="text-white text-3xl font-black font-mono leading-none">{val}%</span>
              <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest mt-1">
                Accuracy Index
              </span>
            </div>
          </div>
        );
      }

      default:
        return <div className="text-slate-500 text-xs">Chart format not supported.</div>;
    }
  };

  return (
    <div className="card p-5 border border-white/10 bg-dark-900/40 h-64 flex flex-col justify-between hover:border-white/20 transition-all overflow-hidden">
      <div className="shrink-0 mb-3">
        <h3 className="text-white font-bold text-xs uppercase tracking-wider">
          {chart.title}
        </h3>
        {chart.description && (
          <p className="text-slate-500 text-[9px] mt-0.5">{chart.description}</p>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {renderChartBody()}
      </div>
    </div>
  );
}
