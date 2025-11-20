<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <img
        src="/studium-plus-logo.png"
        alt="Studium Plus"
        style="height: 24px; filter: brightness(0) invert(1);"
        class="mr-2 ml-4"
      />
      <v-app-bar-title class="text-white font-weight-bold">Partner-Notizen</v-app-bar-title>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon color="white">mdi-cog</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <!-- Welcome message -->
        <v-card class="mb-4">
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="white" size="40" class="mr-3">
                <v-icon color="primary" size="40">mdi-account-circle</v-icon>
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-medium">
                  Willkommen, {{ authStore.userName }}
                </div>
                <div class="text-caption text-grey">
                  {{ pendingCount }} Notizen ausstehend
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Quick actions -->
        <v-row>
          <v-col cols="12">
            <v-card
              class="text-center pa-8"
              @click="$router.push('/recording')"
              hover
              ripple
            >
              <v-icon size="80" color="primary" class="mb-4">
                mdi-microphone
              </v-icon>
              <div class="text-h6">Neue Aufnahme</div>
              <div class="text-caption text-grey">
                Gesprächsnotiz aufnehmen
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Recent notes -->
        <div class="text-subtitle-1 font-weight-medium mt-6 mb-2">
          Letzte Notizen
        </div>

        <v-card v-if="recentNotes.length === 0">
          <v-card-text class="text-center text-grey">
            <v-icon size="40" class="mb-2">mdi-note-off</v-icon>
            <div>Noch keine Notizen vorhanden</div>
          </v-card-text>
        </v-card>

        <v-list v-else>
          <v-list-item
            v-for="note in recentNotes"
            :key="note.id"
            @click="handleNoteClick(note)"
            :class="{ 'cursor-pointer': isClickable(note) }"
          >
            <template v-slot:prepend>
              <v-icon :color="getStatusColor(note.status)">
                {{ getStatusIcon(note.status) }}
              </v-icon>
            </template>

            <v-list-item-title>
              {{ getCompanyName(note.selectedCompanyId) || 'Unbekanntes Unternehmen' }}
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ formatRelativeTime(note.recordedAt) }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-chip
                :color="getStatusColor(note.status)"
                size="small"
                variant="tonal"
              >
                {{ getStatusLabel(note.status) }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>

        <v-btn
          v-if="voiceNotesStore.notes.length > 3"
          block
          variant="text"
          color="primary"
          class="mt-2"
          @click="$router.push('/history')"
        >
          Alle anzeigen
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
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
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useVoiceNotesStore } from '@/stores/voiceNotes'
import { useCompaniesStore } from '@/stores/companies'
import { useProcessing } from '@/composables/useProcessing'
import { formatRelativeTime, getStatusLabel, getStatusColor } from '@/utils/formatters'
import { NoteStatus, type VoiceNote } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const voiceNotesStore = useVoiceNotesStore()
const companiesStore = useCompaniesStore()
const { processNote } = useProcessing()

onMounted(async () => {
  await voiceNotesStore.loadNotes()
  if (authStore.githubToken) {
    await companiesStore.initialize(authStore.githubToken)
  }
})

const recentNotes = computed(() => voiceNotesStore.notes.slice(0, 3))

const pendingCount = computed(() => voiceNotesStore.pendingNotes.length)

const getCompanyName = (companyId?: string) => {
  if (!companyId) return null
  const company = companiesStore.getCompanyById(companyId)
  return company?.name || null
}

const getStatusIcon = (status: NoteStatus) => {
  const icons: Record<NoteStatus, string> = {
    [NoteStatus.RECORDED]: 'mdi-microphone',
    [NoteStatus.TRANSCRIBING]: 'mdi-loading',
    [NoteStatus.TRANSCRIBED]: 'mdi-text',
    [NoteStatus.PROCESSING]: 'mdi-loading',
    [NoteStatus.PROCESSED]: 'mdi-file-document',
    [NoteStatus.SENDING]: 'mdi-loading',
    [NoteStatus.SENT]: 'mdi-check-circle',
    [NoteStatus.ERROR]: 'mdi-alert-circle'
  }
  return icons[status] || 'mdi-help-circle'
}

const isClickable = (note: VoiceNote) => {
  return [
    NoteStatus.RECORDED,
    NoteStatus.TRANSCRIBED,
    NoteStatus.PROCESSED,
    NoteStatus.SENT,
    NoteStatus.ERROR
  ].includes(note.status)
}

const handleNoteClick = async (note: VoiceNote) => {
  switch (note.status) {
    case NoteStatus.RECORDED:
      // Go back to recording view to listen and process
      router.push(`/recording/${note.id}`)
      break
    case NoteStatus.ERROR:
      // Retry processing
      await processNote(note.id)
      break
    case NoteStatus.TRANSCRIBED:
    case NoteStatus.PROCESSED:
      // Go to preview
      router.push(`/preview/${note.id}`)
      break
    case NoteStatus.SENT:
      // Open GitHub issue
      if (note.githubIssueUrl) {
        window.open(note.githubIssueUrl, '_blank')
      }
      break
  }
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
