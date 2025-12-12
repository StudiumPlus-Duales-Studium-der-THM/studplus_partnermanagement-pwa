import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/recording/:noteId?',
      name: 'recording',
      component: () => import('@/views/RecordingView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/preview/:id',
      name: 'preview',
      component: () => import('@/views/PreviewView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Track if auth store is initialized
let authInitialized = false

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Initialize auth store only once (load token from localStorage)
  if (!authInitialized) {
    await authStore.init()
    authInitialized = true
  }

  // Check authentication for protected routes
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'auth' })
    return
  }

  // Already authenticated, redirect from auth page
  if (authStore.isAuthenticated && to.name === 'auth') {
    next({ name: 'home' })
    return
  }

  // Update activity on navigation
  if (authStore.isAuthenticated) {
    authStore.updateActivity()
  }

  next()
})

export default router
