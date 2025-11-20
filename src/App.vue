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
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()
const isOffline = ref(!navigator.onLine)

const updateOnlineStatus = () => {
  isOffline.value = !navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style scoped>
</style>
