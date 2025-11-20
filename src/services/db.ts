import Dexie, { Table } from 'dexie'
import type { VoiceNote, Company, UserCredentials, WebAuthnCredential } from '@/types'

export class AppDatabase extends Dexie {
  voiceNotes!: Table<VoiceNote>
  companies!: Table<Company>
  userCredentials!: Table<UserCredentials>
  webAuthnCredentials!: Table<WebAuthnCredential>

  constructor() {
    super('StudiumPlusPartnerNotes')

    this.version(1).stores({
      voiceNotes: 'id, status, recordedAt, selectedCompanyId',
      companies: 'id, name, shortName',
      userCredentials: 'id',
      webAuthnCredentials: 'id, credentialId'
    })
  }
}

export const db = new AppDatabase()

// Voice Notes operations
export const voiceNotesDB = {
  async getAll(): Promise<VoiceNote[]> {
    return await db.voiceNotes.orderBy('recordedAt').reverse().toArray()
  },

  async getById(id: string): Promise<VoiceNote | undefined> {
    return await db.voiceNotes.get(id)
  },

  async getByStatus(status: string): Promise<VoiceNote[]> {
    return await db.voiceNotes.where('status').equals(status).toArray()
  },

  async add(note: VoiceNote): Promise<string> {
    return await db.voiceNotes.add(note) as string
  },

  async update(id: string, changes: Partial<VoiceNote>): Promise<number> {
    return await db.voiceNotes.update(id, changes)
  },

  async delete(id: string): Promise<void> {
    await db.voiceNotes.delete(id)
  },

  async deleteAll(): Promise<void> {
    await db.voiceNotes.clear()
  }
}

// Companies operations
export const companiesDB = {
  async getAll(): Promise<Company[]> {
    return await db.companies.toArray()
  },

  async getById(id: string): Promise<Company | undefined> {
    return await db.companies.get(id)
  },

  async setAll(companies: Company[]): Promise<void> {
    await db.companies.clear()
    await db.companies.bulkAdd(companies)
  },

  async search(query: string): Promise<Company[]> {
    const lowerQuery = query.toLowerCase()
    const all = await db.companies.toArray()
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.shortName.toLowerCase().includes(lowerQuery) ||
        c.aliases.some((a) => a.toLowerCase().includes(lowerQuery))
    )
  }
}

// User Credentials operations
export const userCredentialsDB = {
  async get(): Promise<UserCredentials | undefined> {
    const all = await db.userCredentials.toArray()
    return all[0]
  },

  async set(credentials: UserCredentials): Promise<void> {
    await db.userCredentials.clear()
    await db.userCredentials.add(credentials)
  },

  async update(changes: Partial<UserCredentials>): Promise<void> {
    const existing = await this.get()
    if (existing) {
      await db.userCredentials.update(existing.id, {
        ...changes,
        updatedAt: new Date()
      })
    }
  },

  async delete(): Promise<void> {
    await db.userCredentials.clear()
  },

  async exists(): Promise<boolean> {
    const count = await db.userCredentials.count()
    return count > 0
  }
}

// WebAuthn Credentials operations
export const webAuthnCredentialsDB = {
  async getAll(): Promise<WebAuthnCredential[]> {
    return await db.webAuthnCredentials.toArray()
  },

  async add(credential: WebAuthnCredential): Promise<string> {
    return await db.webAuthnCredentials.add(credential) as string
  },

  async getByCredentialId(credentialId: string): Promise<WebAuthnCredential | undefined> {
    return await db.webAuthnCredentials.where('credentialId').equals(credentialId).first()
  },

  async updateCounter(id: string, counter: number): Promise<void> {
    await db.webAuthnCredentials.update(id, { counter })
  },

  async delete(id: string): Promise<void> {
    await db.webAuthnCredentials.delete(id)
  },

  async deleteAll(): Promise<void> {
    await db.webAuthnCredentials.clear()
  }
}

// Clear all data
export const clearAllData = async (): Promise<void> => {
  await db.voiceNotes.clear()
  await db.companies.clear()
  await db.userCredentials.clear()
  await db.webAuthnCredentials.clear()
}
