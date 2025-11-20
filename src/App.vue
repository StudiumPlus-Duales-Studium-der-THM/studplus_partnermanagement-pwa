<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>

    <!-- Global Snackbar for notifications -->
    <v-snackbar
      v-model="notificationStore.showSnackbar"
      :color="notificationStore.snackbarColor"
      :timeout="notificationStore.snackbarTimeout"
      location="bottom"
    >
      {{ notificationStore.snackbarMessage }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="notificationStore.hideSnackbar()"
        >
          Schließen
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Offline indicator -->
    <v-snackbar
      v-model="isOffline"
      color="warning"
      :timeout="-1"
      location="top"
    >
      <v-icon start>mdi-wifi-off</v-icon>
      Keine Internetverbindung
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const notificationStore = useNotificationStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const isOffline = ref(!navigator.onLine)

let autoLockInterval: number | null = null

const updateOnlineStatus = () => {
  isOffline.value = !navigator.onLine
}

// Update activity on user interaction
const updateActivity = () => {
  if (authStore.isAuthenticated) {
    authStore.updateActivity()
  }
}

// Check auto-lock periodically
const checkAutoLock = async () => {
  if (authStore.isAuthenticated && settingsStore.autoLockMinutes > 0) {
    await authStore.checkAutoLock(settingsStore.autoLockMinutes)
    if (!authStore.isAuthenticated) {
      router.push('/auth')
    }
  }
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)

  // Track user activity - comprehensive event tracking for mobile
  window.addEventListener('click', updateActivity)
  window.addEventListener('keydown', updateActivity)
  window.addEventListener('touchstart', updateActivity)
  window.addEventListener('touchmove', updateActivity)
  window.addEventListener('touchend', updateActivity)
  window.addEventListener('scroll', updateActivity, { passive: true })

  // Track when user returns to the app
  document.addEventListener('visibilitychange', updateActivity)

  // Check auto-lock every 30 seconds
  autoLockInterval = window.setInterval(checkAutoLock, 30000)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
  window.removeEventListener('click', updateActivity)
  window.removeEventListener('keydown', updateActivity)
  window.removeEventListener('touchstart', updateActivity)
  window.removeEventListener('touchmove', updateActivity)
  window.removeEventListener('touchend', updateActivity)
  window.removeEventListener('scroll', updateActivity)
  document.removeEventListener('visibilitychange', updateActivity)

  if (autoLockInterval) {
    clearInterval(autoLockInterval)
  }
})
</script>

<style scoped>
</style>
