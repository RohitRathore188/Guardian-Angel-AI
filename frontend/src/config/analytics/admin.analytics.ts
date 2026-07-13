import { AnalyticsConfig } from './types';

const adminAnalytics: AnalyticsConfig = {
  role: 'admin',
  kpis: [
    {
      id: 'admin-national-cases',
      title: 'National Rescue Cases',
      value: '142 Cases',
      trend: '+18%',
      trendDirection: 'up',
      comparison: 'vs last 30 days',
      icon: 'Database',
      status: 'info',
      sparklineData: [80, 95, 110, 115, 125, 130, 142],
    },
    {
      id: 'admin-critical-cases',
      title: 'Critical Active Alerts',
      value: '2 Cases',
      trend: '-50%',
      trendDirection: 'down',
      comparison: 'Active OSRM tracking paths',
      icon: 'AlertOctagon',
      status: 'danger',
      sparklineData: [6, 4, 3, 2, 4, 3, 2],
    },
    {
      id: 'admin-ai-confidence',
      title: 'AI Match Confidence',
      value: '94.2%',
      trend: '+1.4%',
      trendDirection: 'up',
      comparison: 'Gemini visual sweeps accuracy',
      icon: 'Brain',
      status: 'success',
      sparklineData: [88, 90, 91, 93, 94, 94.2, 94.2],
    },
    {
      id: 'admin-system-health',
      title: 'OSRM / API Health',
      value: '99.8%',
      trend: 'Normal',
      trendDirection: 'neutral',
      comparison: 'Supabase real-time latency: 42ms',
      icon: 'Activity',
      status: 'success',
      sparklineData: [99.8, 99.8, 99.7, 99.8, 99.9, 99.8, 99.8],
    },
  ],
  charts: [
    {
      id: 'admin-response-efficiency',
      title: 'National Rescue Time Weekly Trends',
      type: 'Area Chart',
      description: 'Average mobilize and rescue time durations in hours.',
      data: [15, 30, 45, 60, 20, 80, 45, 95, 35, 75],
    },
    {
      id: 'admin-performance-breakdown',
      title: 'Agency Case Distribution',
      type: 'Pie Chart',
      description: 'Caseload allocation percentage mapping.',
      data: [
        { label: 'Police cruisings', value: 45, color: '#ef4444' },
        { label: 'Hospital ER beds', value: 35, color: '#3b82f6' },
        { label: 'NGO / Welfare Sheltering', value: 20, color: '#10b981' },
      ],
    },
  ],
  leaderboard: {
    title: 'Top Agency Responders',
    entries: [
      { rank: 1, name: 'Precinct 17 Police Unit', score: '3.1 min ETA', subtext: '98.4% rescue success' },
      { rank: 2, name: 'St. Jude emergency medical', score: '3.5 min ETA', subtext: '96.2% triage success' },
      { rank: 3, name: 'Hope Family Foundation', score: '4.2 min ETA', subtext: '94.1% allocation success' },
    ],
  },
  reports: [
    {
      id: 'admin-national-summary',
      title: 'National Rescue Telemetry Ledger',
      description: 'Complete audit trace logs of dispatches, OSRM coordinate indices, and visual scan records.',
      formatOptions: ['PDF', 'CSV', 'Excel', 'JSON'],
    },
    {
      id: 'admin-diagnostics-monitor',
      title: 'System Health & Server Logins',
      description: 'Supabase webhook parameters, API request latency, and login profile logs.',
      formatOptions: ['CSV', 'JSON'],
    },
  ],
  aiInsights: {
    title: 'National Intelligence & AI Forecast',
    body: 'Central intelligence scanner indicates high system-wide efficiency with response speeds reaching standard targets (avg 2.8 mins). AI recommends upgrading safehouse placements near low-ground sectors.',
    confidence: 96,
    recommendations: [
      'Scale up NGO shelter capacity in sector 4 underpass sectors.',
      'Deploy Gemini matching model patches to hospital visual endpoints.',
      'Schedule legal review checks for pending placements.',
    ],
  },
  predictions: [
    {
      metric: 'AI Match Accuracy Index',
      value: '96.2% Confidence',
      confidence: 94,
      factor: 'Optimized visual eye alignment models',
    },
    {
      metric: 'System Load Surge',
      value: '+15% telemetries',
      confidence: 88,
      factor: 'Evening volunteer login surge',
    },
  ],
  refreshInterval: {
    kpis: 5,
    charts: 30,
    reports: 60,
  },
};

export default adminAnalytics;
