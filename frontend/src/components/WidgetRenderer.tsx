import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import type { WidgetConfig, WidgetSize } from '../config/widgets/types';
import LiveMap from './LiveMap';
import { getActions } from '../config/actions';
import ActionButton from './ActionButton';
import { getEventLogs } from '../core/events/eventLogger';

// Helper to resolve dynamic Lucide icons from string name
const getIconComponent = (iconName: string) => {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent ? <IconComponent className="w-4 h-4" /> : <Icons.HelpCircle className="w-4 h-4" />;
};

interface WidgetRendererProps {
  widget: WidgetConfig;
  role: string;
  cases: any[];
  setCases: React.Dispatch<React.SetStateAction<any[]>>;
  selectedCase: any | null;
  setSelectedCase: (c: any | null) => void;
  handleStatusUpdate: (caseId: string, status: string) => void;
  notifications: any[];
  addNotification: (notification: any) => void;
  mockAgencies: any[];
  startDispatchAnimation: (caseId: string, lat: number, lng: number) => void;
  activeDispatches: Record<string, any>;
  demoModeActive: boolean;
  
  actionLogs: any[];
  logAction: (actionLog: any) => void;

  // Drag & drop extensions
  index: number;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
}

export default function WidgetRenderer({
  widget,
  role,
  cases,
  setCases,
  selectedCase,
  setSelectedCase,
  handleStatusUpdate,
  notifications,
  addNotification,
  mockAgencies,
  startDispatchAnimation: _startDispatchAnimation,
  activeDispatches,
  demoModeActive: _demoModeActive,
  actionLogs,
  logAction,
  index,
  onDragStart,
  onDragOver,
  onDrop,
}: WidgetRendererProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSeed, setDataSeed] = useState(0);

  // Simulated loading state for dynamic feel
  useEffect(() => {
    setLoading(true);
    const delay = Math.random() * 600 + 200;
    const timer = setTimeout(() => {
      setLoading(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [widget.id, role]);

  // Refresh polling loop
  useEffect(() => {
    if (widget.refreshInterval <= 0) return;

    const interval = setInterval(() => {
      // Simulate data updates
      setDataSeed((prev) => prev + 1);
      
      // Simulate rare connection errors for realism
      if (Math.random() < 0.01) {
        setError("Network response timeout. Please retry.");
      } else {
        setError(null);
      }
    }, widget.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [widget.refreshInterval]);

  const sizeClasses: Record<WidgetSize, string> = {
    small: 'col-span-12 md:col-span-4 lg:col-span-3 h-52',
    medium: 'col-span-12 md:col-span-6 lg:col-span-4 h-64',
    large: 'col-span-12 lg:col-span-6 h-80',
    wide: 'col-span-12 lg:col-span-8 h-80',
    full: 'col-span-12 h-96',
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const renderSkeleton = () => (
    <div className="w-full h-full bg-dark-900/40 border border-white/5 rounded-2xl p-5 flex flex-col justify-between animate-pulse">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white/5 rounded-lg" />
          <div className="h-4 bg-white/5 rounded w-2/3" />
        </div>
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
      <div className="h-12 bg-white/5 rounded w-full" />
    </div>
  );

  const renderError = () => (
    <div className="w-full h-full bg-red-950/20 border border-red-500/20 rounded-2xl p-5 flex flex-col justify-between text-xs">
      <div>
        <p className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Icons.AlertCircle className="w-4 h-4" /> Load Error
        </p>
        <p className="text-slate-400 mt-2">{error || "Failed to load widget payload."}</p>
      </div>
      <button
        onClick={handleRetry}
        className="w-full py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg font-bold hover:bg-red-500/20 transition-all uppercase text-[9px] tracking-widest"
      >
        Retry Refresh
      </button>
    </div>
  );

  const renderWidgetContent = () => {
    switch (widget.component) {
      case 'Statistic Card': {
        // Compute mock stats dynamically
        let value = '0';
        let desc = 'System operational';
        let color = 'text-white';

        if (widget.id.includes('critical-cases')) {
          const critCount = cases.filter(c => c.ai_severity === 'critical' && c.status !== 'closed').length;
          value = `${critCount} Cases`;
          desc = 'Awaiting active dispatcher';
          color = 'text-primary';
        } else if (widget.id.includes('response-eta')) {
          value = '2.8 Mins';
          desc = 'Avg precinct mobilization speed';
          color = 'text-blue-400';
        } else if (widget.id.includes('doctors-available')) {
          value = '14 Doctors';
          desc = 'Roster active in pediatric ER';
          color = 'text-blue-400';
        } else if (widget.id.includes('volunteer-distance')) {
          value = '0.7 Km';
          desc = 'Response range to distress pin';
          color = 'text-emerald-400';
        } else if (widget.id.includes('volunteer-hero-points')) {
          value = `${850 + dataSeed * 10} pts`;
          desc = 'Top 5% regional helper rating';
          color = 'text-emerald-400';
        } else if (widget.id.includes('ngo-volunteer-pool')) {
          value = '38 Members';
          desc = 'On-call volunteer units';
          color = 'text-orange-400';
        } else if (widget.id.includes('welfare-awaiting-care')) {
          value = '12 Children';
          desc = 'Safehouse placement pending';
          color = 'text-pink-400';
        } else if (widget.id.includes('national-statistics')) {
          value = '98.4%';
          desc = 'System-wide rescue success rate';
          color = 'text-white';
        } else {
          value = `${25 + (dataSeed % 12)}`;
          desc = 'Live system telemetry scan';
        }

        return (
          <div className="flex flex-col justify-between h-full pt-1">
            <div>
              <p className={`text-3xl font-black tracking-tight ${color}`}>{value}</p>
            </div>
            <p className="text-slate-500 text-[10px]">{desc}</p>
          </div>
        );
      }

      case 'Chart': {
        const heights = widget.id.includes('response')
          ? [15, 30, 45, 60, 20, 80, 45, 95, 35, 75]
          : widget.id.includes('capacity')
          ? [65, 70, 75, 80, 85, 90, 75, 70, 60, 58]
          : widget.id.includes('hours')
          ? [10, 20, 35, 50, 60, 75, 85, 90, 110, 140]
          : [90, 80, 75, 60, 45, 40, 85, 95, 100, 95];

        const barColor = widget.id.includes('response')
          ? 'bg-primary/20 border-primary/50 hover:bg-primary/40'
          : widget.id.includes('hours')
          ? 'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/40'
          : 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/40';

        return (
          <div className="flex flex-col justify-between h-full pt-1">
            <div className="flex gap-2 items-end h-32 border-b border-white/5 pb-2">
              {heights.map((h, idx) => {
                const simulatedHeight = Math.min(100, Math.max(10, h + (dataSeed % 5) - 2));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                    <div
                      className={`w-full rounded-t border transition-all duration-300 ${barColor}`}
                      style={{ height: `${simulatedHeight}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-semibold uppercase tracking-wider mt-1">
              <span>Start</span>
              <span>Midpoint</span>
              <span>Target</span>
            </div>
          </div>
        );
      }

      case 'Map': {
        return (
          <div className="w-full h-full relative rounded-xl overflow-hidden border border-white/5 bg-dark-950">
            <LiveMap
              cases={cases}
              selectedCase={selectedCase}
              onCaseSelect={setSelectedCase}
              showHeatmap={widget.id.includes('heatmap')}
              showTraffic={false}
              showSearchZones={true}
              activeDispatches={activeDispatches}
              role={role}
            />
          </div>
        );
      }

      case 'Table': {
        if (widget.id.includes('logs-audit')) {
          return (
            <div className="space-y-2 overflow-y-auto h-full scrollbar text-[10px] pt-1">
              {actionLogs && actionLogs.length > 0 ? (
                actionLogs.slice(0, 5).map((log, i) => (
                  <div key={i} className="bg-dark-950/50 p-2 rounded border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-white font-bold">{log.who} ({log.role.toUpperCase()})</span>
                      <span className="text-slate-500 font-mono">{log.when}</span>
                    </div>
                    <p className="text-slate-400">
                      Ran: <strong className="text-primary">{log.actionTitle}</strong> on Case #{log.caseId.slice(0,8).toUpperCase()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-center py-6">No action audit logs captured yet.</div>
              )}
            </div>
          );
        }

        if (widget.id.includes('active-reports')) {
          return (
            <div className="space-y-2 overflow-y-auto h-full scrollbar text-[10px] pt-1">
              {cases.slice(0, 4).map((c) => (
                <div key={c.id} className="bg-dark-950/50 p-2 rounded border border-white/5 flex justify-between items-center">
                  <span className="truncate max-w-[120px] text-white font-semibold">{c.location.address}</span>
                  <span className="text-slate-400 font-mono">#{c.id.slice(0, 8).toUpperCase()}</span>
                </div>
              ))}
            </div>
          );
        }

        if (widget.id.includes('dispatch-queue')) {
          const dispatchCases = cases.filter(c => c.status === 'reported' || c.status === 'dispatched');
          return (
            <div className="space-y-2 overflow-y-auto h-full scrollbar text-[10px] pt-1">
              {dispatchCases.slice(0, 4).map((c) => (
                <div key={c.id} className="bg-dark-950/50 p-2 rounded border border-white/5 flex justify-between items-center">
                  <span className="truncate max-w-[120px] text-slate-300">{c.location.address}</span>
                  <button
                    onClick={() => handleStatusUpdate(c.id, 'dispatched')}
                    className="px-2 py-0.5 bg-primary/20 hover:bg-primary/40 border border-primary/40 text-white rounded text-[8px] uppercase font-bold"
                  >
                    Dispatch
                  </button>
                </div>
              ))}
            </div>
          );
        }

        return (
          <div className="space-y-2 overflow-y-auto h-full scrollbar text-[10px] pt-1">
            {mockAgencies.slice(0, 4).map((a, i) => (
              <div key={i} className="bg-dark-950/50 p-2 rounded border border-white/5 flex justify-between items-center">
                <span className="text-slate-300 font-medium">{a.name}</span>
                <span className="text-slate-500">{a.phone}</span>
              </div>
            ))}
          </div>
        );
      }

      case 'Timeline': {
        const steps = [
          { label: 'SOS Alert Logged', desc: 'Active telemetry broadcast active.', done: true },
          { label: 'AI Risk Verification', desc: 'severity classification complete.', done: true },
          { label: 'Tactical Unit Dispatched', desc: 'Ambulance / Cruiser en route.', done: selectedCase?.status !== 'reported' },
          { label: 'Resolution & Recovery', desc: 'Secure facility custody match.', done: selectedCase?.status === 'rescued' }
        ];

        return (
          <div className="relative border-l border-white/5 pl-4 ml-2.5 space-y-3 text-[10px] text-slate-400 overflow-y-auto h-full scrollbar pt-1.5">
            {steps.map((s, idx) => (
              <div key={idx} className="relative">
                <div className={`absolute -left-[22px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center border ${
                  s.done ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-dark-700 border-white/5 text-slate-500'
                }`}>
                  {s.done ? <Icons.Check className="w-2.5 h-2.5" /> : <div className="w-1 h-1 rounded-full bg-slate-600" />}
                </div>
                <p className={`font-bold ${s.done ? 'text-white' : 'text-slate-500'}`}>{s.label}</p>
                <p className="text-[9px] text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        );
      }

      case 'Activity Feed': {
        const liveLogs = getEventLogs();
        return (
          <div className="space-y-2.5 overflow-y-auto h-full scrollbar text-[10px] pt-1">
            {liveLogs.length > 0 ? (
              liveLogs.slice(0, 10).map((log, i) => (
                <div key={i} className="flex gap-2 items-start border-b border-white/5 pb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 animate-pulse" />
                  <div className="space-y-0.5">
                    <p className="text-slate-400 leading-normal">
                      <span className="text-slate-500 font-mono">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                      <strong className="text-white">{log.userName} ({log.userRole.toUpperCase()})</strong>:{' '}
                      <span className="text-primary font-bold">{log.eventType}</span>
                    </p>
                    {log.details && log.details !== '{}' && (
                      <p className="text-slate-500 italic text-[9px] truncate max-w-[220px]">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-center py-6">No real-time event logs detected on the bus yet.</div>
            )}
          </div>
        );
      }

      case 'Quick Action': {
        const actionContext = {
          currentCase: selectedCase,
          currentRole: role,
          user: { name: 'Operator' },
          cases,
          setCases,
          setSelectedCase,
          activeDispatches,
          startDispatchAnimation: _startDispatchAnimation,
          addNotification,
          playAlertSound: () => {},
          navigate: () => {},
          logAction,
        };

        const actions = getActions(role, actionContext);

        return (
          <div className="grid grid-cols-1 gap-2 pt-1">
            {actions.slice(0, 3).map((act) => (
              <ActionButton
                key={act.id}
                action={act}
                context={{ ...actionContext, logAction }}
                size="sm"
              />
            ))}
          </div>
        );
      }

      case 'Notification Panel': {
        return (
          <div className="space-y-2 overflow-y-auto h-full scrollbar text-[10px] pt-1">
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className="p-2 bg-dark-950/50 rounded border border-white/5">
                <p className="text-white font-semibold flex items-center justify-between">
                  <span>{n.title}</span>
                  <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400">{n.category}</span>
                </p>
                <p className="text-slate-400 mt-1 text-[9px]">{n.body}</p>
              </div>
            ))}
          </div>
        );
      }

      case 'Progress Card': {
        const meters = widget.id.includes('food')
          ? { label: 'Food Ration Stockpile', val: 78 }
          : widget.id.includes('medical')
          ? { label: 'Trauma Medical Kits', val: 92 }
          : widget.id.includes('hero')
          ? { label: 'Hero Points Progress', val: 65 }
          : { label: 'System Health Integrations', val: 98 };

        return (
          <div className="flex flex-col justify-between h-full pt-1">
            <div>
              <p className="text-white font-bold text-xs">{meters.label}</p>
              <p className="text-2xl font-black text-white mt-1">{meters.val}%</p>
            </div>
            <div className="w-full bg-dark-950 rounded-full h-1.5 overflow-hidden border border-white/5">
              <div className="bg-primary h-full rounded-full" style={{ width: `${meters.val}%` }} />
            </div>
          </div>
        );
      }

      case 'Gauge': {
        const value = widget.id.includes('beds') ? 82 : widget.id.includes('officers') ? 45 : 78;
        const offset = 125.7 - (125.7 * value) / 100;
        return (
          <div className="flex flex-col items-center justify-center h-full relative pt-1">
            <svg className="w-40 h-24 transform rotate-180" viewBox="0 0 100 60">
              {/* Background Semicircle */}
              <path
                d="M10,50 A40,40 0 0,1 90,50"
                fill="none"
                stroke="#111118"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Active Value Arc */}
              <path
                d="M10,50 A40,40 0 0,1 90,50"
                fill="none"
                stroke={widget.id.includes('beds') ? '#10b981' : '#3b82f6'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="125.7"
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: `drop-shadow(0 0 4px ${widget.id.includes('beds') ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'})`
                }}
              />
            </svg>
            <div className="absolute bottom-1 flex flex-col items-center justify-center">
              <span className="text-white text-2xl font-black font-mono leading-none">{value}%</span>
              <span className="text-[7.5px] text-slate-500 uppercase tracking-widest font-bold mt-1.5">
                {widget.id.includes('beds') ? 'ER Bed Load' : widget.id.includes('officers') ? 'Active Patrols' : 'Utilization'}
              </span>
            </div>
          </div>
        );
      }

      case 'Leaderboard': {
        const ranks = [
          { name: 'Volunteer Rahul A.', rating: '4.9', pts: '850' },
          { name: 'Volunteer Priya S.', rating: '4.8', pts: '780' },
          { name: 'Volunteer Rohit R.', rating: '4.7', pts: '620' }
        ];

        return (
          <div className="space-y-2.5 overflow-y-auto h-full scrollbar text-[10px] pt-1">
            {ranks.map((r, i) => (
              <div key={i} className="flex justify-between items-center bg-dark-950/50 p-2 rounded border border-white/5">
                <span className="text-slate-300">{i + 1}. {r.name}</span>
                <span className="text-emerald-400 font-bold">{r.pts} pts</span>
              </div>
            ))}
          </div>
        );
      }

      case 'AI Summary': {
        return (
          <div className="bg-red-500/5 p-3 rounded-lg border border-primary/20 text-[10px] text-slate-300 leading-relaxed h-full overflow-y-auto scrollbar">
            <strong>Guardian AI Recommendation:</strong>
            <p className="mt-1">
              Neural visual sweeps indicate optimal route efficiency through secondary arterial roads. Recommend priority level 4 dispatch response cruiser and trauma hospital triage booking. Scan reports are synced dynamically.
            </p>
          </div>
        );
      }

      default:
        return <div className="text-slate-500 text-xs">Unsupported widget display style.</div>;
    }
  };

  if (loading) return renderSkeleton();
  if (error) return renderError();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, index)}
      onDragOver={(e) => onDragOver && onDragOver(e, index)}
      onDrop={(e) => onDrop && onDrop(e, index)}
      className={`${sizeClasses[widget.size]} card border border-white/10 bg-dark-900/40 p-4 flex flex-col justify-between hover:border-white/20 transition-all overflow-hidden cursor-grab active:cursor-grabbing relative group`}
    >
      {/* Widget Header */}
      <div className="flex justify-between items-start shrink-0 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-400 group-hover:text-primary transition-all">
            {getIconComponent(widget.icon)}
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">{widget.title}</h4>
            <p className="text-slate-500 text-[9px] mt-0.5">{widget.subtitle}</p>
          </div>
        </div>
        
        {/* Drag handle dots visually indicated for Grafana layout feel */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 text-slate-600">
          <Icons.GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Widget Renderable Area */}
      <div className="flex-1 overflow-hidden">
        {renderWidgetContent()}
      </div>
    </div>
  );
}
