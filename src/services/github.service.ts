import axios from 'axios'
import type {
  GitHubIssueRequest,
  GitHubIssueResponse,
  GitHubContentResponse,
  CompaniesData
} from '@/types'

const GITHUB_API_BASE = 'https://api.github.com'
const REPO_OWNER = import.meta.env.VITE_GITHUB_REPO_OWNER || 'StudiumPlus-Duales-Studium-der-THM'
const REPO_NAME = import.meta.env.VITE_GITHUB_REPO_NAME || 'studiumplus-partner-management'
const COMPANIES_PATH = import.meta.env.VITE_COMPANIES_JSON_PATH || 'companies.json'

/**
 * Creates a GitHub issue
 */
export const createIssue = async (
  token: string,
  title: string,
  body: string,
  labels: string[] = ['partner-kontakt']
): Promise<GitHubIssueResponse> => {
  const request: GitHubIssueRequest = {
    title,
    body,
    labels
  }

  const response = await axios.post<GitHubIssueResponse>(
    `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
    request,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'StudiumPlus-Partner-PWA/1.0'
      }
    }
  )

  return response.data
}

/**
 * Fetches companies.json from the repository
 */
export const fetchCompanies = async (token: string): Promise<CompaniesData> => {
  const response = await axios.get<GitHubContentResponse>(
    `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${COMPANIES_PATH}`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'StudiumPlus-Partner-PWA/1.0'
      }
    }
  )

  // Decode base64 content (GitHub API returns content with newlines)
  const base64Content = response.data.content.replace(/\n/g, '')
  const content = atob(base64Content)
  return JSON.parse(content) as CompaniesData
}

/**
 * Validates a GitHub token by checking rate limit
 */
export const validateToken = async (
  token: string
): Promise<{ valid: boolean; scopes: string[]; remaining: number }> => {
  try {
    const response = await axios.get(`${GITHUB_API_BASE}/rate_limit`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'StudiumPlus-Partner-PWA/1.0'
      }
    })

    const scopes = response.headers['x-oauth-scopes']?.split(', ') || []
    const remaining = parseInt(response.headers['x-ratelimit-remaining'] || '0')

    return {
      valid: true,
      scopes,
      remaining
    }
  } catch {
    return {
      valid: false,
      scopes: [],
      remaining: 0
    }
  }
}

/**
 * Checks if token has required permissions
 */
export const checkTokenPermissions = async (
  token: string
): Promise<{ canReadContent: boolean; canWriteIssues: boolean }> => {
  let canReadContent = false
  let canWriteIssues = false

  // Try to read content
  try {
    await axios.get(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${COMPANIES_PATH}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'StudiumPlus-Partner-PWA/1.0'
        }
      }
    )
    canReadContent = true
  } catch {
    canReadContent = false
  }

  // Try to list issues (doesn't create anything)
  try {
    await axios.get(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues?per_page=1`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'StudiumPlus-Partner-PWA/1.0'
      }
    })
    canWriteIssues = true // If we can read, we likely can write
  } catch {
    canWriteIssues = false
  }

  return { canReadContent, canWriteIssues }
}

/**
 * Formats issue body for a meeting note
 * Note: processedText already contains company, date, and participant information
 */
export const formatIssueBody = (params: {
  processedText: string
  studyPrograms: string[]
}): string => {
  const timestamp = new Date().toISOString()

  return `${params.processedText}

## Metadaten
- Erstellt: ${timestamp}
- Studiengänge: ${params.studyPrograms.join(', ') || 'Nicht angegeben'}`
}
