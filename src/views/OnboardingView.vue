<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-card>
          <v-card-title class="text-h5 text-center py-4">
            Willkommen bei Partner-Notizen
          </v-card-title>

          <v-stepper v-model="step" alt-labels>
            <v-stepper-header>
              <v-stepper-item
                :complete="step > 1"
                :value="1"
                title="Willkommen"
              ></v-stepper-item>
              <v-divider></v-divider>
              <v-stepper-item
                :complete="step > 2"
                :value="2"
                title="Name"
              ></v-stepper-item>
              <v-divider></v-divider>
              <v-stepper-item
                :complete="step > 3"
                :value="3"
                title="Passwort"
              ></v-stepper-item>
              <v-divider></v-divider>
              <v-stepper-item
                :complete="step > 4"
                :value="4"
                title="GitHub"
              ></v-stepper-item>
            </v-stepper-header>

            <v-stepper-window>
              <!-- Step 1: Welcome -->
              <v-stepper-window-item :value="1">
                <v-card-text class="text-center">
                  <v-icon size="80" color="primary" class="mb-4">
                    mdi-microphone
                  </v-icon>
                  <h3 class="text-h6 mb-4">KI-gestützte Gesprächsnotizen</h3>
                  <p class="text-body-2 mb-4">
                    Diese App hilft Ihnen, Gesprächsnotizen mit Partnerunternehmen
                    aufzunehmen, automatisch zu transkribieren und als GitHub Issues
                    zu speichern.
                  </p>
                  <p class="text-body-2">
                    Für die Einrichtung benötigen Sie:
                  </p>
                  <v-list density="compact" class="text-left">
                    <v-list-item prepend-icon="mdi-account">
                      Ihren Namen
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-lock">
                      Ein Passwort zum Schutz der App
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-github">
                      Einen GitHub Personal Access Token
                    </v-list-item>
                  </v-list>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="step = 2">
                    Weiter
                    <v-icon end>mdi-arrow-right</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-stepper-window-item>

              <!-- Step 2: Name -->
              <v-stepper-window-item :value="2">
                <v-card-text>
                  <v-text-field
                    v-model="formData.userName"
                    label="Ihr Name"
                    placeholder="z.B. Prof. Dr. Max Mustermann"
                    prepend-inner-icon="mdi-account"
                    :rules="[rules.required('Name')]"
                    variant="outlined"
                    autofocus
                  ></v-text-field>
                  <p class="text-caption text-grey">
                    Dieser Name wird in den erstellten GitHub Issues angezeigt.
                  </p>
                </v-card-text>
                <v-card-actions>
                  <v-btn variant="text" @click="step = 1">
                    <v-icon start>mdi-arrow-left</v-icon>
                    Zurück
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="primary"
                    :disabled="!formData.userName"
                    @click="step = 3"
                  >
                    Weiter
                    <v-icon end>mdi-arrow-right</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-stepper-window-item>

              <!-- Step 3: Password -->
              <v-stepper-window-item :value="3">
                <v-card-text>
                  <v-text-field
                    v-model="formData.password"
                    label="Passwort"
                    :type="showPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPassword = !showPassword"
                    :rules="[rules.password]"
                    variant="outlined"
                    class="mb-4"
                  ></v-text-field>
                  <v-text-field
                    v-model="formData.passwordConfirm"
                    label="Passwort bestätigen"
                    :type="showPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock-check"
                    :rules="[rules.passwordMatch(formData.password)]"
                    variant="outlined"
                  ></v-text-field>
                  <p class="text-caption text-grey">
                    Mindestens 8 Zeichen. Das Passwort schützt Ihre sensiblen Daten.
                  </p>
                </v-card-text>
                <v-card-actions>
                  <v-btn variant="text" @click="step = 2">
                    <v-icon start>mdi-arrow-left</v-icon>
                    Zurück
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="primary"
                    :disabled="!isPasswordValid"
                    @click="step = 4"
                  >
                    Weiter
                    <v-icon end>mdi-arrow-right</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-stepper-window-item>

              <!-- Step 4: GitHub Token -->
              <v-stepper-window-item :value="4">
                <v-card-text>
                  <v-text-field
                    v-model="formData.githubToken"
                    label="GitHub Personal Access Token"
                    :type="showToken ? 'text' : 'password'"
                    prepend-inner-icon="mdi-github"
                    :append-inner-icon="showToken ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showToken = !showToken"
                    :rules="[rules.githubToken]"
                    variant="outlined"
                    class="mb-4"
                  ></v-text-field>

                  <v-text-field
                    v-model="formData.openaiApiKey"
                    label="OpenAI API Key (optional)"
                    :type="showApiKey ? 'text' : 'password'"
                    prepend-inner-icon="mdi-brain"
                    :append-inner-icon="showApiKey ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showApiKey = !showApiKey"
                    :rules="[rules.openaiKey]"
                    variant="outlined"
                    hint="Für Transkription und Textaufbereitung"
                    persistent-hint
                  ></v-text-field>

                  <v-alert type="info" variant="tonal" density="compact" class="mt-4">
                    <p class="text-caption mb-0">
                      Erstellen Sie einen Fine-grained PAT mit Berechtigungen für
                      <strong>Issues: Read/Write</strong> und
                      <strong>Contents: Read</strong>.
                    </p>
                  </v-alert>
                </v-card-text>
                <v-card-actions>
                  <v-btn variant="text" @click="step = 3">
                    <v-icon start>mdi-arrow-left</v-icon>
                    Zurück
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="primary"
                    :disabled="!isFormValid"
                    :loading="isLoading"
                    @click="completeSetup"
                  >
                    Einrichtung abschließen
                    <v-icon end>mdi-check</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-stepper-window-item>
            </v-stepper-window>
          </v-stepper>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { rules } from '@/utils/validators'
import { validatePassword, validateGitHubToken } from '@/utils/validators'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const step = ref(1)
const isLoading = ref(false)
const showPassword = ref(false)
const showToken = ref(false)
const showApiKey = ref(false)

const formData = ref({
  userName: '',
  password: '',
  passwordConfirm: '',
  githubToken: '',
  openaiApiKey: ''
})

const isPasswordValid = computed(() => {
  const pwValid = validatePassword(formData.value.password).valid
  const match = formData.value.password === formData.value.passwordConfirm
  return pwValid && match
})

const isFormValid = computed(() => {
  return (
    formData.value.userName &&
    isPasswordValid.value &&
    validateGitHubToken(formData.value.githubToken).valid
  )
})

const completeSetup = async () => {
  if (!isFormValid.value) return

  isLoading.value = true

  try {
    await authStore.completeSetup({
      userName: formData.value.userName,
      password: formData.value.password,
      githubToken: formData.value.githubToken,
      openaiApiKey: formData.value.openaiApiKey || undefined
    })

    notificationStore.success('Einrichtung abgeschlossen!')
    router.push('/auth')
  } catch (error) {
    console.error('Setup failed:', error)
    notificationStore.error('Einrichtung fehlgeschlagen')
  } finally {
    isLoading.value = false
  }
}
</script>
