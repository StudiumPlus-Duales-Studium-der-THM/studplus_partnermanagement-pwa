import express, { Response } from 'express'
import axios from 'axios'
import { config } from '../config/env.js'
import { authenticateToken } from '../middleware/auth.js'
import {
  AuthRequest,
  GitHubIssueRequest,
  GitHubIssueResponse,
  GitHubContentResponse,
  CompaniesData
} from '../types/index.js'

const router = express.Router()

const GITHUB_API_BASE = 'https://api.github.com'

// Apply authentication middleware to all routes
router.use(authenticateToken)

/**
 * POST /api/github/issues
 * Create a GitHub issue in the configured repository
 */
router.post(
  '/issues',
  async (req: AuthRequest, res: Response<GitHubIssueResponse | { error: string }>) => {
    try {
      const { title, body, labels = ['partner-kontakt'] } = req.body as GitHubIssueRequest

      if (!title || !body) {
        res.status(400).json({ error: 'Title and body are required' })
        return
      }

      const response = await axios.post<GitHubIssueResponse>(
        `${GITHUB_API_BASE}/repos/${config.github.repoOwner}/${config.github.repoName}/issues`,
        { title, body, labels },
        {
          headers: {
            Authorization: `token ${config.github.token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'StudiumPlus-Partner-PWA/1.0'
          }
        }
      )

      console.log(`✓ Issue created by ${req.user?.userName}: #${response.data.number}`)
      res.json(response.data)
    } catch (error) {
      console.error('GitHub issue creation failed:', error)
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          error: error.response?.data?.message || 'Failed to create GitHub issue'
        })
      } else {
        res.status(500).json({ error: 'Failed to create GitHub issue' })
      }
    }
  }
)

/**
 * GET /api/github/companies
 * Fetch companies.json from the repository
 */
router.get(
  '/companies',
  async (_req: AuthRequest, res: Response<CompaniesData | { error: string }>) => {
    try {
      const response = await axios.get<GitHubContentResponse>(
        `${GITHUB_API_BASE}/repos/${config.github.repoOwner}/${config.github.repoName}/contents/${config.github.companiesJsonPath}`,
        {
          headers: {
            Authorization: `token ${config.github.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'StudiumPlus-Partner-PWA/1.0'
          }
        }
      )

      // Decode base64 content
      const base64Content = response.data.content.replace(/\n/g, '')
      const content = Buffer.from(base64Content, 'base64').toString('utf-8')
      const companiesData = JSON.parse(content) as CompaniesData

      res.json(companiesData)
    } catch (error) {
      console.error('GitHub companies fetch failed:', error)
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          error: error.response?.data?.message || 'Failed to fetch companies data'
        })
      } else {
        res.status(500).json({ error: 'Failed to fetch companies data' })
      }
    }
  }
)

export default router
