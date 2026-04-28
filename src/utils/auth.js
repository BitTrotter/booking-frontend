export const AUTH_STORAGE_KEYS = ['userData', 'accessToken']

export const clearAuthSession = () => {
  AUTH_STORAGE_KEYS.forEach(key => localStorage.removeItem(key))
}

export const getAccessToken = () => localStorage.getItem('accessToken')

export const getUserData = () => localStorage.getItem('userData')

export const isAuthenticated = () => !!(getUserData() && getAccessToken())

export const redirectToLogin = () => {
  const loginUrl = `${import.meta.env.BASE_URL}login`

  if (window.location.pathname !== loginUrl)
    window.location.assign(loginUrl)
}

export const handleUnauthorized = () => {
  clearAuthSession()
  redirectToLogin()
}
