import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { UserConfig, User } from '../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const USERS_FILE_PATH = join(__dirname, '../../users.json')

/**
 * Loads users from users.json file
 */
export const loadUsers = async (): Promise<User[]> => {
  try {
    const fileContent = await readFile(USERS_FILE_PATH, 'utf-8')
    const config: UserConfig = JSON.parse(fileContent)

    // Convert string dates to Date objects
    return config.users.map(user => ({
      ...user,
      createdAt: new Date(user.createdAt)
    }))
  } catch (error) {
    console.error('Failed to load users.json:', error)
    throw new Error('User configuration file not found or invalid')
  }
}

/**
 * Finds a user by userName
 */
export const findUserByUserName = async (userName: string): Promise<User | null> => {
  const users = await loadUsers()
  return users.find(u => u.userName === userName) || null
}

/**
 * Finds a user by ID
 */
export const findUserById = async (id: string): Promise<User | null> => {
  const users = await loadUsers()
  return users.find(u => u.id === id) || null
}
