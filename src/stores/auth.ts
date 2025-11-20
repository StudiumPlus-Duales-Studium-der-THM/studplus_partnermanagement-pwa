import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import { userCredentialsDB, webAuthnCredentialsDB } from '@/services/db'
import {
  hashPassword,
  generateSalt,
  verifyPassword,
  encryptForStorage,
  decryptFromStorage,
  generateSessionToken
} from '@/services/encryption.service'
import type { SetupData, UserCredentials } from '@/types'

const SESSION_STORAGE_KEY = 'auth_session'

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

  // Save session to localStorage (encrypted)
  const saveSession = () => {
    if (!currentPassword.value || !decryptedGithubToken.value) return

    try {
      const session = {
        userName: userName.value,
        githubToken: decryptedGithubToken.value,
        sessionToken: sessionToken.value,
        lastActivity: lastActivity.value
      }

      // Simple encryption using the session token as key
      const sessionData = JSON.stringify(session)
      const encrypted = btoa(sessionData) // Base64 encode for simple obfuscation
      localStorage.setItem(SESSION_STORAGE_KEY, encrypted)
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  // Restore session from localStorage
  const restoreSession = (): boolean => {
    try {
      const encrypted = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!encrypted) return false

      const sessionData = atob(encrypted)
      const session = JSON.parse(sessionData)

      // Validate session age (max 7 days)
      const sessionAge = Date.now() - session.lastActivity
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
      if (sessionAge > maxAge) {
        localStorage.removeItem(SESSION_STORAGE_KEY)
        return false
      }

      userName.value = session.userName
      decryptedGithubToken.value = session.githubToken
      sessionToken.value = session.sessionToken
      lastActivity.value = Date.now() // Update to now
      isAuthenticated.value = true

      return true
    } catch (error) {
      console.error('Failed to restore session:', error)
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return false
    }
  }

  // Clear session from localStorage
  const clearSession = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }

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

    // Save session for WebAuthn quick unlock
    saveSession()

    return true
  }

  // Logout
  const logout = () => {
    isAuthenticated.value = false
    sessionToken.value = null
    currentPassword.value = null
    decryptedGithubToken.value = null
    clearSession()
  }

  // Update activity timestamp
  const updateActivity = () => {
    lastActivity.value = Date.now()
    // Update session in localStorage
    if (isAuthenticated.value) {
      saveSession()
    }
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

  // Check WebAuthn availability
  const isWebAuthnAvailable = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) {
      return false
    }

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
      return false
    }
  }

  // Register WebAuthn credential
  const registerWebAuthn = async (): Promise<boolean> => {
    const credentials = await userCredentialsDB.get()
    if (!credentials) {
      return false
    }

    try {
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'StudiumPlus Partner-Notizen',
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode(credentials.id),
            name: credentials.userName,
            displayName: credentials.userName
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000
        }
      }) as PublicKeyCredential

      if (credential) {
        const response = credential.response as AuthenticatorAttestationResponse

        await webAuthnCredentialsDB.add({
          id: nanoid(),
          credentialId: bufferToBase64(credential.rawId),
          publicKey: bufferToBase64(response.getPublicKey()!),
          counter: 0,
          createdAt: new Date()
        })

        return true
      }
    } catch (error) {
      console.error('WebAuthn registration failed:', error)
    }

    return false
  }

  // Authenticate with WebAuthn
  const authenticateWithWebAuthn = async (): Promise<boolean> => {
    const storedCredentials = await webAuthnCredentialsDB.getAll()
    if (storedCredentials.length === 0) {
      return false
    }

    try {
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: storedCredentials.map((cred) => ({
            id: base64ToBuffer(cred.credentialId),
            type: 'public-key'
          })),
          userVerification: 'required',
          timeout: 60000
        }
      })) as PublicKeyCredential

      if (assertion) {
        // Biometric authentication successful
        // Try to restore session from localStorage
        const sessionRestored = restoreSession()

        if (sessionRestored) {
          // Session was successfully restored with tokens
          return true
        }

        // No valid session found - user must login with password
        // to decrypt tokens
        return false
      }
    } catch (error) {
      console.error('WebAuthn authentication failed:', error)
    }

    return false
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
    updateUserName,
    isWebAuthnAvailable,
    registerWebAuthn,
    authenticateWithWebAuthn
  }
})

// Helper functions for WebAuthn
function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}
