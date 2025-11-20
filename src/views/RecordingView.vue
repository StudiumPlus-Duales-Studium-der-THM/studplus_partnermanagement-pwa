<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <img
        src="/studium-plus-logo.png"
        alt="Studium Plus"
        style="height: 24px; filter: brightness(0) invert(1);"
        class="mr-2 ml-4"
      />
      <v-app-bar-title class="text-white font-weight-bold">Neue Gesprächsnotiz</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container>
        <!-- Recording hints -->
        <v-expansion-panels v-model="showHints" class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon color="accent" class="mr-1">mdi-lightbulb</v-icon>
              Hinweise für Ihre Sprachnotiz
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="mb-2">Bitte in Ihrer Sprachnotiz eingehen auf:</p>
              <ul class="ml-4">
                <li v-for="hint in RECORDING_HINTS" :key="hint">{{ hint }}</li>
              </ul>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Recording area -->
        <v-card class="text-center pa-8">
          <!-- Not recording state -->
          <template v-if="!isRecording && !audioBlob">
            <v-btn
              size="x-large"
              color="error"
              icon
              class="recording-btn mb-4"
              @click="startRecording"
              :disabled="!isSupported"
            >
              <v-icon size="40">mdi-microphone</v-icon>
            </v-btn>
            <div class="text-h6">Aufnahme starten</div>
            <div class="text-caption text-grey">
              Tippen Sie auf das Mikrofon
            </div>

            <v-alert
              v-if="!isSupported"
              type="error"
              variant="tonal"
              class="mt-4"
            >
              Ihr Browser unterstützt keine Audioaufnahme
            </v-alert>

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mt-4"
            >
              {{ error }}
            </v-alert>
          </template>

          <!-- Recording state -->
          <template v-else-if="isRecording">
            <v-btn
              size="x-large"
              color="error"
              icon
              class="recording-btn recording-pulse mb-4"
              @click="stopRecording"
            >
              <v-icon size="40">mdi-stop</v-icon>
            </v-btn>

            <div class="timer-display mb-4">{{ formattedTime }}</div>

            <!-- Waveform visualization -->
            <canvas
              ref="waveformCanvas"
              class="waveform-canvas mb-4"
              width="300"
              height="100"
            ></canvas>

            <div class="text-caption text-grey">
              Tippen Sie auf Stopp, wenn Sie fertig sind
            </div>
          </template>

          <!-- After recording state -->
          <template v-else-if="audioBlob">
            <v-icon size="60" color="success" class="mb-4">
              mdi-check-circle
            </v-icon>

            <div class="text-h6 mb-2">Aufnahme abgeschlossen</div>
            <div class="text-body-2 text-grey mb-4">
              Dauer: {{ formattedTime }}
            </div>

            <!-- Audio playback -->
            <audio
              v-if="audioBlobUrl"
              :src="audioBlobUrl"
              controls
              class="mb-4"
              style="width: 100%"
            ></audio>

            <v-row>
              <v-col>
                <v-btn
                  block
                  color="primary"
                  :loading="isProcessing"
                  @click="processRecording"
                >
                  <v-icon start>mdi-cog</v-icon>
                  Verarbeiten
                </v-btn>
              </v-col>
            </v-row>

            <v-row class="mt-2">
              <v-col cols="6">
                <v-btn
                  block
                  variant="outlined"
                  @click="retakeRecording"
                >
                  <v-icon start>mdi-refresh</v-icon>
                  Neu
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                  block
                  variant="outlined"
                  color="error"
                  @click="deleteRecording"
                >
                  <v-icon start>mdi-delete</v-icon>
                  Löschen
                </v-btn>
              </v-col>
            </v-row>

            <!-- Processing status -->
            <v-alert
              v-if="processingStep"
              type="info"
              variant="tonal"
              class="mt-4"
            >
              {{ processingStep }}
            </v-alert>

            <v-alert
              v-if="processingError"
              type="error"
              variant="tonal"
              class="mt-4"
            >
              {{ processingError }}
            </v-alert>
          </template>
        </v-card>

        <!-- Offline warning -->
        <v-alert
          v-if="!isOnline"
          type="warning"
          variant="tonal"
          class="mt-4"
        >
          <div class="font-weight-medium">Keine Internetverbindung</div>
          <div class="text-caption">
            Aufnahmen werden gespeichert und später verarbeitet.
          </div>
        </v-alert>
      </v-container>
    </v-main>

    <!-- Bottom Navigation -->
    <v-bottom-navigation grow>
      <v-btn value="home" to="/">
        <v-icon>mdi-home</v-icon>
        <span>Start</span>
      </v-btn>
      <v-btn value="recording" to="/recording">
        <v-icon>mdi-microphone</v-icon>
        <span>Aufnahme</span>
      </v-btn>
      <v-btn value="history" to="/history">
        <v-icon>mdi-history</v-icon>
        <span>Historie</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useAudioRecorder } from '@/composables/useAudioRecorder'
import { useProcessing } from '@/composables/useProcessing'
import { useVoiceNotesStore } from '@/stores/voiceNotes'
import { useSettingsStore } from '@/stores/settings'
import { useNotificationStore } from '@/stores/notification'
import { RECORDING_HINTS } from '@/utils/constants'

const router = useRouter()
const route = useRoute()
const voiceNotesStore = useVoiceNotesStore()
const settingsStore = useSettingsStore()
const notificationStore = useNotificationStore()

const {
  isRecording,
  formattedTime,
  audioBlob,
  audioBlobUrl,
  audioStream,
  error,
  isSupported,
  startRecording: start,
  stopRecording: stop,
  cancelRecording: _cancelRecording,
  reset
} = useAudioRecorder()

const {
  isProcessing,
  processingStep,
  error: processingError,
  processNote
} = useProcessing()

const showHints = ref(settingsStore.showRecordingHints ? 0 : undefined)
const isOnline = ref(navigator.onLine)
const waveformCanvas = ref<HTMLCanvasElement | null>(null)
const isSaved = ref(false) // Track if recording has been saved
const loadedNoteId = ref<string | null>(null) // Track loaded note ID
let animationId: number | null = null

// Online/offline status
const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

onMounted(async () => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)

  // Check if we're loading an existing recording
  const noteId = route.params.noteId as string | undefined
  if (noteId) {
    try {
      console.log('1. Starting to load note:', noteId)
      const note = await voiceNotesStore.getNoteById(noteId)
      console.log('2. Note retrieved from store:', note)

      if (!note) {
        console.error('Note not found:', noteId)
        notificationStore.error('Aufnahme nicht gefunden')
        return
      }

      if (!note.audioBlob) {
        console.error('Note has no audioBlob:', noteId)
        notificationStore.error('Aufnahme hat keine Audio-Daten')
        return
      }

      console.log('3. Setting audioBlob...')
      audioBlob.value = note.audioBlob
      console.log('4. Creating blob URL...')
      audioBlobUrl.value = URL.createObjectURL(note.audioBlob)
      console.log('5. Setting flags...')
      isSaved.value = true
      loadedNoteId.value = noteId
      recordingTime.value = Math.floor((note.audioBlob.size / 16000) / 2)

      console.log('6. Recording loaded successfully')
    } catch (error) {
      console.error('Failed to load note at step:', error)
      // Only show error if audioBlob wasn't set successfully
      if (!audioBlob.value) {
        notificationStore.error('Aufnahme konnte nicht geladen werden')
      }
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

// Save recording before leaving the route
onBeforeRouteLeave(async (to, from, next) => {
  // If there's an audioBlob that hasn't been saved yet, save it automatically
  if (audioBlob.value && !isProcessing.value && !isSaved.value) {
    try {
      await voiceNotesStore.createNote(audioBlob.value)
      console.log('Unsaved recording automatically saved before leaving view')
      notificationStore.info('Aufnahme wurde automatisch gespeichert')
    } catch (error) {
      console.error('Failed to save recording before leaving view:', error)
      notificationStore.error('Fehler beim Speichern der Aufnahme')
    }
  }
  next()
})

// Waveform visualization
watch(isRecording, (recording) => {
  if (recording && audioStream.value && waveformCanvas.value) {
    drawWaveform()
  } else if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
})

const drawWaveform = () => {
  if (!audioStream.value || !waveformCanvas.value) return

  const audioContext = new AudioContext()
  const source = audioContext.createMediaStreamSource(audioStream.value)
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 256

  source.connect(analyser)

  const canvas = waveformCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const draw = () => {
    if (!isRecording.value) {
      audioContext.close()
      return
    }

    animationId = requestAnimationFrame(draw)
    analyser.getByteFrequencyData(dataArray)

    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const barWidth = (canvas.width / bufferLength) * 2.5
    let barHeight
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * canvas.height

      ctx.fillStyle = `rgb(25, 118, ${210 + barHeight})`
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

      x += barWidth + 1
    }
  }

  draw()
}

const startRecording = async () => {
  const success = await start()
  if (!success && error.value) {
    notificationStore.error(error.value)
  }
}

const stopRecording = () => {
  stop()
}

const retakeRecording = () => {
  reset()
  isSaved.value = false
  loadedNoteId.value = null
}

const deleteRecording = async () => {
  // Delete from store if it's a loaded note
  if (loadedNoteId.value) {
    await voiceNotesStore.deleteNote(loadedNoteId.value)
  }

  reset()
  isSaved.value = false
  loadedNoteId.value = null
  notificationStore.info('Aufnahme gelöscht')
}

const processRecording = async () => {
  if (!audioBlob.value) return

  let noteId = loadedNoteId.value

  if (!isOnline.value) {
    // Save for later processing if not already saved
    if (!noteId) {
      noteId = await voiceNotesStore.createNote(audioBlob.value)
      isSaved.value = true
      loadedNoteId.value = noteId
    }
    notificationStore.warning('Notiz gespeichert. Wird bei Internetverbindung verarbeitet.')
    router.push('/history')
    return
  }

  // Create note if it doesn't exist yet, otherwise use existing
  if (!noteId) {
    noteId = await voiceNotesStore.createNote(audioBlob.value)
    isSaved.value = true
    loadedNoteId.value = noteId
  }

  const success = await processNote(noteId)

  if (success) {
    router.push(`/preview/${noteId}`)
  }
}
</script>

<style scoped>
.recording-btn {
  width: 100px;
  height: 100px;
}

.waveform-canvas {
  border-radius: 8px;
  background: #f5f5f5;
}

audio {
  border-radius: 8px;
}
</style>
