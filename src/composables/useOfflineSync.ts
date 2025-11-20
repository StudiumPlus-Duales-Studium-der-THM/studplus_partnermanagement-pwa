import { ref, onMounted, onUnmounted } from 'vue'
import { useVoiceNotesStore } from '@/stores/voiceNotes'
import { useNotificationStore } from '@/stores/notification'
import { useProcessing } from './useProcessing'
import { NoteStatus } from '@/types'

export function useOfflineSync() {
  const voiceNotesStore = useVoiceNotesStore()
  const notificationStore = useNotificationStore()
  const { processNote, sendToGitHub } = useProcessing()

  const isSyncing = ref(false)
  const pendingCount = ref(0)

  let syncInterval: number | null = null

  /**
   * Sync pending notes when online
   */
  const syncPendingNotes = async () => {
    if (isSyncing.value || !navigator.onLine) return

    const pendingNotes = voiceNotesStore.pendingNotes
    if (pendingNotes.length === 0) return

    isSyncing.value = true
    pendingCount.value = pendingNotes.length

    try {
      for (const note of pendingNotes) {
        // Skip if no longer pending
        const current = await voiceNotesStore.getNoteById(note.id)
        if (!current || current.status !== NoteStatus.RECORDED) continue

        // Process the note
        const processed = await processNote(note.id)

        if (processed) {
          // If processed has company selected, try to send
          const updated = await voiceNotesStore.getNoteById(note.id)
          if (updated?.selectedCompanyId && updated.status === NoteStatus.PROCESSED) {
            await sendToGitHub(note.id)
          }
        }

        pendingCount.value--
      }

      if (pendingNotes.length > 0) {
        notificationStore.success('Ausstehende Notizen synchronisiert')
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      isSyncing.value = false
      pendingCount.value = 0
    }
  }

  /**
   * Handle online event
   */
  const handleOnline = () => {
    notificationStore.info('Internetverbindung wiederhergestellt')
    syncPendingNotes()
  }

  /**
   * Handle offline event
   */
  const handleOffline = () => {
    notificationStore.warning('Keine Internetverbindung')
  }

  /**
   * Register background sync if supported
   */
  const registerBackgroundSync = async () => {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-voice-notes')
        console.log('Background sync registered')
      } catch (error) {
        console.warn('Background sync not available:', error)
      }
    }
  }

  /**
   * Start periodic sync check
   */
  const startPeriodicSync = () => {
    // Check every 5 minutes
    syncInterval = window.setInterval(() => {
      if (navigator.onLine) {
        syncPendingNotes()
      }
    }, 5 * 60 * 1000)
  }

  /**
   * Stop periodic sync
   */
  const stopPeriodicSync = () => {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial sync if online
    if (navigator.onLine) {
      syncPendingNotes()
    }

    // Register background sync
    registerBackgroundSync()

    // Start periodic sync
    startPeriodicSync()
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    stopPeriodicSync()
  })

  return {
    isSyncing,
    pendingCount,
    syncPendingNotes
  }
}
