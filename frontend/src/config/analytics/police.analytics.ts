import { AnalyticsConfig } from './types';

const policeAnalytics: AnalyticsConfig = {
  role: 'police',
  kpis: [
    {
      id: 'police-cases-assigned',
      title: 'Cases Assigned',
      value: '24 Cases',
      trend: '+12%',
      trendDirection: 'up',
      comparison: 'vs last 7 days',
      icon: 'ShieldAlert',
      status: 'danger',
      sparklineData: [10, 15, 12, 18, 20, 22, 24],
    },
    {
      id: 'police-cases-completed',
      title: 'Cases Resolved',
      value: '18 Resolved',
      trend: '+22%',
      trendDirection: 'up',
      comparison: '98% success rate met',
      icon: 'CheckCircle2',
      status: 'success',
      sparklineData: [5, 8, 10, 12, 14, 16, 18],
    },
    {
      id: 'police-dispatch-speed',
      title: 'Avg Mobilization ETA',
      value: '2.8 Mins',
      trend: '-14%',
      trendDirection: 'down', // downward trend is good for response speed!
      comparison: 'Goal: under 5 minutes',
      icon: 'Clock',
      status: 'success',
      sparklineData: [4.2, 3.8, 3.5, 3.2, 3.0, 2.9, 2.8],
    },
    {
      id: 'police-cruisers-standby',
      title: 'Standby Patrols',
      value: '8 Units',
      trend: 'Normal',
      trendDirection: 'neutral',
      comparison: 'Precinct capacity active',
      icon: 'Navigation',
      status: 'info',
      sparklineData: [6, 8, 6, 8, 8, 7, 8],
    },
  ],
  charts: [
    {
      id: 'police-hourly-response',
      title: 'Responders Dispatch Speed Ticks',
      type: 'Area Chart',
      description: 'Cruisers ETA trends across active coordinate dispatch sweeps.',
      data: [15, 30, 45, 60, 20, 80, 45, 95, 35, 75],
    },
    {
      id: 'police-severity-breakdown',
      title: 'Severity Breakdown Index',
      type: 'Pie Chart',
      description: 'Breakdown of incident levels logged by platform sensors.',
      data: [
        { label: 'Critical', value: 35, color: '#e94560' },
        { label: 'High', value: 45, color: '#f5a623' },
        { label: 'Moderate', value: 20, color: '#f8e71c' },
      ],
    },
  ],
  leaderboard: {
    title: 'Top Performing Officers',
    entries: [
      { rank: 1, name: 'Officer Sarah J.', score: '98.4%', subtext: '12 completed rescues' },
      { rank: 2, name: 'Officer David K.', score: '95.2%', subtext: '9 completed rescues' },
      { rank: 3, name: 'Officer Aaron Croft', score: '92.1%', subtext: '8 completed rescues' },
    ],
  },
  reports: [
    {
      id: 'police-audit-log',
      title: 'Incidents Caseload Audit Registry',
      description: 'Comprehensive telemetry logs and AI analysis summaries of active and resolved reports.',
      formatOptions: ['PDF', 'CSV', 'Excel'],
    },
    {
      id: 'police-dispatch-efficiency',
      title: 'Response Team Efficiency Logs',
      description: 'Cruiser route routing metrics, fuel allocations, and OSRM precision logs.',
      formatOptions: ['CSV', 'Excel', 'JSON'],
    },
  ],
  aiInsights: {
    title: 'Precinct High Risk Areas Forecast',
    body: 'Gemini spatial density scanners forecast a 14% elevation in risk index near Chennai Central Sector 4 during heavy monsoon hours. Recommend deploying 2 proactive standby units near underpass areas.',
    confidence: 94,
    recommendations: [
      'Proactively stage Cruiser #4 near Chennai Sector 4.',
      'Reroute volunteer patrols via secondary bypass roads.',
      'Alert hospital triage teams of flood hazard risks.',
    ],
  },
  predictions: [
    {
      metric: 'Cruiser Mobilization Delay',
      value: '+1.8 Mins',
      confidence: 92,
      factor: 'Waterlogging hazards near Periamet highway',
    },
    {
      metric: 'Resource Demand Elevation',
      value: '+20%',
      confidence: 85,
      factor: 'Distress reports trend forecast',
    },
  ],
  refreshInterval: {
    kpis: 5,
    charts: 30,
    reports: 60,
  },
};

export default policeAnalytics;
