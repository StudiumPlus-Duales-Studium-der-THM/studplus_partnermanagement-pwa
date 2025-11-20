import CryptoJS from 'crypto-js'

const PBKDF2_ITERATIONS = 100000
const KEY_SIZE = 256 / 32

/**
 * Derives a key from a password using PBKDF2
 */
export const deriveKey = (password: string, salt: string): string => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: KEY_SIZE,
    iterations: PBKDF2_ITERATIONS
  }).toString()
}

/**
 * Generates a random salt
 */
export const generateSalt = (): string => {
  return CryptoJS.lib.WordArray.random(128 / 8).toString()
}

/**
 * Hashes a password with salt using PBKDF2
 */
export const hashPassword = (password: string, salt: string): string => {
  return deriveKey(password, salt)
}

/**
 * Verifies a password against a hash
 */
export const verifyPassword = (password: string, salt: string, hash: string): boolean => {
  const computedHash = hashPassword(password, salt)
  return computedHash === hash
}

/**
 * Encrypts data using AES-256
 */
export const encrypt = (data: string, key: string): string => {
  return CryptoJS.AES.encrypt(data, key).toString()
}

/**
 * Decrypts data using AES-256
 */
export const decrypt = (encryptedData: string, key: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

/**
 * Generates a random session token
 */
export const generateSessionToken = (): string => {
  return CryptoJS.lib.WordArray.random(256 / 8).toString()
}

/**
 * Encrypts sensitive data for storage
 */
export const encryptForStorage = (data: string, password: string, salt: string): string => {
  const key = deriveKey(password, salt)
  return encrypt(data, key)
}

/**
 * Decrypts data from storage
 */
export const decryptFromStorage = (encryptedData: string, password: string, salt: string): string => {
  const key = deriveKey(password, salt)
  return decrypt(encryptedData, key)
}
