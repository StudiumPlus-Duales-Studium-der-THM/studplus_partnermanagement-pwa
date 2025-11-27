export enum NoteStatus {
  RECORDED = 'recorded',
  TRANSCRIBING = 'transcribing',
  TRANSCRIBED = 'transcribed',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  SENDING = 'sending',
  SENT = 'sent',
  ERROR = 'error'
}

export interface VoiceNote {
  id: string
  audioBlob: Blob | null
  audioBlobUrl?: string
  transcription?: string
  processedText?: string
  selectedCompanyId?: string
  selectedContactId?: string
  recordedAt: Date
  conversationDate?: string // Extracted date from transcript in format DD.MM.YYYY
  status: NoteStatus
  errorMessage?: string
  githubIssueUrl?: string
  githubIssueNumber?: number
}

export interface VoiceNoteCreateInput {
  audioBlob: Blob
  recordedAt?: Date
}

export interface VoiceNoteUpdateInput {
  id: string
  transcription?: string
  processedText?: string
  selectedCompanyId?: string
  selectedContactId?: string
  conversationDate?: string
  status?: NoteStatus
  errorMessage?: string
  githubIssueUrl?: string
  githubIssueNumber?: number
}
