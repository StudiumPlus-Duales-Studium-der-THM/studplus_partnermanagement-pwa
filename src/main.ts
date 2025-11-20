import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

import '@mdi/font/css/materialdesignicons.css'
import './assets/styles/main.scss'

const app = createApp(App)

// Global error handler
app.config.errorHandler = (err, _instance, info) => {
  console.error('Global error:', err, info)
  // Optional: Sentry.captureException(err)
}

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New content available, please refresh.')
          }
        })
      })
    } catch (err) {
      console.error('Service Worker registration failed:', err)
    }
  })
}
