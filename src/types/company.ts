export interface Contact {
  id: string
  firstName: string
  lastName: string
  role: string
  email: string
  phone: string
  isPrimaryContact: boolean
}

export interface Company {
  id: string
  name: string
  shortName: string
  aliases: string[]
  location: string
  partnershipType: string
  studyPrograms: string[]
  contacts: Contact[]
  notes: string
  lastContactDate: string
}

export interface CompaniesData {
  companies: Company[]
}

export interface CompanyMatchResult {
  matched_company_id: string | null
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}
