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
import { ref } from 'vue'
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
</script>
