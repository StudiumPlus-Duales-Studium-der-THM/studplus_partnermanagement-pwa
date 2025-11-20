import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import { userCredentialsDB } from '@/services/db'
import {
  hashPassword,
  generateSalt,
  verifyPassword,
  encryptForStorage,
  decryptFromStorage,
  generateSessionToken
} from '@/services/encryption.service'
import type { SetupData, UserCredentials } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const isSetupComplete = ref(false)
  const userName = ref<string | null>(null)
  const sessionToken = ref<string | null>(null)
  const lastActivity = ref(Date.now())
  const currentPassword = ref<string | null>(null)

  // Encrypted data in memory
  const decryptedGithubToken = ref<string | null>(null)

  const githubToken = computed(() => decryptedGithubToken.value)
  // OpenAI API key comes from environment variable only
  const openaiApiKey = computed(() => import.meta.env.VITE_OPENAI_API_KEY || '')

  // Check if initial setup is complete
  const checkSetupStatus = async () => {
    isSetupComplete.value = await userCredentialsDB.exists()
  }

  // Complete initial setup
  const completeSetup = async (data: SetupData): Promise<void> => {
    const salt = generateSalt()
    const passwordHash = hashPassword(data.password, salt)

    // Encrypt sensitive data
    const encryptedGithubToken = encryptForStorage(data.githubToken, data.password, salt)

    const credentials: UserCredentials = {
      id: nanoid(),
      userName: data.userName,
      passwordHash,
      salt,
      githubToken: encryptedGithubToken,
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

    // Decrypt sensitive data
    try {
      decryptedGithubToken.value = decryptFromStorage(
        credentials.githubToken,
        password,
        credentials.salt
      )
    } catch {
      return false
    }

    currentPassword.value = password
    userName.value = credentials.userName
    sessionToken.value = generateSessionToken()
    isAuthenticated.value = true
    lastActivity.value = Date.now()

    return true
  }

  // Logout
  const logout = () => {
    isAuthenticated.value = false
    sessionToken.value = null
    currentPassword.value = null
    decryptedGithubToken.value = null
  }

  // Update activity timestamp
  const updateActivity = () => {
    lastActivity.value = Date.now()
  }

  // Check for auto-lock
  const checkAutoLock = (autoLockMinutes: number) => {
    if (autoLockMinutes === 0) return // Disabled

    const elapsed = Date.now() - lastActivity.value
    const autoLockMs = autoLockMinutes * 60 * 1000

    if (elapsed > autoLockMs) {
      logout()
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

    // Decrypt with old password
    const githubToken = decryptFromStorage(
      credentials.githubToken,
      oldPassword,
      credentials.salt
    )

    // Create new salt and hash
    const newSalt = generateSalt()
    const newPasswordHash = hashPassword(newPassword, newSalt)

    // Encrypt with new password
    const newEncryptedGithubToken = encryptForStorage(githubToken, newPassword, newSalt)

    // Update credentials
    await userCredentialsDB.update({
      passwordHash: newPasswordHash,
      salt: newSalt,
      githubToken: newEncryptedGithubToken
    })

    // Update in-memory values
    currentPassword.value = newPassword

    return true
  }

  // Update GitHub token
  const updateGithubToken = async (newToken: string): Promise<boolean> => {
    if (!currentPassword.value) {
      return false
    }

    const credentials = await userCredentialsDB.get()
    if (!credentials) {
      return false
    }

    const encryptedToken = encryptForStorage(newToken, currentPassword.value, credentials.salt)

    await userCredentialsDB.update({
      githubToken: encryptedToken
    })

    decryptedGithubToken.value = newToken
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
    checkAutoLock,
    changePassword,
    updateGithubToken,
    updateUserName
  }
})
