import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import { voiceNotesDB } from '@/services/db'
import { NoteStatus, type VoiceNote } from '@/types'

export const useVoiceNotesStore = defineStore('voiceNotes', () => {
  const notes = ref<VoiceNote[]>([])
  const currentNote = ref<VoiceNote | null>(null)
  const isLoading = ref(false)

  // Computed
  const pendingNotes = computed(() =>
    notes.value.filter((n) => n.status === NoteStatus.RECORDED)
  )

  const sentNotes = computed(() =>
    notes.value.filter((n) => n.status === NoteStatus.SENT)
  )

  const errorNotes = computed(() =>
    notes.value.filter((n) => n.status === NoteStatus.ERROR)
  )

  // Load all notes from IndexedDB
  const loadNotes = async () => {
    isLoading.value = true
    try {
      notes.value = await voiceNotesDB.getAll()
    } catch (error) {
      console.error('Failed to load notes:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Get a single note by ID
  const getNoteById = async (id: string): Promise<VoiceNote | undefined> => {
    // First check in-memory
    const inMemory = notes.value.find((n) => n.id === id)
    if (inMemory) {
      return inMemory
    }
    // Otherwise load from DB
    return await voiceNotesDB.getById(id)
  }

  // Create a new voice note from audio
  const createNote = async (audioBlob: Blob): Promise<string> => {
    const note: VoiceNote = {
      id: nanoid(),
      audioBlob,
      audioBlobUrl: URL.createObjectURL(audioBlob),
      recordedAt: new Date(),
      status: NoteStatus.RECORDED
    }

    await voiceNotesDB.add(note)
    notes.value.unshift(note)
    currentNote.value = note

    return note.id
  }

  // Update a note
  const updateNote = async (id: string, changes: Partial<VoiceNote>) => {
    await voiceNotesDB.update(id, changes)

    const index = notes.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notes.value[index] = { ...notes.value[index], ...changes }
    }

    if (currentNote.value?.id === id) {
      currentNote.value = { ...currentNote.value, ...changes }
    }
  }

  // Update note status
  const updateStatus = async (id: string, status: NoteStatus, errorMessage?: string) => {
    const changes: Partial<VoiceNote> = { status }
    if (errorMessage) {
      changes.errorMessage = errorMessage
    }
    await updateNote(id, changes)
  }

  // Set transcription
  const setTranscription = async (id: string, transcription: string) => {
    await updateNote(id, {
      transcription,
      status: NoteStatus.TRANSCRIBED
    })
  }

  // Set processed text
  const setProcessedText = async (id: string, processedText: string) => {
    await updateNote(id, {
      processedText,
      status: NoteStatus.PROCESSED
    })
  }

  // Set company and contact
  const setCompanyAndContact = async (
    id: string,
    companyId: string,
    contactId?: string
  ) => {
    await updateNote(id, {
      selectedCompanyId: companyId,
      selectedContactId: contactId
    })
  }

  // Set GitHub issue info
  const setGitHubIssue = async (
    id: string,
    issueUrl: string,
    issueNumber: number
  ) => {
    await updateNote(id, {
      githubIssueUrl: issueUrl,
      githubIssueNumber: issueNumber,
      status: NoteStatus.SENT
    })
  }

  // Delete a note
  const deleteNote = async (id: string) => {
    // Revoke blob URL if exists
    const note = notes.value.find((n) => n.id === id)
    if (note?.audioBlobUrl) {
      URL.revokeObjectURL(note.audioBlobUrl)
    }

    await voiceNotesDB.delete(id)
    notes.value = notes.value.filter((n) => n.id !== id)

    if (currentNote.value?.id === id) {
      currentNote.value = null
    }
  }

  // Clear all notes
  const clearAllNotes = async () => {
    // Revoke all blob URLs
    notes.value.forEach((note) => {
      if (note.audioBlobUrl) {
        URL.revokeObjectURL(note.audioBlobUrl)
      }
    })

    await voiceNotesDB.deleteAll()
    notes.value = []
    currentNote.value = null
  }

  // Set current note
  const setCurrentNote = (note: VoiceNote | null) => {
    currentNote.value = note
  }

  // Filter notes by status
  const getByStatus = (status: NoteStatus): VoiceNote[] => {
    return notes.value.filter((n) => n.status === status)
  }

  // Filter notes by company
  const getByCompany = (companyId: string): VoiceNote[] => {
    return notes.value.filter((n) => n.selectedCompanyId === companyId)
  }

  return {
    notes,
    currentNote,
    isLoading,
    pendingNotes,
    sentNotes,
    errorNotes,
    loadNotes,
    getNoteById,
    createNote,
    updateNote,
    updateStatus,
    setTranscription,
    setProcessedText,
    setCompanyAndContact,
    setGitHubIssue,
    deleteNote,
    clearAllNotes,
    setCurrentNote,
    getByStatus,
    getByCompany
  }
})
