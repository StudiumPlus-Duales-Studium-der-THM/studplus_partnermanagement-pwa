/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Passwort muss mindestens 8 Zeichen lang sein' }
  }
  return { valid: true, message: '' }
}

/**
 * Validate GitHub token format
 */
export const validateGitHubToken = (token: string): { valid: boolean; message: string } => {
  // Fine-grained PAT starts with github_pat_
  // Classic PAT starts with ghp_
  if (!token || token.length < 10) {
    return { valid: false, message: 'Token ist zu kurz' }
  }

  const validPrefixes = ['ghp_', 'github_pat_', 'gho_', 'ghu_', 'ghs_', 'ghr_']
  const hasValidPrefix = validPrefixes.some((prefix) => token.startsWith(prefix))

  if (!hasValidPrefix) {
    return { valid: false, message: 'Ungültiges Token-Format' }
  }

  return { valid: true, message: '' }
}

/**
 * Validate OpenAI API key format
 */
export const validateOpenAIKey = (key: string): { valid: boolean; message: string } => {
  if (!key || key.length < 10) {
    return { valid: false, message: 'API-Key ist zu kurz' }
  }

  if (!key.startsWith('sk-')) {
    return { valid: false, message: 'Ungültiges API-Key-Format (muss mit sk- beginnen)' }
  }

  return { valid: true, message: '' }
}

/**
 * Validate required field
 */
export const validateRequired = (value: string, fieldName: string): string | true => {
  if (!value || !value.trim()) {
    return `${fieldName} ist erforderlich`
  }
  return true
}

/**
 * Validate minimum length
 */
export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string
): string | true => {
  if (value.length < minLength) {
    return `${fieldName} muss mindestens ${minLength} Zeichen lang sein`
  }
  return true
}

/**
 * Create Vuetify validation rules
 */
export const rules = {
  required: (fieldName: string) => (v: string) =>
    validateRequired(v, fieldName),

  minLength: (minLength: number, fieldName: string) => (v: string) =>
    validateMinLength(v, minLength, fieldName),

  password: (v: string) => {
    const result = validatePassword(v)
    return result.valid || result.message
  },

  githubToken: (v: string) => {
    const result = validateGitHubToken(v)
    return result.valid || result.message
  },

  openaiKey: (v: string) => {
    if (!v) return true // Optional
    const result = validateOpenAIKey(v)
    return result.valid || result.message
  },

  passwordMatch: (password: string) => (v: string) =>
    v === password || 'Passwörter stimmen nicht überein'
}
