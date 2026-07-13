import type { RoleConfig } from './types'

const ngoConfig: RoleConfig = {
  roleName: 'Welfare Director',
  title: 'Guardian NGO Center',
  subtitle: 'Child Shelter & Relief Logistics',

  tabs: ['Dashboard', 'Shelters', 'Inventory', 'Volunteers', 'Analytics'],

  stats: [
    {
      label: 'Shelter Capacity',
      value: '14 / 20 Beds',
      desc: 'St. Jude Center occupancy',
      color: 'text-primary',
    },
    {
      label: 'Resource Stock',
      value: '45 Food Kits',
      desc: '30 Medical Triage Kits remaining',
      color: 'text-blue-400',
    },
    {
      label: 'Active Volunteers',
      value: '8 Online',
      desc: 'Coordinated via mobile grids',
      color: 'text-emerald-400',
    },
  ],

  actions: [
    '🏢 Assign Shelter Placement',
    '📦 Dispatch Relief Supplies',
    '🛵 Assign Field Volunteer',
    '📝 Generate NGO Report',
  ],

  chartType: 'resources',
  chartTitle: 'NGO Logistics Stock Balance',
  searchPlaceholder: 'Search supplies or shelters...',

  notificationCategories: ['NGO', 'Emergency', 'System'],

  caseFilter: 'all',

  mapVisible: true,

  permissions: {
    canDispatch: false,
    canCloseCase: false,
    canEditUsers: false,
    canBroadcast: false,
    canViewAnalytics: true,
    canViewSystemHealth: false,
  },
}

export default ngoConfig
