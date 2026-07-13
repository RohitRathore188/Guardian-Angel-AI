import { AnalyticsConfig } from './types';

const citizenAnalytics: AnalyticsConfig = {
  role: 'citizen',
  kpis: [
    {
      id: 'citizen-my-reports',
      title: 'My Reports Logged',
      value: '2 Cases',
      trend: '+100%',
      trendDirection: 'up',
      comparison: 'vs last month',
      icon: 'AlertTriangle',
      status: 'danger',
      sparklineData: [10, 20, 10, 50, 40, 80, 100],
    },
    {
      id: 'citizen-reports-completed',
      title: 'Resolved Cases',
      value: '1 Resolved',
      trend: '100%',
      trendDirection: 'neutral',
      comparison: 'Reunification index complete',
      icon: 'CheckCircle',
      status: 'success',
      sparklineData: [0, 0, 20, 40, 60, 80, 100],
    },
    {
      id: 'citizen-nearby-help',
      title: 'Nearby Rescuers Search',
      value: '14 Units',
      trend: '+12%',
      trendDirection: 'up',
      comparison: 'Active in 5km radius',
      icon: 'MapPin',
      status: 'info',
      sparklineData: [40, 50, 45, 60, 70, 65, 80],
    },
    {
      id: 'citizen-community-score',
      title: 'Helper Points Score',
      value: '250 Pts',
      trend: '+50 Pts',
      trendDirection: 'up',
      comparison: 'Top 15% regional helper rank',
      icon: 'Award',
      status: 'success',
      sparklineData: [50, 100, 120, 150, 200, 220, 250],
    },
  ],
  charts: [
    {
      id: 'citizen-response-speed',
      title: 'Average Safety Mobilization Speed',
      type: 'Bar Chart',
      description: 'Response speed times calculated across neighborhood sectors.',
      data: [15, 30, 45, 65, 35, 75, 90, 85, 60, 55],
    },
    {
      id: 'citizen-active-tracking',
      title: 'Distress Pin Grid Coverage Map',
      type: 'Gauge',
      description: 'AI satellite sweeps coverage score.',
      data: { value: 92 },
    },
  ],
  leaderboard: {
    title: 'Top Community Helpers',
    entries: [
      { rank: 1, name: 'Volunteer Rahul A.', score: '850 pts', subtext: 'Sector 4 Coordinator' },
      { rank: 2, name: 'Volunteer Priya S.', score: '780 pts', subtext: 'Intake triage advisor' },
      { rank: 3, name: 'Citizen Rohit R.', score: '620 pts', subtext: 'Distress spotter' },
    ],
  },
  reports: [
    {
      id: 'citizen-logs-summary',
      title: 'My Incidents Registry Logs',
      description: 'Historical records of all SOS alarms submitted by your account.',
      formatOptions: ['PDF', 'CSV'],
    },
    {
      id: 'citizen-safety-checklist',
      title: 'Guardian AI Safety Guidelines',
      description: 'Custom AI emergency survival steps compiled based on weather and route status.',
      formatOptions: ['PDF', 'JSON'],
    },
  ],
  aiInsights: {
    title: 'Guardian AI Core Recommendations',
    body: 'Environmental scanners indicate high precipitation exposure. Local rescue networks are active. Average responder mobilization time to Adyar sector is currently 3.2 minutes.',
    confidence: 96,
    recommendations: [
      'Seek indoor covered shelter immediately.',
      'Maintain cellular GPS connectivity active.',
      'Keep distressed child calm; rescue cruiser #4 is moving in route.',
    ],
  },
  predictions: [
    {
      metric: 'Weather Impact Delay',
      value: '+2.4 Mins',
      confidence: 88,
      factor: 'Heavy monsoon rainfall in Chennai Central',
    },
  ],
  refreshInterval: {
    kpis: 5,
    charts: 30,
    reports: 60,
  },
};

export default citizenAnalytics;
