import { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import * as Icons from 'lucide-react';
import { AnalyticsConfig } from '../config/analytics/types';
import KPICard from './KPICard';
import AnalyticsChart from './AnalyticsChart';

interface AnalyticsDashboardProps {
  config: AnalyticsConfig;
  cases: any[];
}

export default function AnalyticsDashboard({ config, cases }: AnalyticsDashboardProps) {
  const { triggerToast } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<'30d' | '7d' | 'critical' | 'completed'>('30d');
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  // Simulated auto-refresh loops per config specification
  const [kpiSeed, setKpiSeed] = useState(0);
  const [chartSeed, setChartSeed] = useState(0);

  useEffect(() => {
    const kpiTimer = setInterval(() => {
      setKpiSeed((prev) => prev + 1);
    }, config.refreshInterval.kpis * 1000);

    const chartTimer = setInterval(() => {
      setChartSeed((prev) => prev + 1);
    }, config.refreshInterval.charts * 1000);

    return () => {
      clearInterval(kpiTimer);
      clearInterval(chartTimer);
    };
  }, [config.role, config.refreshInterval]);

  const handleExport = (reportId: string, format: string) => {
    setDownloadingReportId(`${reportId}-${format}`);
    setTimeout(() => {
      setDownloadingReportId(null);
      triggerToast('Export Successful', `Downloaded report registry file in ${format} format.`, 'success');

      let content = `===========================================================\n`;
      content += `         GUARDIAN ANGEL AI - REPORT REGISTRY EXPORT\n`;
      content += `===========================================================\n`;
      content += `Report ID:    ${reportId.toUpperCase()}\n`;
      content += `Format:       ${format.toUpperCase()}\n`;
      content += `Generated:    ${new Date().toLocaleString()}\n`;
      content += `===========================================================\n\n`;

      if (reportId.includes('diagnostics') || reportId.includes('health')) {
        content += `SYSTEM HEALTH AUDIT LOGS:\n`;
        content += `-----------------------------------------------------------\n`;
        content += `[11:00:23] Webhook Trigger: Public Table 'reports' Insert listener active.\n`;
        content += `[11:01:45] API Gateway request latency: 24ms (Target: <150ms)\n`;
        content += `[11:05:12] Auth Service: Admin Session initialized from IP 127.0.0.1.\n`;
        content += `[11:10:09] Postgres Pool connection established successfully.\n\n`;
      } else {
        content += `NATIONAL RESCUE TELEMETRY LEDGER:\n`;
        content += `-----------------------------------------------------------\n`;
        cases.forEach((c, idx) => {
          content += `${idx + 1}. [Case #${c.id.slice(0, 8)}] Status: ${c.status.toUpperCase()} | Severity: ${c.ai_severity.toUpperCase()} | Address: ${c.location.address} | Lat/Lng: ${c.location.lat}, ${c.location.lng}\n`;
        });
      }

      content += `\n======================= END OF EXPORT =====================`;

      let mimeType = 'text/plain;charset=utf-8';
      let fileExt = 'txt';
      let finalContent = content;

      if (format === 'JSON') {
        mimeType = 'application/json;charset=utf-8';
        fileExt = 'json';
        finalContent = JSON.stringify(cases, null, 2);
      } else if (format === 'CSV') {
        mimeType = 'text/csv;charset=utf-8';
        fileExt = 'csv';
        let csv = 'ID,Status,Severity,Address,Latitude,Longitude,ReportedAt\n';
        cases.forEach((c) => {
          csv += `"${c.id}","${c.status}","${c.ai_severity}","${c.location.address.replace(/"/g, '""')}","${c.location.lat}","${c.location.lng}","${c.created_at}"\n`;
        });
        finalContent = csv;
      } else if (format === 'PDF') {
        mimeType = 'application/pdf;charset=utf-8';
        fileExt = 'pdf';
      } else if (format === 'Excel') {
        mimeType = 'application/vnd.ms-excel;charset=utf-8';
        fileExt = 'xls';
        let xls = '<table><tr><th>ID</th><th>Status</th><th>Severity</th><th>Address</th><th>Latitude</th><th>Longitude</th></tr>';
        cases.forEach((c) => {
          xls += `<tr><td>${c.id}</td><td>${c.status}</td><td>${c.ai_severity}</td><td>${c.location.address}</td><td>${c.location.lat}</td><td>${c.location.lng}</td></tr>`;
        });
        xls += '</table>';
        finalContent = xls;
      }

      const blob = new Blob([finalContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportId.toLowerCase().replace(/\s+/g, '_')}_export.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1500);
  };

  // Adjust KPI values dynamically based on seed ticks to simulate live Power BI feeds
  const getDynamicKpis = () => {
    return config.kpis.map((kpi) => {
      if (kpi.id.includes('cases-assigned')) {
        const activeCount = cases.filter((c) => c.status !== 'closed').length;
        return { ...kpi, value: `${activeCount} Cases` };
      }
      if (kpi.id.includes('critical-cases')) {
        const critCount = cases.filter((c) => c.ai_severity === 'critical' && c.status !== 'closed').length;
        return { ...kpi, value: `${critCount} Cases` };
      }
      if (kpi.id.includes('my-reports')) {
        return { ...kpi, value: `${2 + (kpiSeed % 2)} Cases` };
      }
      return kpi;
    });
  };

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto scrollbar pr-1">
      {/* Filters & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: '30d', label: 'Last 30 Days' },
            { id: '7d', label: 'Last 7 Days' },
            { id: 'critical', label: 'Critical Severity' },
            { id: 'completed', label: 'Completed Rescues' },
          ].map((filt) => (
            <button
              key={filt.id}
              onClick={() => setActiveFilter(filt.id as any)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeFilter === filt.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-dark-900/40 text-slate-400 border-white/5 hover:border-white/10'
              }`}
            >
              {filt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono uppercase">
          <Icons.RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Auto-refresh Active</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {getDynamicKpis().map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Charts & Leaderboard Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Charts Column */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {config.charts.map((chart) => (
            <AnalyticsChart
              key={chart.id}
              chart={{
                ...chart,
                // Mutate chart data values slightly on seed ticks for animation feel
                data: Array.isArray(chart.data)
                  ? chart.data.map((h) => Math.min(150, Math.max(10, h + (chartSeed % 4) - 2)))
                  : chart.data,
              }}
            />
          ))}
        </div>

        {/* Leaderboard Column (Right) */}
        {config.leaderboard && (
          <div className="lg:col-span-4 card p-5 border border-white/10 bg-dark-900/40 flex flex-col justify-between h-64 overflow-hidden">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-2 mb-3">
              {config.leaderboard.title}
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3.5 scrollbar text-[10px]">
              {config.leaderboard.entries.map((ent, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-dark-950/50 p-2.5 rounded-xl border border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center font-bold text-slate-400 border border-white/10">
                      {ent.rank}
                    </span>
                    <div>
                      <p className="text-white font-bold">{ent.name}</p>
                      {ent.subtext && <p className="text-slate-500 text-[9px] mt-0.5">{ent.subtext}</p>}
                    </div>
                  </div>
                  <span className="text-emerald-450 font-bold font-mono">{ent.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Split row: AI Intelligence Insights & Predictions & Reports center */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
        {/* Left: Guardian AI Intelligence Summary */}
        <div className="card p-5 border border-primary/20 bg-primary/5 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start border-b border-primary/10 pb-2.5">
            <div>
              <h3 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
                <Icons.Brain className="w-5 h-5 text-primary animate-pulse" />
                {config.aiInsights.title}
              </h3>
              <p className="text-slate-400 text-[9px] mt-0.5">Confidence Assessment Metric</p>
            </div>
            <span className="text-primary font-black text-xs font-mono bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
              {config.aiInsights.confidence}% Accurate
            </span>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed">
            {config.aiInsights.body}
          </p>

          <div className="space-y-2">
            <span className="text-slate-500 uppercase font-black text-[8px] tracking-wider block">
              Proactive AI Actions Recommended
            </span>
            <ul className="space-y-1.5 text-[10px] text-slate-300">
              {config.aiInsights.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2 items-start leading-normal">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Predictions Deck */}
          {config.predictions && config.predictions.length > 0 && (
            <div className="pt-2 border-t border-primary/15 space-y-2">
              <span className="text-slate-500 uppercase font-black text-[8px] tracking-wider block">
                Predictive AI Forecasts (Simulated)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                {config.predictions.map((pred, i) => (
                  <div key={i} className="bg-dark-950/50 p-2 rounded-lg border border-primary/10 flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 font-medium">{pred.metric}</p>
                      <p className="text-[9px] text-slate-500 italic mt-0.5">{pred.factor}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-extrabold">{pred.value}</p>
                      <p className="text-[8px] text-slate-500">{pred.confidence}% Conf.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Reports & Exports Center */}
        <div className="card p-5 border border-white/10 bg-dark-900/40 flex flex-col justify-between">
          <div className="shrink-0 mb-4 border-b border-white/5 pb-2">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider">
              Reports & Exports Center
            </h3>
            <p className="text-slate-500 text-[9px] mt-0.5">Export role-specific data tables directly to files.</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto scrollbar max-h-[300px]">
            {config.reports.map((rep) => (
              <div key={rep.id} className="p-4 bg-dark-950/40 rounded-xl border border-white/5 space-y-3">
                <div>
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">{rep.title}</h4>
                  <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">{rep.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rep.formatOptions.map((fmt) => {
                    const isDownloading = downloadingReportId === `${rep.id}-${fmt}`;
                    return (
                      <button
                        key={fmt}
                        onClick={() => handleExport(rep.id, fmt)}
                        disabled={downloadingReportId !== null}
                        className="px-2.5 py-1 bg-dark-800 hover:bg-dark-700 disabled:opacity-40 border border-white/5 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1"
                      >
                        {isDownloading ? (
                          <Icons.Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Icons.Download className="w-3 h-3" />
                        )}
                        <span>{fmt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
