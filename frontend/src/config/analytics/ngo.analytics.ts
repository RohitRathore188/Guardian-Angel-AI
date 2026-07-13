import { AnalyticsConfig } from './types';

const ngoAnalytics: AnalyticsConfig = {
  role: 'ngo',
  kpis: [
    {
      id: 'ngo-shelter-capacity',
      title: 'Shelter Capacity',
      value: '38 beds',
      trend: 'Normal',
      trendDirection: 'neutral',
      comparison: 'Bed capacity at 65%',
      icon: 'Home',
      status: 'success',
      sparklineData: [40, 38, 35, 35, 38, 38, 38],
    },
    {
      id: 'ngo-families-helped',
      title: 'Families Helped',
      value: '142 Families',
      trend: '+18%',
      trendDirection: 'up',
      comparison: 'vs last 30 days',
      icon: 'Heart',
      status: 'success',
      sparklineData: [100, 110, 120, 130, 135, 140, 142],
    },
    {
      id: 'ngo-food-kits',
      title: 'Food Kits Left',
      value: '90 Kits',
      trend: '-14%',
      trendDirection: 'down',
      comparison: 'Reorder threshold: 30 kits',
      icon: 'Package',
      status: 'warning',
      sparklineData: [150, 130, 120, 110, 105, 95, 90],
    },
    {
      id: 'ngo-volunteers-deployed',
      title: 'NGO Volunteers',
      value: '22 Members',
      trend: '+12%',
      trendDirection: 'up',
      comparison: 'Active field squads online',
      icon: 'Users',
      status: 'success',
      sparklineData: [15, 18, 17, 20, 21, 20, 22],
    },
  ],
  charts: [
    {
      id: 'ngo-supply-trends',
      title: 'Trauma Supplies Inventory Stockpile',
      type: 'Line Chart',
      description: 'Stock levels of rations, medical kits, and blankets.',
      data: [90, 80, 75, 60, 45, 40, 85, 95, 100, 95],
    },
    {
      id: 'ngo-activities-breakdown',
      title: 'NGO Resources Utilization',
      type: 'Donut Chart',
      description: 'Breakdown of fund and material allocations.',
      data: [
        { label: 'Food Rations', value: 45, color: '#f5a623' },
        { label: 'Medical Kits', value: 30, color: '#ef4444' },
        { label: 'Shelter Bedding', value: 25, color: '#10b981' },
      ],
    },
  ],
  leaderboard: {
    title: 'Top Resource Providers',
    entries: [
      { rank: 1, name: 'Hope Family Foundation', score: '142 families aided', subtext: 'Chennai Central sector' },
      { rank: 2, name: 'St. Jude Emergency Care', score: '98 families aided', subtext: 'Periamet sector' },
      { rank: 3, name: 'Municipal Welfare Office', score: '78 families aided', subtext: 'Mylapore sector' },
    ],
  },
  reports: [
    {
      id: 'ngo-inventory-registry',
      title: 'NGO Supplies Stockpile Inventory',
      description: 'Material stock logs, reorder receipts, and allocation manifests.',
      formatOptions: ['PDF', 'Excel'],
    },
    {
      id: 'ngo-volunteers-efficiency',
      title: 'NGO Volunteer Mobilization Audits',
      description: 'Volunteer checked-in hours, response sectors, and case logs.',
      formatOptions: ['CSV', 'Excel', 'JSON'],
    },
  ],
  aiInsights: {
    title: 'NGO Resource Forecast & Allocations',
    body: 'Scanners estimate that heavy rains will continue for 48 hours, causing a 30% reduction in food kit stocks due to increased field demand. Recommend restocking trauma medical kits immediately.',
    confidence: 89,
    recommendations: [
      'Pre-order 50 food kits and baby milk rations.',
      'Deploy 3 extra volunteer squads to Chennai underpass shelter sectors.',
      'Coordinate resource logistics routes with hospital triage networks.',
    ],
  },
  predictions: [
    {
      metric: 'Food Kit Depletion Time',
      value: '4.2 Days',
      confidence: 90,
      factor: 'Increased community distress intake rate',
    },
  ],
  refreshInterval: {
    kpis: 5,
    charts: 30,
    reports: 60,
  },
};

export default ngoAnalytics;
