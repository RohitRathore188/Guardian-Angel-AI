import type { RoleConfig } from './types'

const policeConfig: RoleConfig = {
  roleName: 'Tactical Commander',
  title: 'Guardian Tactical',
  subtitle: 'Precinct Dispatch & Commander Console',

  tabs: ['Dashboard', 'Cases', 'GIS Map', 'Patrol Queue', 'Analytics'],

  stats: [
    {
      label: 'Active Dispatches',
      value: '4 Patrols',
      desc: 'Cruisers en route',
      color: 'text-primary',
    },
    {
      label: 'Response ETA',
      value: '2.8 Mins',
      desc: 'Avg precinct mobilization time',
      color: 'text-blue-400',
    },
    {
      label: 'Units Standby',
      value: '8 Officers',
      desc: 'Field teams available',
      color: 'text-emerald-400',
    },
  ],

  actions: [
    '🚓 Dispatch Cruiser Unit',
    '📢 Broadcast Radius Alert',
    '💬 Open Rescue Companion',
    '✅ Complete Incident',
  ],

  chartType: 'response',
  chartTitle: 'Precinct Response Pacing Trends',
  searchPlaceholder: 'Search cases by ID or coordinates...',

  notificationCategories: ['Police', 'Emergency', 'System'],

  caseFilter: 'all',

  mapVisible: true,

  permissions: {
    canDispatch: true,
    canCloseCase: true,
    canEditUsers: false,
    canBroadcast: true,
    canViewAnalytics: true,
    canViewSystemHealth: false,
  },
}

export default policeConfig
