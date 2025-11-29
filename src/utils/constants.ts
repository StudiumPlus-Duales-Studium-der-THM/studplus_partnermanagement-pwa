// App configuration
export const APP_NAME = 'StudiumPlus Partner-Notizen'
export const APP_VERSION = '1.0.0'

// Auto-lock options (in minutes)
export const AUTO_LOCK_OPTIONS = [
  { title: '1 Minute', value: 1 },
  { title: '5 Minuten', value: 5 },
  { title: '15 Minuten', value: 15 },
  { title: 'Aus', value: 0 }
]

// Recording limits
export const MIN_RECORDING_SECONDS = 3
export const MAX_RECORDING_SECONDS = 300 // 5 minutes

// API configuration
export const NELE_AI_API_BASE = 'https://api.aieva.io/api:v1'
export const GITHUB_API_BASE = 'https://api.github.com'

// Retry configuration
export const MAX_RETRIES = 4
export const RETRY_DELAYS = [2000, 4000, 8000, 16000] // Exponential backoff

// Recording hints
export const RECORDING_HINTS = [
  'Unternehmen & Ansprechpartner',
  'Datum des Gesprächs',
  'Besprochene Themen',
  'Vereinbarungen',
  'Nächste Schritte'
]

// Status messages
export const STATUS_MESSAGES = {
  recording: 'Aufnahme läuft...',
  transcribing: 'Transkribiere Audio...',
  matching: 'Erkenne Unternehmen...',
  processing: 'Bereite Text auf...',
  sending: 'Erstelle GitHub Issue...',
  success: 'Erfolgreich gesendet!',
  error: 'Ein Fehler ist aufgetreten'
}

// Error messages
export const ERROR_MESSAGES = {
  noMicrophone: 'Kein Mikrofon gefunden',
  microphonePermission: 'Mikrofon-Zugriff wurde verweigert',
  noInternet: 'Keine Internetverbindung',
  transcriptionFailed: 'Transkription fehlgeschlagen',
  processingFailed: 'Textaufbereitung fehlgeschlagen',
  sendFailed: 'Issue konnte nicht erstellt werden',
  invalidToken: 'GitHub Token ungültig',
  tokenExpired: 'GitHub Token abgelaufen'
}
