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
            <!-- Company selection -->
            <v-autocomplete
              v-model="selectedCompanyId"
              :items="companiesStore.companies"
              item-title="name"
              item-value="id"
              label="Unternehmen"
              prepend-inner-icon="mdi-office-building"
              :loading="companiesStore.isLoading"
              clearable
              @update:model-value="onCompanyChange"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-subtitle>
                    {{ item.raw.location }} - {{ item.raw.partnershipType }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-autocomplete>

            <!-- Contact selection -->
            <v-autocomplete
              v-model="selectedContactId"
              :items="contacts"
              :item-title="formatContactOption"
              item-value="id"
              label="Ansprechpartner"
              prepend-inner-icon="mdi-account"
              clearable
              :disabled="!selectedCompanyId"
              class="mt-4"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-subtitle>
                    {{ item.raw.role }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-autocomplete>

            <!-- Transcription (collapsible) -->
            <v-expansion-panels class="mt-4">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-text</v-icon>
                  Original-Transkription
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p class="text-body-2">{{ note.transcription }}</p>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- Process button (if not yet processed) -->
            <v-btn
              v-if="note.status === 'transcribed' && selectedCompanyId"
              block
              color="secondary"
              class="mt-4"
              :loading="isProcessing"
              @click="processText"
            >
              <v-icon start>mdi-cog</v-icon>
              Text aufbereiten
            </v-btn>

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
import { useNotificationStore } from '@/stores/notification'
import { useProcessing } from '@/composables/useProcessing'
import type { VoiceNote, Contact } from '@/types'
import { NoteStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const voiceNotesStore = useVoiceNotesStore()
const companiesStore = useCompaniesStore()
const notificationStore = useNotificationStore()

const {
  isProcessing,
  processingStep,
  error,
  processTranscription,
  sendToGitHub
} = useProcessing()

const note = ref<VoiceNote | null>(null)
const isLoading = ref(true)
const isSending = ref(false)
const selectedCompanyId = ref<string | null>(null)
const selectedContactId = ref<string | null>(null)
const editedText = ref('')

// Load note
onMounted(async () => {
  const noteId = route.params.id as string
  const loadedNote = await voiceNotesStore.getNoteById(noteId)

  if (loadedNote) {
    note.value = loadedNote
    selectedCompanyId.value = loadedNote.selectedCompanyId || null
    selectedContactId.value = loadedNote.selectedContactId || null
    editedText.value = loadedNote.processedText || ''
  }

  isLoading.value = false
})

// Contacts for selected company
const contacts = computed((): Contact[] => {
  if (!selectedCompanyId.value) return []
  return companiesStore.getContactsByCompanyId(selectedCompanyId.value)
})

// Format contact for autocomplete
const formatContactOption = (contact: Contact): string => {
  return `${contact.firstName} ${contact.lastName}`
}

// Rendered markdown
const renderedMarkdown = computed(() => {
  return marked(editedText.value || '')
})

// Can send check
const canSend = computed(() => {
  return (
    selectedCompanyId.value &&
    editedText.value &&
    note.value?.status === NoteStatus.PROCESSED
  )
})

// Handle company change
const onCompanyChange = async () => {
  // Reset contact when company changes
  selectedContactId.value = null

  // Select primary contact
  if (selectedCompanyId.value) {
    const primaryContact = companiesStore.getPrimaryContact(selectedCompanyId.value)
    if (primaryContact) {
      selectedContactId.value = primaryContact.id
    }
  }
}

// Process text with selected company/contact
const processText = async () => {
  if (!note.value || !selectedCompanyId.value) return

  const success = await processTranscription(
    note.value.id,
    selectedCompanyId.value,
    selectedContactId.value || undefined
  )

  if (success) {
    // Reload note
    const updated = await voiceNotesStore.getNoteById(note.value.id)
    if (updated) {
      note.value = updated
      editedText.value = updated.processedText || ''
    }
  }
}

// Watch for text edits
watch(editedText, async (newText) => {
  if (note.value && newText !== note.value.processedText) {
    await voiceNotesStore.updateNote(note.value.id, { processedText: newText })
  }
})

// Save company/contact selection
watch([selectedCompanyId, selectedContactId], async () => {
  if (note.value) {
    await voiceNotesStore.setCompanyAndContact(
      note.value.id,
      selectedCompanyId.value || '',
      selectedContactId.value || undefined
    )
  }
})

// Send to GitHub
const sendNote = async () => {
  if (!note.value || !selectedCompanyId.value) return

  isSending.value = true

  // Update processed text before sending
  await voiceNotesStore.updateNote(note.value.id, {
    processedText: editedText.value
  })

  const success = await sendToGitHub(note.value.id)

  isSending.value = false

  if (success) {
    router.push('/history')
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
