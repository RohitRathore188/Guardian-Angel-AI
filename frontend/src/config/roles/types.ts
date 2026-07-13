// Shared TypeScript interfaces for the Dynamic Role Engine
// All role config files must satisfy this contract.

export type ChartType = 'response' | 'beds' | 'missions' | 'resources' | 'reports' | 'global'

export type CaseFilter = 'all' | 'own' | 'active' | 'critical'

export interface StatWidget {
  label: string
  value: string
  desc: string
  color: string
}

export interface RolePermissions {
  canDispatch: boolean
  canCloseCase: boolean
  canEditUsers: boolean
  canBroadcast: boolean
  canViewAnalytics: boolean
  canViewSystemHealth: boolean
}

export interface RoleConfig {
  // Identity
  roleName: string
  title: string
  subtitle: string

  // Navigation
  tabs: string[]

  // Dashboard widgets
  stats: StatWidget[]

  // Quick action buttons
  actions: string[]

  // Analytics chart
  chartType: ChartType
  chartTitle: string

  // Search bar placeholder
  searchPlaceholder: string

  // Notification feed categories this role receives
  notificationCategories: string[]

  // How to filter the case feed for this role
  caseFilter: CaseFilter

  // Whether the GIS map is shown in the main dashboard tab
  mapVisible: boolean

  // Fine-grained permissions
  permissions: RolePermissions
}
