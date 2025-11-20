<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-btn icon @click="$router.back()">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title>Vorschau & Bestätigung</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-card v-if="note">
          <v-card-text>
            <!-- Company selection with custom entry -->
            <v-combobox
              v-model="companySelection"
              :items="companyOptions"
              item-title="name"
              item-value="id"
              label="Unternehmen"
              prepend-inner-icon="mdi-office-building"
              :loading="companiesStore.isLoading"
              clearable
              :return-object="false"
              @update:model-value="onCompanyChange"
              hint="Aus Liste wählen oder Namen eingeben"
              persistent-hint
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-subtitle v-if="item.raw.location">
                    {{ item.raw.location }} - {{ item.raw.partnershipType }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
              <template v-slot:no-data>
                <v-list-item>
                  <v-list-item-title>
                    Eingabe als benutzerdefinierter Name verwenden
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-combobox>

            <!-- Contact selection with custom entry -->
            <v-combobox
              v-model="contactSelection"
              :items="contactOptions"
              item-title="displayName"
              item-value="id"
              label="Ansprechpartner *"
              prepend-inner-icon="mdi-account"
              :return-object="false"
              class="mt-4"
              :rules="[v => !!v || 'Ansprechpartner ist erforderlich']"
              hint="Aus Liste wählen oder Namen eingeben"
              persistent-hint
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-subtitle v-if="item.raw.role">
                    {{ item.raw.role }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
              <template v-slot:no-data>
                <v-list-item>
                  <v-list-item-title>
                    Eingabe als benutzerdefinierter Name verwenden
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-combobox>

            <!-- Editable Transcription -->
            <div class="mt-4">
              <v-textarea
                v-model="editedTranscription"
                label="Transkription (editierbar)"
                rows="6"
                auto-grow
                variant="outlined"
                hint="Sie können den transkribierten Text vor der Weiterverarbeitung bearbeiten"
                persistent-hint
              >
                <template v-slot:prepend-inner>
                  <v-icon>mdi-text</v-icon>
                </template>
              </v-textarea>
            </div>

            <!-- Action buttons (if not yet processed) -->
            <v-row v-if="note.status === 'transcribed'" class="mt-4" dense>
              <v-col cols="12" sm="6">
                <v-btn
                  block
                  color="secondary"
                  :loading="isProcessing"
                  @click="processText"
                >
                  <v-icon start>mdi-cog</v-icon>
                  Text aufbereiten
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6">
                <v-btn
                  block
                  color="primary"
                  variant="tonal"
                  :loading="isSending"
                  :disabled="!contactSelection"
                  @click="sendDirectly"
                >
                  <v-icon start>mdi-send-outline</v-icon>
                  Direkt senden
                </v-btn>
              </v-col>
            </v-row>

            <!-- Processed text editor -->
            <div v-if="note.processedText" class="mt-4">
              <v-textarea
                v-model="editedText"
                label="Aufbereiteter Text"
                rows="10"
                auto-grow
                variant="outlined"
              ></v-textarea>

              <!-- Markdown preview -->
              <v-card variant="outlined" class="mt-4">
                <v-card-title class="text-subtitle-1">
                  <v-icon start size="small">mdi-eye</v-icon>
                  Vorschau
                </v-card-title>
                <v-card-text>
                  <div class="markdown-preview" v-html="renderedMarkdown"></div>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>

          <v-card-actions class="pa-4">
            <v-btn
              variant="outlined"
              color="error"
              @click="discardNote"
            >
              <v-icon start>mdi-delete</v-icon>
              Verwerfen
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="isSending"
              :disabled="!canSend"
              @click="sendNote"
            >
              <v-icon start>mdi-send</v-icon>
              Senden
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Loading state -->
        <v-card v-else-if="isLoading" class="text-center pa-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <div class="mt-4">Lade Notiz...</div>
        </v-card>

        <!-- Not found -->
        <v-card v-else class="text-center pa-8">
          <v-icon size="60" color="grey">mdi-file-question</v-icon>
          <div class="mt-4 text-h6">Notiz nicht gefunden</div>
          <v-btn
            color="primary"
            class="mt-4"
            @click="$router.push('/history')"
          >
            Zur Historie
          </v-btn>
        </v-card>

        <!-- Processing status -->
        <v-alert
          v-if="processingStep"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          {{ processingStep }}
        </v-alert>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mt-4"
        >
          {{ error }}
        </v-alert>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { useVoiceNotesStore } from '@/stores/voiceNotes'
import { useCompaniesStore } from '@/stores/companies'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { useProcessing } from '@/composables/useProcessing'
import { createIssue, formatIssueBody } from '@/services/github.service'
import type { VoiceNote } from '@/types'
import { NoteStatus } from '@/types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const route = useRoute()
const router = useRouter()
const voiceNotesStore = useVoiceNotesStore()
const companiesStore = useCompaniesStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const {
  isProcessing,
  processingStep,
  error,
  processTranscription
} = useProcessing()

const note = ref<VoiceNote | null>(null)
const isLoading = ref(true)
const isSending = ref(false)
const editedText = ref('')
const editedTranscription = ref('')

// Company and contact selection (can be ID or custom string)
const companySelection = ref<string | null>(null)
const contactSelection = ref<string | null>(null)

// Load note
onMounted(async () => {
  const noteId = route.params.id as string
  const loadedNote = await voiceNotesStore.getNoteById(noteId)

  if (loadedNote) {
    note.value = loadedNote
    // Set initial company selection
    if (loadedNote.selectedCompanyId) {
      const company = companiesStore.getCompanyById(loadedNote.selectedCompanyId)
      companySelection.value = company ? loadedNote.selectedCompanyId : null
    }
    // Set initial contact selection
    if (loadedNote.selectedContactId && loadedNote.selectedCompanyId) {
      const contact = companiesStore.getContactById(loadedNote.selectedCompanyId, loadedNote.selectedContactId)
      contactSelection.value = contact ? loadedNote.selectedContactId : null
    }
    editedText.value = loadedNote.processedText || ''
    editedTranscription.value = loadedNote.transcription || ''
  }

  isLoading.value = false
})

// Company options for combobox
const companyOptions = computed(() => {
  return companiesStore.companies.map(c => ({
    id: c.id,
    name: c.name,
    location: c.location,
    partnershipType: c.partnershipType
  }))
})

// Contact options for combobox
const contactOptions = computed(() => {
  // If a company from the list is selected, show its contacts
  const selectedCompany = companiesStore.getCompanyById(companySelection.value || '')
  if (selectedCompany) {
    return selectedCompany.contacts.map(c => ({
      id: c.id,
      displayName: `${c.firstName} ${c.lastName}`,
      role: c.role
    }))
  }
  return []
})

// Get actual company name (from list or custom)
const getCompanyName = (): string => {
  if (!companySelection.value) return 'Unbekannt'

  // Check if it's an ID from the list
  const company = companiesStore.getCompanyById(companySelection.value)
  if (company) {
    return company.name
  }

  // Otherwise it's a custom string
  return companySelection.value
}

// Get actual contact name (from list or custom)
const getContactName = (): string => {
  if (!contactSelection.value) return 'Nicht angegeben'

  // Check if it's an ID from the list
  if (companySelection.value) {
    const contact = companiesStore.getContactById(companySelection.value, contactSelection.value)
    if (contact) {
      return `${contact.firstName} ${contact.lastName}`
    }
  }

  // Otherwise it's a custom string
  return contactSelection.value
}

// Get contact role if from list
const getContactRole = (): string | undefined => {
  if (!contactSelection.value || !companySelection.value) return undefined

  const contact = companiesStore.getContactById(companySelection.value, contactSelection.value)
  return contact?.role
}

// Rendered markdown
const renderedMarkdown = computed(() => {
  return marked(editedText.value || '')
})

// Can send check - requires contact and processed text
const canSend = computed(() => {
  return (
    contactSelection.value &&
    editedText.value &&
    note.value?.status === NoteStatus.PROCESSED
  )
})

// Handle company change
const onCompanyChange = () => {
  // Reset contact when company changes
  contactSelection.value = null

  // Select primary contact if company from list
  if (companySelection.value) {
    const company = companiesStore.getCompanyById(companySelection.value)
    if (company) {
      const primaryContact = companiesStore.getPrimaryContact(company.id)
      if (primaryContact) {
        contactSelection.value = primaryContact.id
      }
    }
  }
}

// Process text with selected company/contact
const processText = async () => {
  if (!note.value) return

  // Use company name for processing (either from list or custom)
  const companyName = getCompanyName()
  const contactName = getContactName()

  // First, save the edited transcription
  await voiceNotesStore.setTranscription(note.value.id, editedTranscription.value)

  // If we have a company ID, use the regular processing
  const companyId = companiesStore.getCompanyById(companySelection.value || '')?.id

  if (companyId) {
    const success = await processTranscription(
      note.value.id,
      companyId,
      contactSelection.value || undefined
    )

    if (success) {
      const updated = await voiceNotesStore.getNoteById(note.value.id)
      if (updated) {
        note.value = updated
        editedText.value = updated.processedText || ''
      }
    }
  } else {
    // Custom company - process with custom names
    const apiKey = authStore.openaiApiKey
    if (!apiKey) {
      notificationStore.error('OpenAI API-Key nicht konfiguriert')
      return
    }

    try {
      await voiceNotesStore.updateStatus(note.value.id, NoteStatus.PROCESSING)

      const { processText: processTextAPI } = await import('@/services/openai.service')
      const processed = await processTextAPI(
        editedTranscription.value || '',
        companyName,
        contactName,
        apiKey
      )

      await voiceNotesStore.setProcessedText(note.value.id, processed)

      const updated = await voiceNotesStore.getNoteById(note.value.id)
      if (updated) {
        note.value = updated
        editedText.value = updated.processedText || ''
      }
    } catch (err) {
      console.error('Processing failed:', err)
      notificationStore.error('Textaufbereitung fehlgeschlagen')
      await voiceNotesStore.updateStatus(note.value.id, NoteStatus.ERROR, 'Textaufbereitung fehlgeschlagen')
    }
  }
}

// Watch for text edits
watch(editedText, async (newText) => {
  if (note.value && newText !== note.value.processedText) {
    await voiceNotesStore.updateNote(note.value.id, { processedText: newText })
  }
})

// Watch for transcription edits
watch(editedTranscription, async (newTranscription) => {
  if (note.value && newTranscription !== note.value.transcription) {
    await voiceNotesStore.setTranscription(note.value.id, newTranscription)
  }
})

// Send directly to GitHub with unprocessed transcript
const sendDirectly = async () => {
  if (!note.value || !contactSelection.value) return

  const githubToken = authStore.githubToken
  if (!githubToken) {
    notificationStore.error('GitHub Token nicht konfiguriert')
    return
  }

  isSending.value = true

  try {
    // Update transcription before sending
    await voiceNotesStore.setTranscription(note.value.id, editedTranscription.value)

    const companyName = getCompanyName()
    const contactName = getContactName()
    const contactRole = getContactRole()

    const formattedDate = format(note.value.recordedAt, 'dd.MM.yyyy', { locale: de })

    // Get study programs if company is from list
    const company = companiesStore.getCompanyById(companySelection.value || '')
    const studyPrograms = company?.studyPrograms || []

    // Use transcription text instead of processed text
    const issueBody = formatIssueBody({
      companyName,
      contactName,
      contactRole,
      date: formattedDate,
      userName: authStore.userName || 'Unbekannt',
      processedText: editedTranscription.value,
      studyPrograms
    })

    // Create title with company short name or full name
    const shortName = company?.shortName || companyName
    const title = `[${shortName}] - ${formattedDate} - ${authStore.userName}`

    // Create labels
    const labels = ['partner-kontakt']
    if (company?.shortName) {
      labels.push(company.shortName.toLowerCase().replace(/\s+/g, '-'))
    }

    const issue = await createIssue(githubToken, title, issueBody, labels)

    await voiceNotesStore.setGitHubIssue(note.value.id, issue.html_url, issue.number)
    await voiceNotesStore.updateStatus(note.value.id, NoteStatus.SENT)

    notificationStore.success('Issue erfolgreich erstellt!')
    router.push('/history')
  } catch (err) {
    console.error('GitHub issue creation failed:', err)
    notificationStore.error('Issue konnte nicht erstellt werden')
    await voiceNotesStore.updateStatus(note.value.id, NoteStatus.ERROR, 'Issue-Erstellung fehlgeschlagen')
  } finally {
    isSending.value = false
  }
}

// Send to GitHub
const sendNote = async () => {
  if (!note.value || !contactSelection.value) return

  const githubToken = authStore.githubToken
  if (!githubToken) {
    notificationStore.error('GitHub Token nicht konfiguriert')
    return
  }

  isSending.value = true

  try {
    // Update processed text before sending
    await voiceNotesStore.updateNote(note.value.id, {
      processedText: editedText.value
    })

    const companyName = getCompanyName()
    const contactName = getContactName()
    const contactRole = getContactRole()

    const formattedDate = format(note.value.recordedAt, 'dd.MM.yyyy', { locale: de })

    // Get study programs if company is from list
    const company = companiesStore.getCompanyById(companySelection.value || '')
    const studyPrograms = company?.studyPrograms || []

    const issueBody = formatIssueBody({
      companyName,
      contactName,
      contactRole,
      date: formattedDate,
      userName: authStore.userName || 'Unbekannt',
      processedText: editedText.value,
      studyPrograms
    })

    // Create title with company short name or full name
    const shortName = company?.shortName || companyName
    const title = `[${shortName}] - ${formattedDate} - ${authStore.userName}`

    // Create labels
    const labels = ['partner-kontakt']
    if (company?.shortName) {
      labels.push(company.shortName.toLowerCase().replace(/\s+/g, '-'))
    }

    const issue = await createIssue(githubToken, title, issueBody, labels)

    await voiceNotesStore.setGitHubIssue(note.value.id, issue.html_url, issue.number)

    notificationStore.success('Issue erfolgreich erstellt!')
    router.push('/history')
  } catch (err) {
    console.error('GitHub issue creation failed:', err)
    notificationStore.error('Issue konnte nicht erstellt werden')
    await voiceNotesStore.updateStatus(note.value.id, NoteStatus.ERROR, 'Issue-Erstellung fehlgeschlagen')
  } finally {
    isSending.value = false
  }
}

// Discard note
const discardNote = async () => {
  if (!note.value) return

  if (confirm('Möchten Sie diese Notiz wirklich löschen?')) {
    await voiceNotesStore.deleteNote(note.value.id)
    notificationStore.info('Notiz gelöscht')
    router.push('/')
  }
}
</script>

<style scoped>
.markdown-preview {
  :deep(h2) {
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 16px;
    margin-bottom: 8px;
    color: rgb(var(--v-theme-primary));
  }

  :deep(ul), :deep(ol) {
    margin-left: 20px;
    margin-bottom: 12px;
  }

  :deep(li) {
    margin-bottom: 4px;
  }

  :deep(p) {
    margin-bottom: 12px;
  }
}
</style>
