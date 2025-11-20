<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>Historie</v-app-bar-title>

      <!-- Filter menu -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-filter</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="filterStatus = null">
            <v-list-item-title>Alle</v-list-item-title>
          </v-list-item>
          <v-list-item @click="filterStatus = NoteStatus.RECORDED">
            <v-list-item-title>Aufgenommen</v-list-item-title>
          </v-list-item>
          <v-list-item @click="filterStatus = NoteStatus.PROCESSED">
            <v-list-item-title>Verarbeitet</v-list-item-title>
          </v-list-item>
          <v-list-item @click="filterStatus = NoteStatus.SENT">
            <v-list-item-title>Gesendet</v-list-item-title>
          </v-list-item>
          <v-list-item @click="filterStatus = NoteStatus.ERROR">
            <v-list-item-title>Fehler</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container>
        <!-- Filter indicator -->
        <v-chip
          v-if="filterStatus"
          closable
          class="mb-4"
          @click:close="filterStatus = null"
        >
          Filter: {{ getStatusLabel(filterStatus) }}
        </v-chip>

        <!-- Empty state -->
        <v-card v-if="filteredNotes.length === 0" class="text-center pa-8">
          <v-icon size="60" color="grey" class="mb-4">mdi-note-off</v-icon>
          <div class="text-h6 mb-2">Keine Notizen</div>
          <div class="text-body-2 text-grey mb-4">
            {{ filterStatus ? 'Keine Notizen mit diesem Status' : 'Noch keine Notizen vorhanden' }}
          </div>
          <v-btn color="primary" @click="$router.push('/recording')">
            <v-icon start>mdi-microphone</v-icon>
            Neue Aufnahme
          </v-btn>
        </v-card>

        <!-- Notes list -->
        <v-list v-else>
          <v-list-item
            v-for="note in filteredNotes"
            :key="note.id"
            class="mb-2"
          >
            <template v-slot:prepend>
              <v-avatar :color="getStatusColor(note.status)" size="40">
                <v-icon color="white" size="small">
                  {{ getStatusIcon(note.status) }}
                </v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ getCompanyName(note.selectedCompanyId) || 'Unbekannt' }}
            </v-list-item-title>

            <v-list-item-subtitle>
              <div>{{ formatDate(note.recordedAt) }}</div>
              <div v-if="note.selectedContactId" class="text-caption">
                {{ getContactName(note.selectedCompanyId, note.selectedContactId) }}
              </div>
            </v-list-item-subtitle>

            <template v-slot:append>
              <div class="d-flex align-center">
                <v-chip
                  :color="getStatusColor(note.status)"
                  size="small"
                  variant="tonal"
                  class="mr-2"
                >
                  {{ getStatusLabel(note.status) }}
                </v-chip>

                <!-- Actions -->
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn icon variant="text" size="small" v-bind="props">
                      <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <!-- View/Edit -->
                    <v-list-item
                      v-if="canEdit(note.status)"
                      @click="editNote(note.id)"
                    >
                      <template v-slot:prepend>
                        <v-icon>mdi-pencil</v-icon>
                      </template>
                      <v-list-item-title>Bearbeiten</v-list-item-title>
                    </v-list-item>

                    <!-- Open GitHub issue -->
                    <v-list-item
                      v-if="note.githubIssueUrl"
                      :href="note.githubIssueUrl"
                      target="_blank"
                    >
                      <template v-slot:prepend>
                        <v-icon>mdi-github</v-icon>
                      </template>
                      <v-list-item-title>Issue öffnen</v-list-item-title>
                    </v-list-item>

                    <!-- Retry -->
                    <v-list-item
                      v-if="note.status === NoteStatus.ERROR"
                      @click="retryNote(note.id)"
                    >
                      <template v-slot:prepend>
                        <v-icon>mdi-refresh</v-icon>
                      </template>
                      <v-list-item-title>Erneut versuchen</v-list-item-title>
                    </v-list-item>

                    <!-- Delete -->
                    <v-list-item @click="deleteNote(note.id)">
                      <template v-slot:prepend>
                        <v-icon color="error">mdi-delete</v-icon>
                      </template>
                      <v-list-item-title class="text-error">Löschen</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-container>
    </v-main>

    <!-- Bottom Navigation -->
    <v-bottom-navigation grow>
      <v-btn value="home" to="/">
        <v-icon>mdi-home</v-icon>
        <span>Start</span>
      </v-btn>
      <v-btn value="recording" to="/recording">
        <v-icon>mdi-microphone</v-icon>
        <span>Aufnahme</span>
      </v-btn>
      <v-btn value="history" to="/history">
        <v-icon>mdi-history</v-icon>
        <span>Historie</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVoiceNotesStore } from '@/stores/voiceNotes'
import { useCompaniesStore } from '@/stores/companies'
import { useNotificationStore } from '@/stores/notification'
import { useProcessing } from '@/composables/useProcessing'
import { formatDate, getStatusLabel, getStatusColor } from '@/utils/formatters'
import { NoteStatus } from '@/types'

const router = useRouter()
const voiceNotesStore = useVoiceNotesStore()
const companiesStore = useCompaniesStore()
const notificationStore = useNotificationStore()
const { processNote } = useProcessing()

const filterStatus = ref<NoteStatus | null>(null)

onMounted(async () => {
  await voiceNotesStore.loadNotes()
})

// Filtered notes
const filteredNotes = computed(() => {
  if (!filterStatus.value) {
    return voiceNotesStore.notes
  }
  return voiceNotesStore.notes.filter((n) => n.status === filterStatus.value)
})

// Helper functions
const getCompanyName = (companyId?: string): string | null => {
  if (!companyId) return null
  const company = companiesStore.getCompanyById(companyId)
  return company?.name || null
}

const getContactName = (companyId?: string, contactId?: string): string | null => {
  if (!companyId || !contactId) return null
  const contact = companiesStore.getContactById(companyId, contactId)
  return contact ? companiesStore.formatContactName(contact) : null
}

const getStatusIcon = (status: NoteStatus): string => {
  const icons: Record<NoteStatus, string> = {
    [NoteStatus.RECORDED]: 'mdi-microphone',
    [NoteStatus.TRANSCRIBING]: 'mdi-loading',
    [NoteStatus.TRANSCRIBED]: 'mdi-text',
    [NoteStatus.PROCESSING]: 'mdi-loading',
    [NoteStatus.PROCESSED]: 'mdi-file-document',
    [NoteStatus.SENDING]: 'mdi-loading',
    [NoteStatus.SENT]: 'mdi-check',
    [NoteStatus.ERROR]: 'mdi-alert'
  }
  return icons[status] || 'mdi-help'
}

const canEdit = (status: NoteStatus): boolean => {
  return [
    NoteStatus.TRANSCRIBED,
    NoteStatus.PROCESSED
  ].includes(status)
}

// Actions
const editNote = (noteId: string) => {
  router.push(`/preview/${noteId}`)
}

const retryNote = async (noteId: string) => {
  const success = await processNote(noteId)
  if (success) {
    notificationStore.success('Verarbeitung gestartet')
    router.push(`/preview/${noteId}`)
  }
}

const deleteNote = async (noteId: string) => {
  if (confirm('Möchten Sie diese Notiz wirklich löschen?')) {
    await voiceNotesStore.deleteNote(noteId)
    notificationStore.info('Notiz gelöscht')
  }
}
</script>
