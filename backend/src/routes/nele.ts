import express, { Response } from 'express'
import axios from 'axios'
import multer from 'multer'
import { config } from '../config/env.js'
import { authenticateToken } from '../middleware/auth.js'
import {
  AuthRequest,
  TranscriptionResponse,
  ChatRequest,
  ChatResponse
} from '../types/index.js'

const router = express.Router()

const NELE_AI_API_BASE = 'https://api.aieva.io/api:v1'

// Configure multer for file uploads (memory storage for temporary handling)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
})

// Apply authentication middleware to all routes
router.use(authenticateToken)

/**
 * POST /api/nele/transcribe
 * Transcribe audio using nele.ai
 * Expects multipart/form-data with 'file' field
 */
router.post(
  '/transcribe',
  upload.single('file'),
  async (req: AuthRequest, res: Response<TranscriptionResponse | { error: string }>) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No audio file provided' })
        return
      }

      const formData = new FormData()

      // Create blob from buffer
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype })

      // Append file to form data
      formData.append('file', blob, req.file.originalname)
      formData.append('model', config.neleAi.transcriptionModel)
      formData.append('language', 'de')

      const response = await axios.post<{ text: string }>(
        `${NELE_AI_API_BASE}/transcription`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${config.neleAi.apiKey}`
          }
        }
      )

      console.log(`✓ Transcription completed for ${req.user?.userName}`)
      res.json({ text: response.data.text })
    } catch (error) {
      console.error('nele.ai transcription failed:', error)
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          error: error.response?.data?.message || 'Transcription failed'
        })
      } else {
        res.status(500).json({ error: 'Transcription failed' })
      }
    }
  }
)

/**
 * POST /api/nele/chat
 * Chat completion using nele.ai
 */
router.post(
  '/chat',
  async (req: AuthRequest, res: Response<ChatResponse | { error: string }>) => {
    try {
      const { messages, model } = req.body as ChatRequest

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Messages array is required' })
        return
      }

      // Use provided model or default from config
      const chatModel = model || config.neleAi.chatModelTextProcessing

      const response = await axios.post<{ content: string }>(
        `${NELE_AI_API_BASE}/chat-completion-sync`,
        {
          model: chatModel,
          messages,
          temperature: req.body.temperature || 0.3,
          max_tokens: req.body.max_tokens || 1600
        },
        {
          headers: {
            Authorization: `Bearer ${config.neleAi.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // Transform response to match expected format
      const chatResponse: ChatResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: response.data.content
            }
          }
        ]
      }

      console.log(`✓ Chat completion for ${req.user?.userName}`)
      res.json(chatResponse)
    } catch (error) {
      console.error('nele.ai chat failed:', error)
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          error: error.response?.data?.message || 'Chat completion failed'
        })
      } else {
        res.status(500).json({ error: 'Chat completion failed' })
      }
    }
  }
)

export default router
