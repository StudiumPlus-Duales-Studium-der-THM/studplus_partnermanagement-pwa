import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '@/services/api.service'

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
  const login = async (username: string, password: string): Promise<boolean> => {
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

        // Store token and userName in localStorage
        apiService.setToken(response.data.token)
        localStorage.setItem('auth_userName', userName.value)

        return true
      }

      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
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
