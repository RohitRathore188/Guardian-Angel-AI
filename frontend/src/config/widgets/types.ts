export type WidgetComponentType =
  | 'Statistic Card'
  | 'Chart'
  | 'Map'
  | 'Table'
  | 'Timeline'
  | 'Activity Feed'
  | 'Quick Action'
  | 'Notification Panel'
  | 'Progress Card'
  | 'Gauge'
  | 'Leaderboard'
  | 'AI Summary';

export type WidgetSize = 'small' | 'medium' | 'large' | 'wide' | 'full';

export interface WidgetConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  component: WidgetComponentType;
  size: WidgetSize;
  priority: number;
  permission: string[];
  refreshInterval: number; // in seconds
  visibility?: boolean;
}
