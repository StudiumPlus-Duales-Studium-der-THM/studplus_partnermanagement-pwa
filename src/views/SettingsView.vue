<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-btn icon @click="$router.back()">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <img
        src="/studium-plus-logo.png"
        alt="Studium Plus"
        style="height: 24px; filter: brightness(0) invert(1);"
        class="mr-2"
      />
      <v-app-bar-title class="text-white font-weight-bold">Einstellungen</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container>
        <!-- User Profile -->
        <v-card class="mb-4">
          <v-card-title>
            <v-icon start>mdi-account</v-icon>
            Profil
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="userName"
              label="Name"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              readonly
              hint="Der Name wird in der Backend-Konfiguration verwaltet"
              persistent-hint
            ></v-text-field>
          </v-card-text>
        </v-card>

        <!-- Security -->
        <v-card class="mb-4">
          <v-card-title>
            <v-icon start>mdi-lock</v-icon>
            Sicherheit
          </v-card-title>
          <v-card-text>
            <!-- Auto-lock -->
            <v-select
              v-model="settingsStore.autoLockMinutes"
              :items="AUTO_LOCK_OPTIONS"
              label="Automatische Sperre"
              prepend-inner-icon="mdi-timer"
              variant="outlined"
            ></v-select>
          </v-card-text>
        </v-card>

        <!-- Data -->
        <v-card class="mb-4">
          <v-card-title>
            <v-icon start>mdi-database</v-icon>
            Daten
          </v-card-title>
          <v-card-text>
            <!-- Update companies -->
            <div class="d-flex align-center mb-4">
              <div class="flex-grow-1">
                <div class="text-body-2">Unternehmensdaten</div>
                <div class="text-caption text-grey">
                  {{ settingsStore.lastCompaniesUpdate
                    ? `Zuletzt aktualisiert: ${formatDate(settingsStore.lastCompaniesUpdate)}`
                    : 'Noch nicht aktualisiert' }}
                </div>
              </div>
              <v-btn
                variant="outlined"
                :loading="isUpdatingCompanies"
                @click="updateCompanies"
              >
                <v-icon start>mdi-refresh</v-icon>
                Aktualisieren
              </v-btn>
            </div>

            <v-divider class="mb-4"></v-divider>

            <!-- Dark mode -->
            <v-switch
              v-model="settingsStore.darkMode"
              label="Dunkler Modus"
              color="primary"
            ></v-switch>
          </v-card-text>
        </v-card>

        <!-- About -->
        <v-card class="mb-4">
          <v-card-title>
            <v-icon start>mdi-information</v-icon>
            Über die App
          </v-card-title>
          <v-card-text>
            <div class="text-body-2">
              <strong>StudiumPlus Partner-Notizen</strong>
            </div>
            <div class="text-caption text-grey mb-2">
              Version {{ APP_VERSION }}
            </div>
            <p class="text-body-2 mb-4">
              KI-gestützte Gesprächsnotizen für Partnerunternehmen von StudiumPlus.
            </p>
          </v-card-text>
        </v-card>

        <!-- Danger zone -->
        <v-card class="mb-4">
          <v-card-title class="text-error">
            <v-icon start color="error">mdi-alert</v-icon>
            Erweitert
          </v-card-title>
          <v-card-text>
            <v-btn
              color="error"
              variant="outlined"
              @click="clearAllData"
            >
              <v-icon start>mdi-delete</v-icon>
              Alle Daten löschen
            </v-btn>
            <p class="text-caption text-grey mt-2">
              Löscht alle lokalen Daten einschließlich Notizen und Einstellungen.
            </p>
          </v-card-text>
        </v-card>

        <!-- Logout -->
        <v-btn
          block
          color="error"
          variant="outlined"
          @click="logout"
          class="mb-4"
        >
          <v-icon start>mdi-logout</v-icon>
          Abmelden
        </v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useCompaniesStore } from '@/stores/companies'
import { useVoiceNotesStore } from '@/stores/voiceNotes'
import { useNotificationStore } from '@/stores/notification'
import { clearAllData as clearDB } from '@/services/db'
import { formatDate } from '@/utils/formatters'
import { AUTO_LOCK_OPTIONS, APP_VERSION } from '@/utils/constants'

const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const companiesStore = useCompaniesStore()
const voiceNotesStore = useVoiceNotesStore()
const notificationStore = useNotificationStore()

// Profile
const userName = ref(authStore.userName || '')

// Data
const isUpdatingCompanies = ref(false)

// Data
const updateCompanies = async () => {
  isUpdatingCompanies.value = true
  try {
    const success = await companiesStore.fetchFromGitHub()
    if (success) {
      notificationStore.success(`${companiesStore.companyCount} Unternehmen geladen`)
    } else {
      notificationStore.error('Fehler beim Aktualisieren')
    }
  } finally {
    isUpdatingCompanies.value = false
  }
}

const clearAllData = async () => {
  if (confirm('Sind Sie sicher? Alle lokalen Daten werden unwiderruflich gelöscht.')) {
    try {
      await clearDB()
      await voiceNotesStore.clearAllNotes()
      notificationStore.success('Alle Daten gelöscht')
      router.push('/onboarding')
    } catch {
      notificationStore.error('Fehler beim Löschen')
    }
  }
}

const logout = () => {
  authStore.logout()
  router.push('/auth')
}
</script>
