import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { apiService } from '@/services/api.service'
import type { BackendErrorResponse } from '@/types/api'

export interface LoginResult {
  success: boolean
  message?: string
}

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const userName = ref<string | null>(null)
  const token = ref<string | null>(null)
  const lastActivity = ref(Date.now())

  // Initialize auth state from stored token
  const init = async () => {
    const storedToken = apiService.loadToken()
    const storedUserName = localStorage.getItem('auth_userName')

    if (storedToken) {
      token.value = storedToken
      userName.value = storedUserName
      // Token is valid until backend says otherwise (401 response will clear it)
      isAuthenticated.value = true
    }
  }

  // Login with username and password
  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      const response = await apiService.getClient().post<{
        success: boolean
        token?: string
        displayName?: string
        message?: string
      }>('/api/auth/login', {
        userName: username,
        password
      })

      if (response.data.success && response.data.token) {
        token.value = response.data.token
        userName.value = response.data.displayName || username
        isAuthenticated.value = true
        lastActivity.value = Date.now()

        apiService.setToken(response.data.token)
        localStorage.setItem('auth_userName', userName.value)

        return { success: true }
      }

      return { success: false, message: response.data.message }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as BackendErrorResponse | undefined
        if (data && typeof data === 'object' && 'message' in data && data.message) {
          return { success: false, message: data.message }
        }
        if (!error.response) {
          return {
            success: false,
            message: 'Server nicht erreichbar. Netzwerkverbindung prüfen.'
          }
        }
      }
      console.error('Login failed:', error)
      return { success: false, message: 'Anmeldung fehlgeschlagen' }
    }
  }

  // Logout
  const logout = async () => {
    isAuthenticated.value = false
    token.value = null
    userName.value = null

    // Clear token and userName from storage
    apiService.clearToken()
    localStorage.removeItem('auth_userName')
  }

  // Update activity timestamp
  const updateActivity = () => {
    lastActivity.value = Date.now()
  }

  // Check for auto-lock
  const checkAutoLock = async (autoLockMinutes: number) => {
    if (autoLockMinutes === 0) return // Disabled

    const elapsed = Date.now() - lastActivity.value
    const autoLockMs = autoLockMinutes * 60 * 1000

    if (elapsed > autoLockMs) {
      await logout()
    }
  }

  return {
    isAuthenticated,
    userName,
    token,
    init,
    login,
    logout,
    updateActivity,
    checkAutoLock
  }
})
