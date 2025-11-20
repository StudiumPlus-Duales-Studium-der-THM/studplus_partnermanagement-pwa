import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { companiesDB } from '@/services/db'
import { fetchCompanies } from '@/services/github.service'
import { useSettingsStore } from './settings'
import type { Company, Contact } from '@/types'

export const useCompaniesStore = defineStore('companies', () => {
  const companies = ref<Company[]>([])
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)

  // Computed
  const companyCount = computed(() => companies.value.length)

  const companyNames = computed(() =>
    companies.value.map((c) => ({ id: c.id, name: c.name, shortName: c.shortName }))
  )

  // Load companies from IndexedDB
  const loadFromCache = async () => {
    try {
      companies.value = await companiesDB.getAll()
    } catch (error) {
      console.error('Failed to load companies from cache:', error)
    }
  }

  // Fetch companies from GitHub and update cache
  const fetchFromGitHub = async (githubToken: string): Promise<boolean> => {
    isLoading.value = true
    lastError.value = null

    try {
      const data = await fetchCompanies(githubToken)
      companies.value = data.companies

      // Save to IndexedDB
      await companiesDB.setAll(data.companies)

      // Update last update time
      const settingsStore = useSettingsStore()
      settingsStore.updateLastCompaniesUpdate()

      return true
    } catch (error: unknown) {
      console.error('Failed to fetch companies:', error)
      lastError.value = error instanceof Error ? error.message : 'Fehler beim Laden der Unternehmen'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Initialize: load from cache, then try to update from GitHub
  const initialize = async (githubToken: string) => {
    // First load from cache
    await loadFromCache()

    // Then try to update from GitHub if online
    if (navigator.onLine) {
      await fetchFromGitHub(githubToken)
    }
  }

  // Get company by ID
  const getCompanyById = (id: string): Company | undefined => {
    return companies.value.find((c) => c.id === id)
  }

  // Get contact by ID within a company
  const getContactById = (companyId: string, contactId: string): Contact | undefined => {
    const company = getCompanyById(companyId)
    return company?.contacts.find((c) => c.id === contactId)
  }

  // Get all contacts for a company
  const getContactsByCompanyId = (companyId: string): Contact[] => {
    const company = getCompanyById(companyId)
    return company?.contacts || []
  }

  // Get primary contact for a company
  const getPrimaryContact = (companyId: string): Contact | undefined => {
    const contacts = getContactsByCompanyId(companyId)
    return contacts.find((c) => c.isPrimaryContact) || contacts[0]
  }

  // Search companies
  const searchCompanies = (query: string): Company[] => {
    if (!query.trim()) {
      return companies.value
    }

    const lowerQuery = query.toLowerCase()
    return companies.value.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.shortName.toLowerCase().includes(lowerQuery) ||
        c.aliases.some((a) => a.toLowerCase().includes(lowerQuery)) ||
        c.location.toLowerCase().includes(lowerQuery)
    )
  }

  // Get companies as JSON string (for AI matching)
  const getCompaniesJson = (): string => {
    const simplified = companies.value.map((c) => ({
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      aliases: c.aliases,
      location: c.location
    }))
    return JSON.stringify(simplified, null, 2)
  }

  // Format contact name
  const formatContactName = (contact: Contact): string => {
    return `${contact.firstName} ${contact.lastName}`
  }

  // Format contact with role
  const formatContactWithRole = (contact: Contact): string => {
    return `${contact.firstName} ${contact.lastName} (${contact.role})`
  }

  return {
    companies,
    isLoading,
    lastError,
    companyCount,
    companyNames,
    loadFromCache,
    fetchFromGitHub,
    initialize,
    getCompanyById,
    getContactById,
    getContactsByCompanyId,
    getPrimaryContact,
    searchCompanies,
    getCompaniesJson,
    formatContactName,
    formatContactWithRole
  }
})
