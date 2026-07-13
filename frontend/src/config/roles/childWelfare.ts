import type { RoleConfig } from './types'

const childWelfareConfig: RoleConfig = {
  roleName: 'Placement Officer',
  title: 'Guardian Welfare',
  subtitle: 'Legal Placement & Reunification Council',

  tabs: ['Dashboard', 'Welfare Cases', 'Accommodations', 'Legal Review'],

  stats: [
    {
      label: 'Awaiting Placement',
      value: '3 Minors',
      desc: 'Awaiting shelter custody hearings',
      color: 'text-primary animate-pulse',
    },
    {
      label: 'Active Shelters',
      value: '6 Facilities',
      desc: 'Verified NGO placements',
      color: 'text-blue-400',
    },
    {
      label: 'Counsellors Active',
      value: '8 Staff',
      desc: 'Rehabilitation therapy active',
      color: 'text-emerald-400',
    },
  ],

  actions: [
    '📝 Review Legal Intake',
    '🗓️ Schedule Counselling',
    '🏢 Assign Welfare Shelter',
    '👼 Reunify Family',
  ],

  chartType: 'reports',
  chartTitle: 'Child Welfare Custody Metrics',
  searchPlaceholder: 'Search children by registry ID...',

  notificationCategories: ['Emergency', 'System'],

  caseFilter: 'all',

  mapVisible: false,

  permissions: {
    canDispatch: false,
    canCloseCase: true,
    canEditUsers: false,
    canBroadcast: false,
    canViewAnalytics: true,
    canViewSystemHealth: false,
  },
}

export default childWelfareConfig
