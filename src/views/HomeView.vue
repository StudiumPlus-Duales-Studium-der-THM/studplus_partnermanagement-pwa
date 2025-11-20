<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>Partner-Notizen</v-app-bar-title>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <!-- Welcome message -->
        <v-card class="mb-4">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon color="primary" size="40" class="mr-3">
                mdi-account-circle
              </v-icon>
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
            :to="note.status === 'processed' ? `/preview/${note.id}` : undefined"
            :href="note.githubIssueUrl"
            :target="note.githubIssueUrl ? '_blank' : undefined"
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
import { useAuthStore } from '@/stores/auth'
import { useVoiceNotesStore } from '@/stores/voiceNotes'
import { useCompaniesStore } from '@/stores/companies'
import { formatRelativeTime, getStatusLabel, getStatusColor } from '@/utils/formatters'
import { NoteStatus } from '@/types'

const authStore = useAuthStore()
const voiceNotesStore = useVoiceNotesStore()
const companiesStore = useCompaniesStore()

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
</script>
