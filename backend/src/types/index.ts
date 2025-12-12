import { Request } from 'express'

// User types
export interface User {
  id: string
  userName: string // Login username
  displayName: string // Display name (used in GitHub issues)
  passwordHash: string
  createdAt: Date
}

export interface UserConfig {
  users: User[]
}

// Auth types
export interface LoginRequest {
  userName: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token?: string
  displayName?: string
  message?: string
}

export interface JWTPayload {
  userId: string
  userName: string
  displayName: string
}

export interface AuthRequest extends Request {
  user?: JWTPayload
}

// GitHub types
export interface GitHubIssueRequest {
  title: string
  body: string
  labels?: string[]
}

export interface GitHubIssueResponse {
  id: number
  number: number
  title: string
  html_url: string
  created_at: string
}

export interface GitHubContentResponse {
  name: string
  path: string
  sha: string
  size: number
  content: string
  encoding: string
}

export interface CompaniesData {
  companies: Array<{
    name: string
    category: string
    studyPrograms: string[]
  }>
}

// nele.ai types
export interface TranscriptionRequest {
  audioBase64: string
  fileName: string
}

export interface TranscriptionResponse {
  text: string
}

export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  model?: string
}

export interface ChatResponse {
  choices: Array<{
    message: {
      role: string
      content: string
    }
  }>
}
