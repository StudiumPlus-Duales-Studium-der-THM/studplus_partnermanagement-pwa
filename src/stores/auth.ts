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

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const isSetupComplete = ref(false)
  const userName = ref<string | null>(null)
  const sessionToken = ref<string | null>(null)
  const lastActivity = ref(Date.now())
  const currentPassword = ref<string | null>(null)

  // Encrypted data in memory
  const decryptedGithubToken = ref<string | null>(null)
  const decryptedOpenaiKey = ref<string | null>(null)

  const githubToken = computed(() => decryptedGithubToken.value)
  const openaiApiKey = computed(() => decryptedOpenaiKey.value)

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
    const encryptedOpenaiKey = data.openaiApiKey
      ? encryptForStorage(data.openaiApiKey, data.password, salt)
      : undefined

    const credentials: UserCredentials = {
      id: nanoid(),
      userName: data.userName,
      passwordHash,
      salt,
      githubToken: encryptedGithubToken,
      openaiApiKey: encryptedOpenaiKey,
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

      if (credentials.openaiApiKey) {
        decryptedOpenaiKey.value = decryptFromStorage(
          credentials.openaiApiKey,
          password,
          credentials.salt
        )
      }
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
    decryptedOpenaiKey.value = null
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

    let openaiKey: string | undefined
    if (credentials.openaiApiKey) {
      openaiKey = decryptFromStorage(credentials.openaiApiKey, oldPassword, credentials.salt)
    }

    // Create new salt and hash
    const newSalt = generateSalt()
    const newPasswordHash = hashPassword(newPassword, newSalt)

    // Encrypt with new password
    const newEncryptedGithubToken = encryptForStorage(githubToken, newPassword, newSalt)
    const newEncryptedOpenaiKey = openaiKey
      ? encryptForStorage(openaiKey, newPassword, newSalt)
      : undefined

    // Update credentials
    await userCredentialsDB.update({
      passwordHash: newPasswordHash,
      salt: newSalt,
      githubToken: newEncryptedGithubToken,
      openaiApiKey: newEncryptedOpenaiKey
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

  // Update OpenAI API key
  const updateOpenaiKey = async (newKey: string): Promise<boolean> => {
    if (!currentPassword.value) {
      return false
    }

    const credentials = await userCredentialsDB.get()
    if (!credentials) {
      return false
    }

    const encryptedKey = encryptForStorage(newKey, currentPassword.value, credentials.salt)

    await userCredentialsDB.update({
      openaiApiKey: encryptedKey
    })

    decryptedOpenaiKey.value = newKey
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
        // In a real app, you'd verify the signature
        // For simplicity, we trust the authenticator
        const credentials = await userCredentialsDB.get()
        if (credentials) {
          // Note: With WebAuthn, we can't decrypt the tokens
          // This is a limitation - user must have used password first
          // to have tokens in memory, or we need a different approach

          userName.value = credentials.userName
          sessionToken.value = generateSessionToken()
          isAuthenticated.value = true
          lastActivity.value = Date.now()
          return true
        }
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
    updateOpenaiKey,
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
