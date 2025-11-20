import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCompaniesStore } from '@/stores/companies'
import { useVoiceNotesStore } from '@/stores/voiceNotes'
import { useNotificationStore } from '@/stores/notification'
import { transcribeAudio, matchCompany, processText } from '@/services/openai.service'
import { createIssue, formatIssueBody } from '@/services/github.service'
import { NoteStatus } from '@/types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export function useProcessing() {
  const isProcessing = ref(false)
  const processingStep = ref('')
  const error = ref<string | null>(null)

  const authStore = useAuthStore()
  const companiesStore = useCompaniesStore()
  const voiceNotesStore = useVoiceNotesStore()
  const notificationStore = useNotificationStore()

  /**
   * Transcribe audio from a voice note
   */
  const transcribe = async (noteId: string): Promise<boolean> => {
    const note = await voiceNotesStore.getNoteById(noteId)
    if (!note || !note.audioBlob) {
      error.value = 'Keine Audioaufnahme gefunden'
      return false
    }

    const apiKey = authStore.openaiApiKey
    if (!apiKey) {
      error.value = 'OpenAI API-Key nicht konfiguriert'
      return false
    }

    try {
      processingStep.value = 'Transkribiere Audio...'
      await voiceNotesStore.updateStatus(noteId, NoteStatus.TRANSCRIBING)

      const transcription = await transcribeAudio(note.audioBlob, apiKey)
      await voiceNotesStore.setTranscription(noteId, transcription)

      return true
    } catch (err) {
      console.error('Transcription failed:', err)
      error.value = 'Transkription fehlgeschlagen'
      await voiceNotesStore.updateStatus(noteId, NoteStatus.ERROR, 'Transkription fehlgeschlagen')
      return false
    }
  }

  /**
   * Match company from transcription
   */
  const matchCompanyFromTranscription = async (noteId: string): Promise<string | null> => {
    const note = await voiceNotesStore.getNoteById(noteId)
    if (!note || !note.transcription) {
      error.value = 'Keine Transkription gefunden'
      return null
    }

    const apiKey = authStore.openaiApiKey
    if (!apiKey) {
      error.value = 'OpenAI API-Key nicht konfiguriert'
      return null
    }

    try {
      processingStep.value = 'Erkenne Unternehmen...'

      const companiesJson = companiesStore.getCompaniesJson()
      const result = await matchCompany(note.transcription, companiesJson, apiKey)

      if (result.matched_company_id) {
        const company = companiesStore.getCompanyById(result.matched_company_id)
        if (company) {
          const primaryContact = companiesStore.getPrimaryContact(company.id)
          await voiceNotesStore.setCompanyAndContact(
            noteId,
            company.id,
            primaryContact?.id
          )
          return company.id
        }
      }

      return null
    } catch (err) {
      console.error('Company matching failed:', err)
      // Not a critical error, user can select manually
      return null
    }
  }

  /**
   * Process and enhance text
   */
  const processTranscription = async (
    noteId: string,
    companyId: string,
    contactId?: string
  ): Promise<boolean> => {
    const note = await voiceNotesStore.getNoteById(noteId)
    if (!note || !note.transcription) {
      error.value = 'Keine Transkription gefunden'
      return false
    }

    const apiKey = authStore.openaiApiKey
    if (!apiKey) {
      error.value = 'OpenAI API-Key nicht konfiguriert'
      return false
    }

    const company = companiesStore.getCompanyById(companyId)
    if (!company) {
      error.value = 'Unternehmen nicht gefunden'
      return false
    }

    try {
      processingStep.value = 'Bereite Text auf...'
      await voiceNotesStore.updateStatus(noteId, NoteStatus.PROCESSING)

      const contact = contactId
        ? companiesStore.getContactById(companyId, contactId)
        : companiesStore.getPrimaryContact(companyId)

      const contactName = contact
        ? companiesStore.formatContactWithRole(contact)
        : 'Nicht angegeben'

      const processed = await processText(
        note.transcription,
        company.name,
        contactName,
        apiKey
      )

      await voiceNotesStore.setProcessedText(noteId, processed)
      return true
    } catch (err) {
      console.error('Text processing failed:', err)
      error.value = 'Textaufbereitung fehlgeschlagen'
      await voiceNotesStore.updateStatus(noteId, NoteStatus.ERROR, 'Textaufbereitung fehlgeschlagen')
      return false
    }
  }

  /**
   * Full processing pipeline
   */
  const processNote = async (noteId: string): Promise<boolean> => {
    isProcessing.value = true
    error.value = null

    try {
      // Step 1: Transcribe
      const transcribed = await transcribe(noteId)
      if (!transcribed) return false

      // Step 2: Match company
      await matchCompanyFromTranscription(noteId)

      // Note: Don't auto-process text yet - user needs to confirm company/contact first

      return true
    } catch (err) {
      console.error('Processing failed:', err)
      error.value = 'Verarbeitung fehlgeschlagen'
      return false
    } finally {
      isProcessing.value = false
      processingStep.value = ''
    }
  }

  /**
   * Send note to GitHub
   */
  const sendToGitHub = async (noteId: string): Promise<boolean> => {
    const note = await voiceNotesStore.getNoteById(noteId)
    if (!note || !note.processedText || !note.selectedCompanyId) {
      error.value = 'Notiz nicht vollständig verarbeitet'
      return false
    }

    const githubToken = authStore.githubToken
    if (!githubToken) {
      error.value = 'GitHub Token nicht konfiguriert'
      return false
    }

    const company = companiesStore.getCompanyById(note.selectedCompanyId)
    if (!company) {
      error.value = 'Unternehmen nicht gefunden'
      return false
    }

    try {
      processingStep.value = 'Erstelle GitHub Issue...'
      await voiceNotesStore.updateStatus(noteId, NoteStatus.SENDING)

      const contact = note.selectedContactId
        ? companiesStore.getContactById(note.selectedCompanyId, note.selectedContactId)
        : undefined

      const formattedDate = format(note.recordedAt, 'dd.MM.yyyy', { locale: de })

      const issueBody = formatIssueBody({
        companyName: company.name,
        contactName: contact
          ? companiesStore.formatContactName(contact)
          : 'Nicht angegeben',
        contactRole: contact?.role,
        date: formattedDate,
        userName: authStore.userName || 'Unbekannt',
        processedText: note.processedText,
        studyPrograms: company.studyPrograms
      })

      const title = `[${company.shortName || company.name}] - ${formattedDate} - ${authStore.userName}`

      const issue = await createIssue(
        githubToken,
        title,
        issueBody,
        ['partner-kontakt', company.shortName.toLowerCase().replace(/\s+/g, '-')]
      )

      await voiceNotesStore.setGitHubIssue(noteId, issue.html_url, issue.number)

      notificationStore.success('Issue erfolgreich erstellt!')
      return true
    } catch (err) {
      console.error('GitHub issue creation failed:', err)
      error.value = 'Issue-Erstellung fehlgeschlagen'
      await voiceNotesStore.updateStatus(noteId, NoteStatus.ERROR, 'Issue-Erstellung fehlgeschlagen')
      notificationStore.error('Issue konnte nicht erstellt werden')
      return false
    } finally {
      isProcessing.value = false
      processingStep.value = ''
    }
  }

  return {
    isProcessing,
    processingStep,
    error,
    transcribe,
    matchCompanyFromTranscription,
    processTranscription,
    processNote,
    sendToGitHub
  }
}
