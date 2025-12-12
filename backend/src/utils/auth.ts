import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { JWTPayload } from '../types/index.js'

const SALT_ROUNDS = 10

/**
 * Hashes a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verifies a password against a hash
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

/**
 * Generates a JWT token for a user
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  })
}

/**
 * Verifies and decodes a JWT token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret) as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}
