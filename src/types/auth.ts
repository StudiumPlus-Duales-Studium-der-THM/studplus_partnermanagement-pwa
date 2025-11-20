export interface UserCredentials {
  id: string
  userName: string
  passwordHash: string
  salt: string
  githubToken: string
  createdAt: Date
  updatedAt: Date
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

export interface AuthSession {
  id: string
  userName: string
  sessionToken: string
  lastActivity: number
  createdAt: Date
}
