import type { RoleConfig } from './types'

const hospitalConfig: RoleConfig = {
  roleName: 'Trauma Coordinator',
  title: 'Guardian Medical',
  subtitle: 'Pediatric Trauma Triage Center',

  tabs: ['Dashboard', 'Patients', 'ER Beds', 'Ambulances', 'Analytics'],

  stats: [
    {
      label: 'Trauma Bed Status',
      value: '7 / 12 Beds',
      desc: 'Pediatric ICU beds occupied',
      color: 'text-primary',
    },
    {
      label: 'On-Duty Doctors',
      value: '5 active',
      desc: 'Pediatricians standby in ER',
      color: 'text-emerald-400',
    },
    {
      label: 'Active Ambulances',
      value: '3 Dispatched',
      desc: 'GPS tracking active',
      color: 'text-blue-400',
    },
  ],

  actions: [
    '🚑 Dispatch Ambulance',
    '🩺 Assign Doctor',
    '📝 Update Medical Notes',
    '✅ Discharge Patient',
  ],

  chartType: 'beds',
  chartTitle: 'Trauma ICU Occupancy Rate',
  searchPlaceholder: 'Search patients by ID or diagnosis...',

  notificationCategories: ['Hospital', 'Emergency', 'System'],

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

export default hospitalConfig
