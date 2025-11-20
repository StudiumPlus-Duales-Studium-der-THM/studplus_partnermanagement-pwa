import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const showSnackbar = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref('info')
  const snackbarTimeout = ref(3000)

  const show = (message: string, color: string = 'info', timeout: number = 3000) => {
    snackbarMessage.value = message
    snackbarColor.value = color
    snackbarTimeout.value = timeout
    showSnackbar.value = true
  }

  const success = (message: string, timeout: number = 3000) => {
    show(message, 'success', timeout)
  }

  const error = (message: string, timeout: number = 5000) => {
    show(message, 'error', timeout)
  }

  const warning = (message: string, timeout: number = 4000) => {
    show(message, 'warning', timeout)
  }

  const info = (message: string, timeout: number = 3000) => {
    show(message, 'info', timeout)
  }

  const hideSnackbar = () => {
    showSnackbar.value = false
  }

  return {
    showSnackbar,
    snackbarMessage,
    snackbarColor,
    snackbarTimeout,
    show,
    success,
    error,
    warning,
    info,
    hideSnackbar
  }
})
