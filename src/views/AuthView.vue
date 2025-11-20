<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="pa-4">
          <v-card-title class="text-center">
            <v-icon size="60" color="primary" class="mb-2">
              mdi-microphone
            </v-icon>
            <div class="text-h5">Partner-Notizen</div>
          </v-card-title>

          <v-card-text>
            <!-- WebAuthn Button -->
            <v-btn
              v-if="webAuthnAvailable"
              block
              size="large"
              color="primary"
              class="mb-4"
              prepend-icon="mdi-fingerprint"
              :loading="isAuthenticating"
              @click="authenticateWithBiometrics"
            >
              Mit Biometrie entsperren
            </v-btn>

            <v-divider v-if="webAuthnAvailable" class="mb-4">
              <span class="text-caption text-grey px-2">oder</span>
            </v-divider>

            <!-- Password Login -->
            <v-form @submit.prevent="login">
              <v-text-field
                v-model="password"
                label="Passwort"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                :error-messages="errorMessage"
                variant="outlined"
                autofocus
              ></v-text-field>

              <v-btn
                type="submit"
                block
                size="large"
                color="primary"
                :loading="isAuthenticating"
                :disabled="!password"
                class="mt-2"
              >
                Anmelden
              </v-btn>
            </v-form>

            <!-- Failed attempts warning -->
            <v-alert
              v-if="failedAttempts >= 3"
              type="warning"
              variant="tonal"
              density="compact"
              class="mt-4"
            >
              Zu viele Fehlversuche. Bitte warten Sie einen Moment.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const password = ref('')
const showPassword = ref(false)
const isAuthenticating = ref(false)
const errorMessage = ref('')
const failedAttempts = ref(0)
const webAuthnAvailable = ref(false)

onMounted(async () => {
  webAuthnAvailable.value = await authStore.isWebAuthnAvailable()
})

const login = async () => {
  if (!password.value || failedAttempts.value >= 3) return

  isAuthenticating.value = true
  errorMessage.value = ''

  try {
    const success = await authStore.login(password.value)

    if (success) {
      router.push('/')
    } else {
      failedAttempts.value++
      errorMessage.value = 'Falsches Passwort'

      if (failedAttempts.value >= 3) {
        // Wait 1 minute before allowing more attempts
        setTimeout(() => {
          failedAttempts.value = 0
        }, 60000)
      }
    }
  } catch (error) {
    console.error('Login failed:', error)
    notificationStore.error('Anmeldung fehlgeschlagen')
  } finally {
    isAuthenticating.value = false
  }
}

const authenticateWithBiometrics = async () => {
  isAuthenticating.value = true
  errorMessage.value = ''

  try {
    const success = await authStore.authenticateWithWebAuthn()

    if (success) {
      router.push('/')
    } else {
      errorMessage.value = 'Session abgelaufen. Bitte mit Passwort anmelden.'
      notificationStore.info('Melden Sie sich einmal mit Passwort an, um die biometrische Authentifizierung zu aktivieren.')
    }
  } catch (error) {
    console.error('WebAuthn failed:', error)
    errorMessage.value = 'Biometrische Authentifizierung fehlgeschlagen'
  } finally {
    isAuthenticating.value = false
  }
}
</script>
