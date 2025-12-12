import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') })

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // nele.ai
  neleAi: {
    apiKey: process.env.NELE_AI_API_KEY || '',
    transcriptionModel: process.env.NELE_AI_TRANSCRIPTION_MODEL || 'azure-whisper',
    chatModelCompanyMatching: process.env.NELE_AI_CHAT_MODEL_COMPANY_MATCHING || 'azure-gpt-4o-mini',
    chatModelTextProcessing: process.env.NELE_AI_CHAT_MODEL_TEXT_PROCESSING || 'azure-gpt-4o-mini'
  },

  // GitHub
  github: {
    token: process.env.GITHUB_TOKEN || '',
    repoOwner: process.env.GITHUB_REPO_OWNER || 'StudiumPlus-Duales-Studium-der-THM',
    repoName: process.env.GITHUB_REPO_NAME || 'studiumplus-partner-management',
    companiesJsonPath: process.env.COMPANIES_JSON_PATH || 'companies.json'
  },

  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
} as const

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'NELE_AI_API_KEY',
  'GITHUB_TOKEN'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Warning: ${envVar} is not set in environment variables`)
  }
}
