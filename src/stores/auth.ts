import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import { userCredentialsDB, authSessionsDB } from '@/services/db'
import {
  hashPassword,
  generateSalt,
  verifyPassword,
  encryptForStorage,
  decryptFromStorage,
  generateSessionToken
} from '@/services/encryption.service'
import type { SetupData, UserCredentials, AuthSession } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const isSetupComplete = ref(false)
  const userName = ref<string | null>(null)
  const sessionToken = ref<string | null>(null)
  const lastActivity = ref(Date.now())
  const currentPassword = ref<string | null>(null)

  // API keys from environment variables
  const githubToken = computed(() => import.meta.env.VITE_GITHUB_TOKEN || '')
  const openaiApiKey = computed(() => import.meta.env.VITE_OPENAI_API_KEY || '')

  // Check if initial setup is complete
  const checkSetupStatus = async () => {
    isSetupComplete.value = await userCredentialsDB.exists()
  }

  // Complete initial setup
  const completeSetup = async (data: SetupData): Promise<void> => {
    const salt = generateSalt()
    const passwordHash = hashPassword(data.password, salt)

    const credentials: UserCredentials = {
      id: nanoid(),
      userName: data.userName,
      passwordHash,
      salt,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await userCredentialsDB.set(credentials)
    isSetupComplete.value = true
  }

  // Login with password
  const login = async (password: string): Promise<boolean> => {
    const credentials = await userCredentialsDB.get()
    if (!credentials) {
      return false
    }

    const isValid = verifyPassword(password, credentials.salt, credentials.passwordHash)
    if (!isValid) {
      return false
    }

    currentPassword.value = password
    userName.value = credentials.userName
    sessionToken.value = generateSessionToken()
    isAuthenticated.value = true
    lastActivity.value = Date.now()

    // Save session for persistence across reloads
    await saveSession()

    // Store password in sessionStorage for automatic session restore during browser session
    // This is cleared when browser/tab is closed
    sessionStorage.setItem('app_session_pw', password)

    return true
  }

  // Logout
  const logout = async () => {
    isAuthenticated.value = false
    sessionToken.value = null
    currentPassword.value = null

    // Clear persisted session
    await authSessionsDB.clear()

    // Clear sessionStorage password
    sessionStorage.removeItem('app_session_pw')
  }

  // Update activity timestamp
  const updateActivity = () => {
    lastActivity.value = Date.now()
  }

  // Save session to IndexedDB for persistence across reloads
  const saveSession = async () => {
    if (!isAuthenticated.value || !sessionToken.value || !userName.value) {
      return
    }

    const session: AuthSession = {
      id: 'current',
      userName: userName.value,
      sessionToken: sessionToken.value,
      lastActivity: lastActivity.value,
      createdAt: new Date()
    }

    await authSessionsDB.set(session)
  }

  // Restore session from IndexedDB
  const restoreSession = async (password: string): Promise<boolean> => {
    const session = await authSessionsDB.get()
    if (!session) {
      return false
    }

    // Re-authenticate with password to decrypt sensitive data
    const credentials = await userCredentialsDB.get()
    if (!credentials) {
      // Clear invalid session
      await authSessionsDB.clear()
      return false
    }

    const isValid = verifyPassword(password, credentials.salt, credentials.passwordHash)
    if (!isValid) {
      return false
    }

    // Restore session state
    currentPassword.value = password
    userName.value = session.userName
    sessionToken.value = session.sessionToken
    lastActivity.value = session.lastActivity
    isAuthenticated.value = true

    // Update lastActivity to now
    lastActivity.value = Date.now()
    await saveSession()

    return true
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

  // Change password
  const changePassword = async (
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    const credentials = await userCredentialsDB.get()
    if (!credentials) {
      return false
    }

    // Verify old password
    if (!verifyPassword(oldPassword, credentials.salt, credentials.passwordHash)) {
      return false
    }

    // Create new salt and hash
    const newSalt = generateSalt()
    const newPasswordHash = hashPassword(newPassword, newSalt)

    // Update credentials
    await userCredentialsDB.update({
      passwordHash: newPasswordHash,
      salt: newSalt
    })

    // Update in-memory values
    currentPassword.value = newPassword

    return true
  }

  // Update user name
  const updateUserName = async (newName: string): Promise<boolean> => {
    await userCredentialsDB.update({ userName: newName })
    userName.value = newName
    return true
  }

  return {
    isAuthenticated,
    isSetupComplete,
    userName,
    sessionToken,
    githubToken,
    openaiApiKey,
    checkSetupStatus,
    completeSetup,
    login,
    logout,
    updateActivity,
    saveSession,
    restoreSession,
    checkAutoLock,
    changePassword,
    updateUserName
  }
})
