import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useTheme } from 'vuetify'

export const useSettingsStore = defineStore('settings', () => {
  const theme = useTheme()

  const darkMode = ref(localStorage.getItem('darkMode') === 'true')
  const autoLockMinutes = ref(parseInt(localStorage.getItem('autoLockMinutes') || '15'))
  const lastCompaniesUpdate = ref(localStorage.getItem('lastCompaniesUpdate') || null)
  const showRecordingHints = ref(localStorage.getItem('showRecordingHints') !== 'false')

  // Apply dark mode using Vuetify 3 API
  watch(darkMode, (value) => {
    const themeName = value ? 'dark' : 'light'
    // Vuetify 3.5.x compatible API
    theme.global.name.value = themeName
    localStorage.setItem('darkMode', String(value))
  }, { immediate: true })

  // Save auto-lock setting
  watch(autoLockMinutes, (value) => {
    localStorage.setItem('autoLockMinutes', String(value))
  })

  // Save recording hints preference
  watch(showRecordingHints, (value) => {
    localStorage.setItem('showRecordingHints', String(value))
  })

  const toggleDarkMode = () => {
    darkMode.value = !darkMode.value
  }

  const setAutoLockMinutes = (minutes: number) => {
    autoLockMinutes.value = minutes
  }

  const updateLastCompaniesUpdate = () => {
    const now = new Date().toISOString()
    lastCompaniesUpdate.value = now
    localStorage.setItem('lastCompaniesUpdate', now)
  }

  const hideRecordingHints = () => {
    showRecordingHints.value = false
  }

  return {
    darkMode,
    autoLockMinutes,
    lastCompaniesUpdate,
    showRecordingHints,
    toggleDarkMode,
    setAutoLockMinutes,
    updateLastCompaniesUpdate,
    hideRecordingHints
  }
})
