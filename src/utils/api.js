import { ofetch } from 'ofetch'
import { getAccessToken, handleUnauthorized } from './auth'

export const $api = ofetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  async onRequest({ options }) {
    const accessToken = getAccessToken()
    if (accessToken) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      }
    }
  },
  async onResponseError({ response }) {
    if (response.status === 401)
      handleUnauthorized()
  },
})
