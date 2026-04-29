import { clearAuthSession, getAccessToken, getUserData } from '@/utils/auth'
import { ROUTE_PERMISSIONS, getUserPermissions } from '@/utils/permissions'

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`
    }).join(''))

    return JSON.parse(jsonPayload)
  }
  catch {
    return null
  }
}

function isTokenExpired(token) {
  const decodedToken = parseJwt(token)
  if (!decodedToken?.exp)
    return true

  const currentTime = Math.floor(Date.now() / 1000)

  return decodedToken.exp < currentTime
}

export const setupGuards = router => {
  router.beforeEach(to => {
    if (to.meta.public)
      return

    const accessToken = getAccessToken()
    const userData = getUserData()
    const hasSession = !!(userData && accessToken)
    const isLoggedIn = hasSession && !isTokenExpired(accessToken)

    if (hasSession && !isLoggedIn)
      clearAuthSession()

    if (to.meta.unauthenticatedOnly)
      return isLoggedIn ? '/' : undefined

    if (to.meta.not_authenticate === false)
      return isLoggedIn ? undefined : '/login'

    if (!isLoggedIn && to.matched.length) {
      return {
        name: 'login',
        query: {
          ...to.query,
          to: to.fullPath !== '/' ? to.path : undefined,
        },
      }
    }

    // Permission check: block direct URL access to restricted routes
    const requiredPermission = ROUTE_PERMISSIONS[to.name]
    if (requiredPermission && isLoggedIn) {
      const userPermissions = getUserPermissions()
      if (!userPermissions.includes(requiredPermission))
        return { name: 'not-authorized' }
    }
  })
}
