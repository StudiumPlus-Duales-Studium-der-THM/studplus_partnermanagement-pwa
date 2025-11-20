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
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/OnboardingView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/recording',
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

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Check if setup is complete
  await authStore.checkSetupStatus()

  if (!authStore.isSetupComplete && to.name !== 'onboarding') {
    next({ name: 'onboarding' })
    return
  }

  if (authStore.isSetupComplete && to.name === 'onboarding') {
    next({ name: 'auth' })
    return
  }

  // Check authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'auth' })
    return
  }

  // Already authenticated, redirect from auth page
  if (authStore.isAuthenticated && to.name === 'auth') {
    next({ name: 'home' })
    return
  }

  next()
})

export default router
