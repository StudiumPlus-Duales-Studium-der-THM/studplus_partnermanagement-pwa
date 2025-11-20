<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-btn icon @click="$router.back()">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title>Einstellungen</v-app-bar-title>
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
            ></v-text-field>
            <v-btn
              color="primary"
              :loading="isSavingName"
              @click="saveName"
            >
              Namen speichern
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Security -->
        <v-card class="mb-4">
          <v-card-title>
            <v-icon start>mdi-lock</v-icon>
            Sicherheit
          </v-card-title>
          <v-card-text>
            <!-- Change Password -->
            <v-expansion-panels class="mb-4">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  Passwort ändern
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field
                    v-model="oldPassword"
                    label="Aktuelles Passwort"
                    type="password"
                    variant="outlined"
                    class="mb-2"
                  ></v-text-field>
                  <v-text-field
                    v-model="newPassword"
                    label="Neues Passwort"
                    type="password"
                    variant="outlined"
                    class="mb-2"
                  ></v-text-field>
                  <v-text-field
                    v-model="confirmPassword"
                    label="Passwort bestätigen"
                    type="password"
                    variant="outlined"
                  ></v-text-field>
                  <v-btn
                    color="primary"
                    :loading="isChangingPassword"
                    @click="changePassword"
                    class="mt-2"
                  >
                    Passwort ändern
                  </v-btn>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

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

        <!-- API Tokens -->
        <v-card class="mb-4">
          <v-card-title>
            <v-icon start>mdi-key</v-icon>
            API-Konfiguration
          </v-card-title>
          <v-card-text>
            <!-- GitHub Token -->
            <v-expansion-panels class="mb-4">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  GitHub Token
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field
                    v-model="githubToken"
                    label="Personal Access Token"
                    :type="showGithubToken ? 'text' : 'password'"
                    :append-inner-icon="showGithubToken ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showGithubToken = !showGithubToken"
                    variant="outlined"
                  ></v-text-field>
                  <div class="d-flex gap-2">
                    <v-btn
                      color="secondary"
                      variant="outlined"
                      :loading="isValidatingToken"
                      @click="validateToken"
                    >
                      Token validieren
                    </v-btn>
                    <v-btn
                      color="primary"
                      :loading="isSavingToken"
                      @click="saveGithubToken"
                    >
                      Speichern
                    </v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
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
import { validateToken as validateGitHubToken } from '@/services/github.service'
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
const isSavingName = ref(false)

// Password
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isChangingPassword = ref(false)

// Tokens
const githubToken = ref('')
const showGithubToken = ref(false)
const isValidatingToken = ref(false)
const isSavingToken = ref(false)

// Data
const isUpdatingCompanies = ref(false)

// Profile
const saveName = async () => {
  isSavingName.value = true
  try {
    await authStore.updateUserName(userName.value)
    notificationStore.success('Name gespeichert')
  } catch {
    notificationStore.error('Fehler beim Speichern')
  } finally {
    isSavingName.value = false
  }
}

// Password
const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    notificationStore.error('Passwörter stimmen nicht überein')
    return
  }

  isChangingPassword.value = true
  try {
    const success = await authStore.changePassword(oldPassword.value, newPassword.value)
    if (success) {
      notificationStore.success('Passwort geändert')
      oldPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    } else {
      notificationStore.error('Falsches aktuelles Passwort')
    }
  } catch {
    notificationStore.error('Fehler beim Ändern des Passworts')
  } finally {
    isChangingPassword.value = false
  }
}

// Tokens
const validateToken = async () => {
  if (!githubToken.value) return

  isValidatingToken.value = true
  try {
    const result = await validateGitHubToken(githubToken.value)
    if (result.valid) {
      notificationStore.success(`Token gültig. ${result.remaining} API-Aufrufe verbleibend.`)
    } else {
      notificationStore.error('Token ungültig')
    }
  } catch {
    notificationStore.error('Validierung fehlgeschlagen')
  } finally {
    isValidatingToken.value = false
  }
}

const saveGithubToken = async () => {
  isSavingToken.value = true
  try {
    const success = await authStore.updateGithubToken(githubToken.value)
    if (success) {
      notificationStore.success('Token gespeichert')
      githubToken.value = ''
    } else {
      notificationStore.error('Fehler beim Speichern')
    }
  } finally {
    isSavingToken.value = false
  }
}

// Data
const updateCompanies = async () => {
  if (!authStore.githubToken) {
    notificationStore.error('GitHub Token nicht konfiguriert')
    return
  }

  isUpdatingCompanies.value = true
  try {
    const success = await companiesStore.fetchFromGitHub(authStore.githubToken)
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
