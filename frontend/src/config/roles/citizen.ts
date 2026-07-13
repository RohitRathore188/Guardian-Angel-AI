import type { RoleConfig } from './types'

const citizenConfig: RoleConfig = {
  roleName: 'Reporting Citizen',
  title: 'Guardian SOS Portal',
  subtitle: 'Citizen Emergency & Reports Dashboard',

  tabs: ['Dashboard', 'My Reports', 'Nearby Help', 'Safety Tips'],

  stats: [
    {
      label: 'My Active Cases',
      value: '1 Active',
      desc: 'Case under active dispatch tracking',
      color: 'text-primary',
    },
    {
      label: 'Resolved Cases',
      value: '1 Saved 👼',
      desc: 'Child secured in safe custody',
      color: 'text-green-400',
    },
    {
      label: 'Weather Telemetry',
      value: '29°C - Heavy Rain',
      desc: 'Storm warning active in Chennai',
      color: 'text-blue-400',
    },
  ],

  actions: [
    '🚨 File Emergency SOS',
    '📞 Call Helpline 1098',
    '👮 Call Police 112',
  ],

  chartType: 'reports',
  chartTitle: 'Incident Report Status Distribution',
  searchPlaceholder: 'Search my reports...',

  notificationCategories: ['Emergency', 'System'],

  caseFilter: 'own',

  mapVisible: false,

  permissions: {
    canDispatch: false,
    canCloseCase: false,
    canEditUsers: false,
    canBroadcast: false,
    canViewAnalytics: false,
    canViewSystemHealth: false,
  },
}

export default citizenConfig
