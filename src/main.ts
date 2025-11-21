import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
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

// Service Worker registration via vite-plugin-pwa
// Auto-updates on new content
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, please refresh.')
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})
