import { AnalyticsConfig } from './types';

const hospitalAnalytics: AnalyticsConfig = {
  role: 'hospital',
  kpis: [
    {
      id: 'hospital-patients-intake',
      title: 'Emergency Intake',
      value: '12 Patients',
      trend: '+25%',
      trendDirection: 'up',
      comparison: 'vs last 24 hours',
      icon: 'Activity',
      status: 'danger',
      sparklineData: [4, 6, 5, 8, 10, 9, 12],
    },
    {
      id: 'hospital-beds-available',
      title: 'ER Beds Available',
      value: '14 Beds',
      trend: '-12%',
      trendDirection: 'down',
      comparison: 'Bed capacity at 82%',
      icon: 'Home',
      status: 'warning',
      sparklineData: [20, 18, 16, 15, 14, 15, 14],
    },
    {
      id: 'hospital-doctors-active',
      title: 'Doctors Active',
      value: '8 Roster',
      trend: 'Normal',
      trendDirection: 'neutral',
      comparison: 'Pediatric care teams online',
      icon: 'Heart',
      status: 'success',
      sparklineData: [6, 8, 8, 8, 7, 8, 8],
    },
    {
      id: 'hospital-ambulances-ready',
      title: 'Ready Ambulances',
      value: '4 Units',
      trend: '+10%',
      trendDirection: 'up',
      comparison: 'Response radius 5km active',
      icon: 'Truck',
      status: 'success',
      sparklineData: [2, 3, 2, 4, 4, 3, 4],
    },
  ],
  charts: [
    {
      id: 'hospital-occupancy-trend',
      title: 'Trauma ER Bed Occupancy Weekly Ticks',
      type: 'Line Chart',
      description: 'ER bed capacity utilization metrics.',
      data: [65, 70, 75, 80, 85, 90, 75, 70, 60, 58],
    },
    {
      id: 'hospital-response-breakdown',
      title: 'Trauma Severity Distribution',
      type: 'Donut Chart',
      description: 'Distribution of patient risk indices during intake scans.',
      data: [
        { label: 'Critical Trauma', value: 40, color: '#e94560' },
        { label: 'Moderate Exposure', value: 45, color: '#f5a623' },
        { label: 'Minor Ailment', value: 15, color: '#32c5ff' },
      ],
    },
  ],
  leaderboard: {
    title: 'Top Performing Medical Teams',
    entries: [
      { rank: 1, name: 'Pediatric ICU Team A', score: '3.1 Mins Mobilize', subtext: '96% critical recovery success' },
      { rank: 2, name: 'Emergency Roster Unit B', score: '3.4 Mins Mobilize', subtext: '91% critical recovery success' },
      { rank: 3, name: 'Ambulance Crew #4', score: '3.8 Mins Mobilize', subtext: '88% routing efficiency' },
    ],
  },
  reports: [
    {
      id: 'hospital-triage-registry',
      title: 'Pediatric ICU Admission Registry',
      description: 'Confidential clinical case logs, AI severity assessments, and custody release files.',
      formatOptions: ['PDF', 'Excel'],
    },
    {
      id: 'hospital-ambulance-logs',
      title: 'Ambulance Routing & OSRM Telemetry',
      description: 'Trauma vehicle dispatch timestamps, driver coordinates, and fuel registries.',
      formatOptions: ['CSV', 'Excel', 'JSON'],
    },
  ],
  aiInsights: {
    title: 'Patient Load Prediction & Triage Forecast',
    body: 'Guardian AI models predict a 20% surge in pediatric admissions within the next 4 hours due to heavy rain and flash floods. Recommend allocating 4 extra backup beds in Safehouse Placement units.',
    confidence: 91,
    recommendations: [
      'Pre-allocate 4 extra beds in the pediatric overflow ward.',
      'Request additional type O-Negative blood units from the central registry.',
      'Coordinate trauma transport cruiser routes with local Police cruisers.',
    ],
  },
  predictions: [
    {
      metric: 'Surge In admissions',
      value: '+20% Admissions',
      confidence: 88,
      factor: 'Severe flooding and waterborne infection risk',
    },
    {
      metric: 'Bed Capacity Saturation',
      value: '95% Saturation',
      confidence: 84,
      factor: 'High ICU occupancy and triage delays',
    },
  ],
  refreshInterval: {
    kpis: 5,
    charts: 30,
    reports: 60,
  },
};

export default hospitalAnalytics;
