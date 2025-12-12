#!/usr/bin/env node

/**
 * Script to generate bcrypt password hashes for users.json
 * Usage: npm run generate-hash <password>
 */

import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

const generateHash = async (password: string) => {
  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  console.log('\n=================================')
  console.log('Password Hash Generator')
  console.log('=================================\n')
  console.log('Password:', password)
  console.log('Hash:', hash)
  console.log('\nCopy this hash to users.json')
  console.log('=================================\n')
}

const password = process.argv[2]

if (!password) {
  console.error('Error: Please provide a password')
  console.log('Usage: npm run generate-hash <password>')
  process.exit(1)
}

generateHash(password).catch(console.error)
