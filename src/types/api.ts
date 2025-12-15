// nele.ai API Types
export interface NeleAITranscriptionResponse {
  text: string
  usage: {
    credits: string
  }
}

export interface NeleAIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
  attachments?: Array<{ id: string; name: string }>
  results?: any
  tools?: any[]
}

export interface NeleAIChatRequest {
  model: string
  messages: NeleAIChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface NeleAIChatSyncResponse {
  content: string
  results?: any
  web_search_results?: any[]
  tool_calls?: any[]
  usage: {
    credits: string
  }
}

export interface GitHubIssueRequest {
  title: string
  body: string
  labels?: string[]
}

export interface GitHubIssueResponse {
  id: number
  number?: number
  iid?: number
  title: string
  body: string
  html_url?: string
  web_url?: string
  url?: string
  state: string
  created_at: string
  updated_at: string
  labels: {
    id: number
    name: string
    color: string
  }[]
}

export interface GitHubContentResponse {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: string
  content: string
  encoding: string
}

export interface ProcessedTextResponse {
  conversationDate: string // Format: DD.MM.YYYY or empty string if not found
  processedText: string
}

export interface APIError {
  message: string
  status?: number
  code?: string
}
