import { useState } from 'react';
import * as Icons from 'lucide-react';
import ThreatLevelBanner from './ThreatLevelBanner';
import AudioWaveformCard from './AudioWaveformCard';
import VideoScanCard from './VideoScanCard';

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
  const activeCases = cases.filter(c => c.status !== 'closed');
  const criticalCount = activeCases.filter(c => c.ai_severity === 'critical').length;
  const highCount = activeCases.filter(c => c.ai_severity === 'high').length;

  const dangerousAreas = [
    { name: 'Chennai Central Sector 4', count: 18, risk: 'High',        threat: 85 },
    { name: 'Egmore Precinct',          count: 12, risk: 'Medium-High', threat: 62 },
    { name: 'Mylapore Sector 2',        count: 8,  risk: 'Medium',      threat: 44 },
    { name: 'Anna Nagar Zone 3',        count: 5,  risk: 'Elevated',    threat: 30 },
    { name: 'T. Nagar South',           count: 3,  risk: 'Low',         threat: 15 },
  ];

  const activeVolunteers = [
    { name: 'Volunteer Rahul Dev',      missions: 14, score: 850 },
    { name: 'Volunteer Priya Sharma',   missions: 12, score: 780 },
    { name: 'Volunteer Rohit Rathore',  missions: 9,  score: 620 },
  ];

  const hospitalLoads = [
    { name: 'St. Jude Emergency Center',    occupancy: 82, beds: 18 },
    { name: 'Pediatric General ER',         occupancy: 65, beds: 12 },
    { name: 'Municipal Care Safehouse',     occupancy: 40, beds: 8  },
  ];

  // Threat color helpers
  const threatColor = (score: number) => {
    if (score >= 80) return { bar: '#ef4444', text: 'text-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/20' }
    if (score >= 60) return { bar: '#f97316', text: 'text-orange-400', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' }
    if (score >= 40) return { bar: '#eab308', text: 'text-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' }
    if (score >= 20) return { bar: '#3b82f6', text: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
    return { bar: '#10b981', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
  }

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto scrollbar pr-1">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4 shrink-0">
        <div>
          <h2 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <Icons.BrainCircuit className="w-5 h-5 text-primary animate-pulse" />
            National AI Intelligence &amp; Health Dashboard
          </h2>
          <p className="text-slate-550 text-[10px] mt-0.5">Live neural diagnostics · audio/video scan · threat matrix</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg border border-white/5 hover:border-white/10 bg-dark-900/40 text-slate-400 hover:text-white transition-colors"
        >
          <Icons.RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Threat Level Banner ─────────────────────────────────────────────── */}
      <ThreatLevelBanner criticalCases={criticalCount} totalActiveCases={activeCases.length} />

      {/* ── KPI Cards Grid ──────────────────────────────────────────────────── */}
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
            <p className="text-2xl font-black text-white">{criticalCount} Critical / {highCount} High</p>
            <p className="text-slate-500 text-[9px] mt-0.5">Distress clusters forecast pending</p>
          </div>
        </div>

        {/* System Lockdown Status */}
        <div className="card p-5 border border-white/10 bg-dark-900/40 h-32 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Lockdown SafeGuard</span>
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

      {/* ── Audio + Video Scan Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
        <AudioWaveformCard caseCount={activeCases.length} />
        <VideoScanCard caseCount={activeCases.length} criticalCount={criticalCount} />
      </div>

      {/* ── Sector Threat Matrix ─────────────────────────────────────────────── */}
      <div className="card p-5 border border-white/10 bg-dark-900/40 shrink-0">
        <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
          <Icons.Map className="w-4 h-4 text-orange-400" />
          Sector Threat Matrix
          <span className="ml-auto text-[8px] text-slate-500 normal-case font-normal">AI-computed per-sector risk scores</span>
        </h3>
        <div className="space-y-3">
          {dangerousAreas.map((area, i) => {
            const tc = threatColor(area.threat)
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-slate-500 w-5 shrink-0">S{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-[10px] font-bold">{area.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] px-2 py-0.5 rounded font-bold border ${tc.badge}`}>{area.risk}</span>
                      <span className={`text-[10px] font-mono font-black ${tc.text}`}>{area.threat}</span>
                    </div>
                  </div>
                  <div className="w-full bg-dark-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${area.threat}%`, background: tc.bar, boxShadow: `0 0 6px ${tc.bar}40` }}
                    />
                  </div>
                  <p className="text-slate-600 text-[8px] mt-0.5">{area.count} distress alarms logged this cycle</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Operational Intel Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch shrink-0">
        {/* Most Active Volunteers */}
        <div className="lg:col-span-6 card p-5 border border-white/10 bg-dark-900/40 flex flex-col h-56 overflow-hidden">
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

        {/* Hospital Bed Loads */}
        <div className="lg:col-span-6 card p-5 border border-white/10 bg-dark-900/40 flex flex-col h-56 overflow-hidden">
          <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-2 mb-3">
            Hospital Bed Loads
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar text-[10px]">
            {hospitalLoads.map((hosp, i) => (
              <div key={i} className="flex flex-col gap-1.5 bg-dark-950/50 p-2.5 rounded-xl border border-white/5">
                <div className="flex justify-between items-center">
                  <p className="text-white font-bold">{hosp.name}</p>
                  <span className={`font-mono font-bold ${hosp.occupancy >= 80 ? 'text-red-400' : hosp.occupancy >= 60 ? 'text-orange-400' : 'text-emerald-400'}`}>{hosp.occupancy}%</span>
                </div>
                <div className="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${hosp.occupancy}%`,
                      background: hosp.occupancy >= 80 ? '#ef4444' : hosp.occupancy >= 60 ? '#f97316' : '#10b981'
                    }}
                  />
                </div>
                <p className="text-slate-500 text-[8px]">Available Beds: {hosp.beds}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Neural AI Recommendations ──────────────────────────────────────── */}
      <div className="card p-5 border border-primary/20 bg-primary/5 flex flex-col justify-between space-y-3 shrink-0">
        <h3 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b border-primary/10 pb-2">
          <Icons.BrainCircuit className="w-5 h-5 text-primary animate-pulse" />
          Neural AI Intelligence Recommendations
        </h3>
        <p className="text-slate-300 text-xs leading-relaxed">
          Platform telemetry models detect a 14% elevation in rain delay parameters near Chennai central. Recommend coordinating rescue cruiser allocations and prioritizing pediatric beds triaging booking queues.
          {criticalCount > 0 && (
            <span className="text-red-300"> ⚠ {criticalCount} critical case(s) currently active — maximum response posture advised.</span>
          )}
        </p>
      </div>
    </div>
  );
}
