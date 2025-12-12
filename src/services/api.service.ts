import axios, { AxiosInstance } from 'axios'

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

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear token
          this.clearToken()
          // Redirect to login only if not already there
          if (window.location.pathname !== '/auth') {
            window.location.href = '/auth'
          }
        }
        return Promise.reject(error)
      }
    )
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
