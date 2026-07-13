/**
 * Dynamic Role Engine — Registry
 *
 * Maps a role string to its typed RoleConfig object.
 * DashboardPage.tsx calls this once per render cycle and then
 * uses `config.xxx` to drive all UI — tabs, stats, actions, charts,
 * permissions, notification filters, case filters.
 *
 * To add a new role:
 *   1. Create src/config/roles/myRole.ts implementing RoleConfig
 *   2. Import it here and add a case below
 *   3. Done — DashboardPage needs zero changes
 */

import type { RoleConfig } from './roles/types'
import citizenConfig from './roles/citizen'
import policeConfig from './roles/police'
import hospitalConfig from './roles/hospital'
import volunteerConfig from './roles/volunteer'
import ngoConfig from './roles/ngo'
import childWelfareConfig from './roles/childWelfare'
import adminConfig from './roles/admin'

/**
 * Returns the RoleConfig for the given role string.
 * Falls back to policeConfig for unknown / unmapped roles.
 */
export function getRoleConfig(role: string): RoleConfig {
  switch (role) {
    case 'citizen':
      return citizenConfig
    case 'police':
      return policeConfig
    case 'hospital':
      return hospitalConfig
    case 'volunteer':
      return volunteerConfig
    case 'ngo':
      return ngoConfig
    case 'child_welfare':
    case 'welfare':
      return childWelfareConfig
    case 'admin':
      return adminConfig
    default:
      return policeConfig
  }
}

// Re-export the type so consumers can import from one place
export type { RoleConfig } from './roles/types'
