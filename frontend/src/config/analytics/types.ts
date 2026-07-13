export type ChartType =
  | 'Line Chart'
  | 'Area Chart'
  | 'Bar Chart'
  | 'Stacked Bar'
  | 'Donut Chart'
  | 'Pie Chart'
  | 'Gauge'
  | 'Heatmap'
  | 'Timeline'
  | 'Leaderboard'
  | 'Table';

export interface KPIDefinition {
  id: string;
  title: string;
  value: string | number;
  trend: string; // e.g. "+12.4%" or "-4%"
  trendDirection: 'up' | 'down' | 'neutral';
  comparison: string; // e.g. "vs last 7 days"
  icon: string; // Lucide icon name
  status: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  sparklineData: number[]; // Array of points 0-100
}

export interface ChartDefinition {
  id: string;
  title: string;
  type: ChartType;
  description?: string;
  data: any;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: string | number;
  subtext?: string;
}

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  formatOptions: ('PDF' | 'CSV' | 'Excel' | 'JSON')[];
}

export interface PredictionDefinition {
  metric: string;
  value: string;
  confidence: number; // e.g. 94
  factor: string; // e.g. "Weather impact"
}

export interface AnalyticsConfig {
  role: string;
  kpis: KPIDefinition[];
  charts: ChartDefinition[];
  leaderboard?: {
    title: string;
    entries: LeaderboardEntry[];
  };
  reports: ReportDefinition[];
  aiInsights: {
    title: string;
    body: string;
    confidence: number;
    recommendations: string[];
  };
  predictions?: PredictionDefinition[];
  refreshInterval: {
    kpis: number; // seconds
    charts: number;
    reports: number;
  };
}
