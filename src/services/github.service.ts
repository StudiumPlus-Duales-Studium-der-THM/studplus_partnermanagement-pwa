import { apiService } from './api.service'
import type {
  GitHubIssueResponse,
  CompaniesData
} from '@/types'

/**
 * Creates a GitHub issue via backend API
 */
export const createIssue = async (
  title: string,
  body: string,
  labels: string[] = ['partner-kontakt']
): Promise<GitHubIssueResponse> => {
  const response = await apiService.getClient().post<GitHubIssueResponse>(
    '/api/gitlab/issues',
    { title, body, labels }
  )

  return response.data
}

/**
 * Fetches companies.json from the repository via backend API
 */
export const fetchCompanies = async (): Promise<CompaniesData> => {
  const response = await apiService.getClient().get<CompaniesData>(
    '/api/github/companies'
  )

  return response.data
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
