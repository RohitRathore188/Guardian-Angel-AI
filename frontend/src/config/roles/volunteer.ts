import type { RoleConfig } from './types'

const volunteerConfig: RoleConfig = {
  roleName: 'Welfare Responder',
  title: 'Guardian Responder',
  subtitle: 'Volunteer Ground Rescue Grid',

  tabs: ['Dashboard', 'Missions', 'GIS Map', 'My Rewards'],

  stats: [
    {
      label: 'Nearby Missions',
      value: '2 Available',
      desc: 'Within 2km coordinate grid',
      color: 'text-yellow-400 animate-pulse',
    },
    {
      label: 'Rescues Completed',
      value: '14 Saved',
      desc: 'Life-saving actions recorded',
      color: 'text-green-400',
    },
    {
      label: 'Hero Rewards',
      value: '350 Points',
      desc: 'Award level: GOLD STAR',
      color: 'text-primary',
    },
  ],

  actions: [
    '🛵 Accept Nearest Mission',
    '📍 Open Navigation',
    '📢 Report On-Scene Status',
    '✅ Secure Minor',
  ],

  chartType: 'missions',
  chartTitle: 'My Rescues Progress (Quarterly)',
  searchPlaceholder: 'Search missions by address...',

  notificationCategories: ['Volunteer', 'Emergency', 'System'],

  caseFilter: 'active',

  mapVisible: true,

  permissions: {
    canDispatch: true,
    canCloseCase: false,
    canEditUsers: false,
    canBroadcast: false,
    canViewAnalytics: true,
    canViewSystemHealth: false,
  },
}

export default volunteerConfig
