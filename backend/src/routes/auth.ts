import express, { Request, Response } from 'express'
import { findUserByUserName } from '../utils/users.js'
import { verifyPassword, generateToken } from '../utils/auth.js'
import { LoginRequest, LoginResponse } from '../types/index.js'

const router = express.Router()

/**
 * POST /api/auth/login
 * Login endpoint - validates credentials and returns JWT
 */
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response<LoginResponse>) => {
  try {
    const { userName, password } = req.body

    // Validate input
    if (!userName || !password) {
      res.status(400).json({
        success: false,
        message: 'Username and password are required'
      })
      return
    }

    // Find user
    const user = await findUserByUserName(userName)
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
      return
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
      return
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      userName: user.userName,
      displayName: user.displayName
    })

    res.json({
      success: true,
      token,
      displayName: user.displayName
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed'
    })
  }
})

export default router
