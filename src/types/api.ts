export interface OpenAITranscriptionResponse {
  text: string
}

export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIChatRequest {
  model: string
  messages: OpenAIChatMessage[]
  temperature?: number
  max_tokens?: number
}

export interface OpenAIChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: OpenAIChatMessage
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface GitHubIssueRequest {
  title: string
  body: string
  labels?: string[]
}

export interface GitHubIssueResponse {
  id: number
  number: number
  title: string
  body: string
  html_url: string
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

export interface APIError {
  message: string
  status?: number
  code?: string
}
