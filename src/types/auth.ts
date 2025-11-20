export interface UserCredentials {
  id: string
  userName: string
  passwordHash: string
  salt: string
  githubToken: string
  createdAt: Date
  updatedAt: Date
}

export interface WebAuthnCredential {
  id: string
  credentialId: string
  publicKey: string
  counter: number
  createdAt: Date
}

export interface AuthState {
  isAuthenticated: boolean
  isSetupComplete: boolean
  userName: string | null
  sessionToken: string | null
  lastActivity: number
}

export interface SetupData {
  userName: string
  password: string
  githubToken: string
}
