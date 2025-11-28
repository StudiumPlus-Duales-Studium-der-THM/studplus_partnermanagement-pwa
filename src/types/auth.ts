export interface UserCredentials {
  id: string
  userName: string
  passwordHash: string
  salt: string
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
}

export interface AuthSession {
  id: string
  userName: string
  sessionToken: string
  lastActivity: number
  createdAt: Date
}
