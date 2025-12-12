import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config/env.js'
import authRoutes from './routes/auth.js'
import githubRoutes from './routes/github.js'
import neleRoutes from './routes/nele.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

// Security middleware
app.use(helmet())

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        return callback(null, true)
      }

      // In development, allow both HTTP and HTTPS localhost
      if (config.nodeEnv === 'development') {
        const allowedOrigins = [
          'http://localhost:5173',
          'https://localhost:5173',
          'http://127.0.0.1:5173',
          'https://127.0.0.1:5173',
          'http://192.168.178.90:5173/',
          'https://192.168.178.90:5173/'
        ]

        if (allowedOrigins.includes(origin)) {
          return callback(null, true)
        }
      }

      // In production, check against configured frontend URL
      if (origin === config.frontendUrl) {
        return callback(null, true)
      }

      // Reject
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true
  })
)

// Body parsing middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/github', githubRoutes)
app.use('/api/nele', neleRoutes)

// Error handling middleware (must be last)
app.use(errorHandler)

// Start server
const PORT = config.port

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📝 Environment: ${config.nodeEnv}`)

  if (config.nodeEnv === 'development') {
    console.log(`🌐 CORS enabled for: http(s)://localhost:5173, http(s)://127.0.0.1:5173`)
  } else {
    console.log(`🌐 CORS enabled for: ${config.frontendUrl}`)
  }
})
