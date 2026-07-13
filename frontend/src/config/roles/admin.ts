import type { RoleConfig } from './types'

const adminConfig: RoleConfig = {
  roleName: 'System Administrator',
  title: 'Guardian Admin',
  subtitle: 'National Crisis & System Command',

  tabs: [
    'Dashboard',
    'User Database',
    'GIS Map',
    'System Health',
    'Audit Log',
    'Analytics',
  ],

  stats: [
    {
      label: 'Global Incidents',
      value: '24 Cases',
      desc: 'Active national registry records',
      color: 'text-primary',
    },
    {
      label: 'System Server',
      value: '99.9% Online',
      desc: 'Supabase & Gemini status OK',
      color: 'text-emerald-400',
    },
    {
      label: 'Global Avg ETA',
      value: '3.2 Mins',
      desc: 'Across all police & ambulance routes',
      color: 'text-blue-400',
    },
  ],

  actions: [
    '📢 Broadcast System Alert',
    '👤 Edit User Roles',
    '⚙️ Toggle Mock Mode',
    '📊 Export Global Audit',
  ],

  chartType: 'global',
  chartTitle: 'National Response Analytics',
  searchPlaceholder: 'Search users, cases, logs...',

  notificationCategories: ['Police', 'Hospital', 'NGO', 'Volunteer', 'Emergency', 'System'],

  caseFilter: 'all',

  mapVisible: true,

  permissions: {
    canDispatch: true,
    canCloseCase: true,
    canEditUsers: true,
    canBroadcast: true,
    canViewAnalytics: true,
    canViewSystemHealth: true,
  },
}

export default adminConfig
