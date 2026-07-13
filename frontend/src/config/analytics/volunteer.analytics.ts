import { AnalyticsConfig } from './types';

const volunteerAnalytics: AnalyticsConfig = {
  role: 'volunteer',
  kpis: [
    {
      id: 'volunteer-missions-completed',
      title: 'Missions Completed',
      value: '14 Missions',
      trend: '+16%',
      trendDirection: 'up',
      comparison: 'vs last 30 days',
      icon: 'Award',
      status: 'success',
      sparklineData: [4, 6, 8, 9, 11, 12, 14],
    },
    {
      id: 'volunteer-hours-served',
      title: 'Hours Served',
      value: '38 Hours',
      trend: '+8 Hours',
      trendDirection: 'up',
      comparison: 'Active field service time',
      icon: 'Clock',
      status: 'info',
      sparklineData: [10, 15, 20, 25, 30, 35, 38],
    },
    {
      id: 'volunteer-hero-score',
      title: 'Hero Points Score',
      value: '850 Pts',
      trend: '+120 Pts',
      trendDirection: 'up',
      comparison: 'Top 5% regional helper rating',
      icon: 'Award',
      status: 'success',
      sparklineData: [400, 500, 550, 600, 700, 750, 850],
    },
    {
      id: 'volunteer-rank-community',
      title: 'Regional Rank',
      value: '# 12 Helper',
      trend: 'Top 5%',
      trendDirection: 'up',
      comparison: 'Within Chennai Sector 4',
      icon: 'Users',
      status: 'success',
      sparklineData: [20, 18, 16, 15, 14, 13, 12],
    },
  ],
  charts: [
    {
      id: 'volunteer-missions-trend',
      title: 'Volunteer Missions Completed Monthly',
      type: 'Bar Chart',
      description: 'Monthly overview of active volunteers help milestones.',
      data: [10, 20, 35, 50, 60, 75, 85, 90, 110, 140],
    },
    {
      id: 'volunteer-categories-completed',
      title: 'Mission Categories Distribution',
      type: 'Pie Chart',
      description: 'Distribution of rescue missions by category.',
      data: [
        { label: 'Child Transport', value: 50, color: '#10b981' },
        { label: 'Supply Distribution', value: 30, color: '#f5a623' },
        { label: 'Area Search Grid', value: 20, color: '#32c5ff' },
      ],
    },
  ],
  leaderboard: {
    title: 'Top Regional Volunteers',
    entries: [
      { rank: 1, name: 'Volunteer Rahul A.', score: '850 Pts', subtext: '14 missions, Chennai' },
      { rank: 2, name: 'Volunteer Priya S.', score: '780 Pts', subtext: '12 missions, Chennai' },
      { rank: 3, name: 'Volunteer Rohit R.', score: '620 Pts', subtext: '9 missions, Chennai' },
    ],
  },
  reports: [
    {
      id: 'volunteer-mission-summary',
      title: 'Volunteer Mission Performance Log',
      description: 'Audit logs of helper point awards, mission durations, and coordinate logs.',
      formatOptions: ['PDF', 'CSV'],
    },
    {
      id: 'volunteer-inventory-dispatch',
      title: 'Dispatched Emergency Kit Audits',
      description: 'Rations, blankets, and safety supplies received and distributed.',
      formatOptions: ['CSV', 'JSON'],
    },
  ],
  aiInsights: {
    title: 'Mission Recommendations & Safety Alerts',
    body: 'OSRM routing engines identify high waterlogging delays along main arterial roads. Guardian AI recommends accepting missions located in Chennai Sector 4 where 3 critical placement notifications are currently pending.',
    confidence: 93,
    recommendations: [
      'Prioritize Child Placement transport mission near Mylapore.',
      'Reroute travel coordinates through local high-ground sectors.',
      'Maintain continuous location telemetry broadcast active.',
    ],
  },
  predictions: [
    {
      metric: 'Volunteer Unit Shortage',
      value: 'High Alert',
      confidence: 85,
      factor: 'Evening sector rush hour traffic gridlock',
    },
  ],
  refreshInterval: {
    kpis: 5,
    charts: 30,
    reports: 60,
  },
};

export default volunteerAnalytics;
