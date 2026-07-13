import { AnalyticsConfig } from './types';

const childWelfareAnalytics: AnalyticsConfig = {
  role: 'child_welfare',
  kpis: [
    {
      id: 'welfare-children-protected',
      title: 'Children Secured',
      value: '42 Children',
      trend: '+14%',
      trendDirection: 'up',
      comparison: 'vs last 30 days',
      icon: 'Shield',
      status: 'success',
      sparklineData: [20, 25, 28, 30, 35, 38, 42],
    },
    {
      id: 'welfare-pending-placements',
      title: 'Pending Safehouse',
      value: '12 Cases',
      trend: '+25%',
      trendDirection: 'up',
      comparison: 'Intake placement backlog',
      icon: 'Clock',
      status: 'danger',
      sparklineData: [4, 6, 5, 8, 10, 9, 12],
    },
    {
      id: 'welfare-guardians-verified',
      title: 'Biometric Matches',
      value: '98.4%',
      trend: 'Normal',
      trendDirection: 'neutral',
      comparison: 'Facial scan match accuracy',
      icon: 'Fingerprint',
      status: 'success',
      sparklineData: [95, 96, 98, 97, 98, 98, 98.4],
    },
    {
      id: 'welfare-sessions-completed',
      title: 'Counselling Slots',
      value: '18 Sessions',
      trend: '+8 Sessions',
      trendDirection: 'up',
      comparison: 'Completed this week',
      icon: 'Heart',
      status: 'success',
      sparklineData: [4, 8, 10, 12, 14, 16, 18],
    },
  ],
  charts: [
    {
      id: 'welfare-rehab-progress',
      title: 'Rehabilitation Milestones Completed Weekly',
      type: 'Bar Chart',
      description: 'Progress milestone trends for placement custody releases.',
      data: [10, 20, 35, 50, 60, 75, 85, 90, 110, 140],
    },
    {
      id: 'welfare-placements-breakdown',
      title: 'Placement Shelter Allocations',
      type: 'Pie Chart',
      description: 'Distribution of children in municipal and private facilities.',
      data: [
        { label: 'Municipal Safehouse', value: 60, color: '#f5a623' },
        { label: 'NGO Shelter Home', value: 30, color: '#10b981' },
        { label: 'Hospital ER ward', value: 10, color: '#ef4444' },
      ],
    },
  ],
  leaderboard: {
    title: 'Top Performing Caseworkers',
    entries: [
      { rank: 1, name: 'Priya Sharma', score: '18 placement releases', subtext: '98% parent verification rate' },
      { rank: 2, name: ' caseworker Anita L.', score: '14 placement releases', subtext: '94% parent verification rate' },
      { rank: 3, name: ' caseworker Rajesh V.', score: '10 placement releases', subtext: '92% parent verification rate' },
    ],
  },
  reports: [
    {
      id: 'welfare-casefiles-summary',
      title: 'Child Welfare Protection Registry',
      description: 'Clinical therapy progress logs, magistrate custody files, and verification records.',
      formatOptions: ['PDF', 'Excel'],
    },
    {
      id: 'welfare-guardians-audit',
      title: 'Guardian Verification & Identity Matches',
      description: 'Supabase missing children search audits and biometric matching confidence records.',
      formatOptions: ['CSV', 'Excel', 'JSON'],
    },
  ],
  aiInsights: {
    title: 'High Priority Placement Recommendations',
    body: 'Biometric scanners suggest a high match probability for Case #1002 (Emily). Recommend fast-tracking legal review and matching custody certificates with the seeded missing children database.',
    confidence: 96,
    recommendations: [
      'Approve guardian verify credentials for Case #1002.',
      'Schedule counseling psychologist slots for Adyar safehouse admissions.',
      'Audit safety compliance logs at private shelters.',
    ],
  },
  predictions: [
    {
      metric: 'Guardian Verification Speed',
      value: '2.4 Hours',
      confidence: 92,
      factor: 'Gemini facial match comparison optimization',
    },
  ],
  refreshInterval: {
    kpis: 5,
    charts: 30,
    reports: 60,
  },
};

export default childWelfareAnalytics;
