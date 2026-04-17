import axios, { AxiosError, AxiosInstance } from 'axios'
import {
  BackendErrorResponse,
  isAuthError,
  isUpstreamError
} from '@/types/api'
import { isTokenExpired } from '@/utils/jwt'

/**
 * API Service for backend communication
 */
class ApiService {
  private client: AxiosInstance
  private token: string | null = null

  constructor() {
    // Load token from localStorage on initialization
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      this.token = storedToken
    }

    const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Request interceptor: client-side Token-Expiry-Check (proaktiv), dann
    // Auth-Header setzen. Abgelaufener JWT → Session-Flow triggern und Request
    // clientseitig abbrechen, damit kein toter Token aufs Backend geht.
    this.client.interceptors.request.use(
      async (config) => {
        if (this.token) {
          if (isTokenExpired(this.token)) {
            await this.handleSessionExpired(
              'Sitzung abgelaufen, bitte neu anmelden.'
            )
            return Promise.reject(
              new axios.CanceledError('Token expired (client-side)')
            )
          }
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor: zeigt User-freundliche Meldungen, vermeidet
    // stummen Logout bei Upstream-Fehlern und sorgt dafür, dass bei
    // Session-Verlust eine Meldung sichtbar bleibt (Router-Push statt
    // Hard-Reload).
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<BackendErrorResponse>) => {
        await this.handleErrorResponse(error)
        return Promise.reject(error)
      }
    )
  }

  private async handleErrorResponse(error: AxiosError<BackendErrorResponse>) {
    // Vom Request-Interceptor clientseitig gecancelte Requests haben den
    // Session-Flow bereits ausgelöst — nichts doppelt tun.
    if (axios.isCancel(error)) return

    const status = error.response?.status
    const data = error.response?.data

    // Upstream-Dienst (GitHub/GitLab/nele.ai) defekt → User bleibt eingeloggt.
    if (status === 502 && isUpstreamError(data)) {
      const { useNotificationStore } = await import('@/stores/notification')
      useNotificationStore().error(data.message, 6000)
      return
    }

    // Eigene Session abgelaufen/ungültig → Meldung zeigen, dann sanft zur Login-Seite.
    const isSessionInvalid =
      (status === 401 || status === 403) &&
      isAuthError(data) &&
      (data.error === 'unauthenticated' || data.error === 'token_invalid')

    // Fallback für den Fall, dass das Backend (noch) keinen strukturierten
    // Body liefert: plain 401 auf Nicht-Login-Route wird weiter als
    // Session-Verlust behandelt — aber nur, wenn ein Token aktiv war.
    const isLegacyUnauthorized =
      status === 401 && !data && !!this.token

    if (isSessionInvalid || isLegacyUnauthorized) {
      const message =
        (data && 'message' in data && data.message) ||
        'Sitzung abgelaufen, bitte neu anmelden.'
      await this.handleSessionExpired(message)
    }
  }

  private async handleSessionExpired(message: string) {
    const [{ useNotificationStore }, { useAuthStore }, routerModule] =
      await Promise.all([
        import('@/stores/notification'),
        import('@/stores/auth'),
        import('@/router')
      ])
    useNotificationStore().error(message, 5000)
    await useAuthStore().logout()
    const router = routerModule.default
    if (router.currentRoute.value.name !== 'auth') {
      router.push({ name: 'auth' })
    }
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  loadToken() {
    const token = localStorage.getItem('auth_token')
    if (token) {
      this.token = token
    }
    return token
  }

  getClient() {
    return this.client
  }
}

export const apiService = new ApiService()
