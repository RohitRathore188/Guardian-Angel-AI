import { useState } from 'react';
import * as Icons from 'lucide-react';

interface AiDashboardProps {
  cases: any[];
}

export default function AiDashboard({ cases }: AiDashboardProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const confidenceAvg = 94.2;
  const criticalCount = cases.filter(c => c.ai_severity === 'critical' && c.status !== 'closed').length;

  const dangerousAreas = [
    { name: 'Chennai Central Sector 4', count: 18, risk: 'High' },
    { name: 'Egmore Precinct', count: 12, risk: 'Medium-High' },
    { name: 'Mylapore Sector 2', count: 8, risk: 'Medium' }
  ];

  const activeVolunteers = [
    { name: 'Volunteer Rahul Dev', missions: 14, score: 850 },
    { name: 'Volunteer Priya Sharma', missions: 12, score: 780 },
    { name: 'Volunteer Rohit Rathore', missions: 9, score: 620 }
  ];

  const hospitalLoads = [
    { name: 'St. Jude Emergency Center', occupancy: 82, beds: 18 },
    { name: 'Pediatric General ER', occupancy: 65, beds: 12 },
    { name: 'Municipal Care Safehouse', occupancy: 40, beds: 8 }
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto scrollbar pr-1">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4 shrink-0">
        <div>
          <h2 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <Icons.BrainCircuit className="w-5 h-5 text-primary animate-pulse" />
            National AI Intelligence & Health Dashboard
          </h2>
          <p className="text-slate-550 text-[10px] mt-0.5">Live neural diagnostics telemetry sweep and predictions</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg border border-white/5 hover:border-white/10 bg-dark-900/40 text-slate-400 hover:text-white transition-colors"
        >
          <Icons.RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {/* Guardian AI Health */}
        <div className="card p-5 border border-white/10 bg-dark-900/40 h-32 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Guardian AI Health</span>
            <div className="p-1.5 rounded-lg border border-emerald-500/20 text-emerald-450 bg-emerald-500/10">
              <Icons.Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-2xl font-black text-white">99.8% Online</p>
            <p className="text-slate-500 text-[9px] mt-0.5">Neural API connection latency: 42ms</p>
          </div>
        </div>

        {/* AI Confidence Average */}
        <div className="card p-5 border border-white/10 bg-dark-900/40 h-32 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">AI Match Accuracy</span>
            <div className="p-1.5 rounded-lg border border-blue-500/20 text-blue-450 bg-blue-500/10">
              <Icons.ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-2xl font-black text-white">{confidenceAvg}%</p>
            <p className="text-slate-500 text-[9px] mt-0.5">Average facial alignment validation weight</p>
          </div>
        </div>

        {/* Critical Predictions */}
        <div className="card p-5 border border-white/10 bg-dark-900/40 h-32 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Critical Predictions</span>
            <div className="p-1.5 rounded-lg border border-primary/20 text-primary bg-primary/10">
              <Icons.AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-2xl font-black text-white">{criticalCount} Predictions</p>
            <p className="text-slate-500 text-[9px] mt-0.5">Distress clusters forecast pending</p>
          </div>
        </div>

        {/* System Lockdown Status */}
        <div className="card p-5 border border-white/10 bg-dark-900/40 h-32 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Lockdown Safe Guard</span>
            <div className="p-1.5 rounded-lg border border-white/10 text-slate-400 bg-white/5">
              <Icons.Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-2xl font-black text-white">Inactive</p>
            <p className="text-slate-500 text-[9px] mt-0.5">Security protocols operational</p>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch shrink-0">
        {/* Most Dangerous Areas (Left) */}
        <div className="lg:col-span-4 card p-5 border border-white/10 bg-dark-900/40 flex flex-col justify-between h-64 overflow-hidden">
          <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-2 mb-3">
            Most Dangerous Areas
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar text-[10px]">
            {dangerousAreas.map((area, i) => (
              <div key={i} className="flex justify-between items-center bg-dark-950/50 p-2.5 rounded-xl border border-white/5">
                <div>
                  <p className="text-white font-bold">{area.name}</p>
                  <p className="text-slate-500 text-[8px] mt-0.5">{area.count} total distress alarms logged</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                  area.risk === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                }`}>{area.risk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Volunteers (Middle) */}
        <div className="lg:col-span-4 card p-5 border border-white/10 bg-dark-900/40 flex flex-col justify-between h-64 overflow-hidden">
          <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-2 mb-3">
            Most Active Volunteers
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar text-[10px]">
            {activeVolunteers.map((vol, i) => (
              <div key={i} className="flex justify-between items-center bg-dark-950/50 p-2.5 rounded-xl border border-white/5">
                <div>
                  <p className="text-white font-bold">{vol.name}</p>
                  <p className="text-slate-500 text-[8px] mt-0.5">{vol.missions} resolved missions completed</p>
                </div>
                <span className="text-emerald-450 font-bold font-mono">{vol.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Load Utilization (Right) */}
        <div className="lg:col-span-4 card p-5 border border-white/10 bg-dark-900/40 flex flex-col justify-between h-64 overflow-hidden">
          <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-2 mb-3">
            Hospital Bed Loads
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar text-[10px]">
            {hospitalLoads.map((hosp, i) => (
              <div key={i} className="flex flex-col gap-1.5 bg-dark-950/50 p-2.5 rounded-xl border border-white/5">
                <div className="flex justify-between items-center">
                  <p className="text-white font-bold">{hosp.name}</p>
                  <span className="text-slate-400 font-mono font-bold">{hosp.occupancy}%</span>
                </div>
                <div className="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${hosp.occupancy}%` }} />
                </div>
                <p className="text-slate-500 text-[8px]">Available Beds: {hosp.beds}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations Glowing Panel */}
      <div className="card p-5 border border-primary/20 bg-primary/5 flex flex-col justify-between space-y-3 shrink-0">
        <h3 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b border-primary/10 pb-2">
          <Icons.BrainCircuit className="w-5 h-5 text-primary animate-pulse" />
          Neural AI Intelligence Recommendations
        </h3>
        <p className="text-slate-300 text-xs leading-relaxed">
          Platform telemetry models detect a 14% elevation in rain delay parameters near Chennai central. Recommend coordinating rescue cruiser allocations and prioritizing pediatric beds triaging booking queues.
        </p>
      </div>
    </div>
  );
}
