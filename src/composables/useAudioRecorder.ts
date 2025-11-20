import { ref, computed, onUnmounted } from 'vue'

export function useAudioRecorder() {
  const mediaRecorder = ref<MediaRecorder | null>(null)
  const audioChunks = ref<Blob[]>([])
  const audioStream = ref<MediaStream | null>(null)
  const isRecording = ref(false)
  const isPaused = ref(false)
  const recordingTime = ref(0)
  const audioBlob = ref<Blob | null>(null)
  const audioBlobUrl = ref<string | null>(null)
  const error = ref<string | null>(null)

  let timerInterval: number | null = null

  // Formatted time as MM:SS
  const formattedTime = computed(() => {
    const minutes = Math.floor(recordingTime.value / 60)
    const seconds = recordingTime.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  // Check if MediaRecorder is supported
  const isSupported = computed(() => {
    return 'mediaDevices' in navigator && 'MediaRecorder' in window
  })

  // Get supported MIME type
  const getSupportedMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return 'audio/webm'
  }

  // Start recording
  const startRecording = async (): Promise<boolean> => {
    try {
      error.value = null
      audioChunks.value = []

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      })

      audioStream.value = stream

      // Create MediaRecorder
      const mimeType = getSupportedMimeType()
      const recorder = new MediaRecorder(stream, { mimeType })

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.value.push(event.data)
        }
      }

      recorder.onstop = () => {
        // Create blob from chunks
        const mimeType = getSupportedMimeType()
        const blob = new Blob(audioChunks.value, { type: mimeType })
        audioBlob.value = blob

        // Create URL for playback
        if (audioBlobUrl.value) {
          URL.revokeObjectURL(audioBlobUrl.value)
        }
        audioBlobUrl.value = URL.createObjectURL(blob)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
        audioStream.value = null
      }

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        error.value = 'Aufnahmefehler aufgetreten'
      }

      mediaRecorder.value = recorder
      recorder.start(1000) // Collect data every second
      isRecording.value = true
      isPaused.value = false
      recordingTime.value = 0

      // Start timer
      timerInterval = window.setInterval(() => {
        if (!isPaused.value) {
          recordingTime.value++
        }
      }, 1000)

      return true
    } catch (err) {
      console.error('Failed to start recording:', err)

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          error.value = 'Mikrofon-Zugriff wurde verweigert'
        } else if (err.name === 'NotFoundError') {
          error.value = 'Kein Mikrofon gefunden'
        } else {
          error.value = 'Aufnahme konnte nicht gestartet werden'
        }
      }

      return false
    }
  }

  // Stop recording
  const stopRecording = (): void => {
    if (mediaRecorder.value && isRecording.value) {
      mediaRecorder.value.stop()
      isRecording.value = false
      isPaused.value = false

      if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
      }
    }
  }

  // Pause recording
  const pauseRecording = (): void => {
    if (mediaRecorder.value && isRecording.value && !isPaused.value) {
      mediaRecorder.value.pause()
      isPaused.value = true
    }
  }

  // Resume recording
  const resumeRecording = (): void => {
    if (mediaRecorder.value && isRecording.value && isPaused.value) {
      mediaRecorder.value.resume()
      isPaused.value = false
    }
  }

  // Cancel recording
  const cancelRecording = (): void => {
    stopRecording()
    audioChunks.value = []
    audioBlob.value = null

    if (audioBlobUrl.value) {
      URL.revokeObjectURL(audioBlobUrl.value)
      audioBlobUrl.value = null
    }

    recordingTime.value = 0
    error.value = null
  }

  // Reset for new recording
  const reset = (): void => {
    cancelRecording()
    mediaRecorder.value = null
  }

  // Get audio analyser for visualization
  const getAnalyser = (): AnalyserNode | null => {
    if (!audioStream.value) return null

    try {
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(audioStream.value)
      const analyser = audioContext.createAnalyser()

      analyser.fftSize = 256
      source.connect(analyser)

      return analyser
    } catch {
      return null
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    cancelRecording()
    if (audioStream.value) {
      audioStream.value.getTracks().forEach((track) => track.stop())
    }
  })

  return {
    isRecording,
    isPaused,
    recordingTime,
    formattedTime,
    audioBlob,
    audioBlobUrl,
    audioStream,
    error,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    reset,
    getAnalyser
  }
}
