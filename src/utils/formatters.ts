import { format, formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { NoteStatus } from '@/types'

/**
 * Format a date as dd.MM.yyyy
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd.MM.yyyy', { locale: de })
}

/**
 * Format a date with time
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd.MM.yyyy HH:mm', { locale: de })
}

/**
 * Format as relative time
 */
export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: de })
}

/**
 * Get status label
 */
export const getStatusLabel = (status: NoteStatus): string => {
  const labels: Record<NoteStatus, string> = {
    [NoteStatus.RECORDED]: 'Aufgenommen',
    [NoteStatus.TRANSCRIBING]: 'Transkribiert...',
    [NoteStatus.TRANSCRIBED]: 'Transkribiert',
    [NoteStatus.PROCESSING]: 'Wird verarbeitet...',
    [NoteStatus.PROCESSED]: 'Verarbeitet',
    [NoteStatus.SENDING]: 'Wird gesendet...',
    [NoteStatus.SENT]: 'Gesendet',
    [NoteStatus.ERROR]: 'Fehler'
  }
  return labels[status] || status
}

/**
 * Get status color for Vuetify
 */
export const getStatusColor = (status: NoteStatus): string => {
  const colors: Record<NoteStatus, string> = {
    [NoteStatus.RECORDED]: 'orange',
    [NoteStatus.TRANSCRIBING]: 'blue-lighten-1',
    [NoteStatus.TRANSCRIBED]: 'blue',
    [NoteStatus.PROCESSING]: 'purple-lighten-1',
    [NoteStatus.PROCESSED]: 'purple',
    [NoteStatus.SENDING]: 'green-lighten-1',
    [NoteStatus.SENT]: 'green',
    [NoteStatus.ERROR]: 'red'
  }
  return colors[status] || 'grey'
}

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format duration in seconds to MM:SS
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
