/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_GITHUB_REPO_OWNER: string
  readonly VITE_GITHUB_REPO_NAME: string
  readonly VITE_COMPANIES_JSON_PATH: string
  readonly VITE_AI_PROVIDER: string
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
