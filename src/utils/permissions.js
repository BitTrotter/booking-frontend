import { getUserData } from './auth'

export const getUserPermissions = () => {
  try {
    const raw = getUserData()
    if (!raw) return []
    const user = JSON.parse(raw)

    return Array.isArray(user.permissions) ? user.permissions : []
  } catch {
    return []
  }
}

export const hasPermission = permission => {
  if (!permission) return true
  return getUserPermissions().includes(permission)
}

// Map route name → required permission (used by the router guard)
export const ROUTE_PERMISSIONS = {
  roles: 'list_role',
  users: 'list_staff',
  cabins: 'list_cabin',
  booking: 'list_reservation',
  calendar: 'list_reservation',
  payments: 'list_payment',
  'stripe-test': 'list_su',

}