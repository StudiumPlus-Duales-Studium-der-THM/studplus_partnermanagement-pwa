import axios from 'axios'
import type {
  NeleAITranscriptionResponse,
  NeleAIChatRequest,
  NeleAIChatSyncResponse,
  CompanyMatchResult,
  ProcessedTextResponse
} from '@/types'

const NELE_AI_API_BASE = 'https://api.aieva.io/api:v1'

/**
 * Transcribes audio using nele.ai transcription API
 */
export const transcribeAudio = async (
  audioBlob: Blob,
  apiKey: string
): Promise<string> => {
  const formData = new FormData()

  // Get transcription model from environment variable
  const transcriptionModel = import.meta.env.VITE_NELE_AI_TRANSCRIPTION_MODEL || 'azure-whisper'

  // Convert to mp3 file (use audio/mpeg as MIME type)
  const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' })

  formData.append('file', audioFile)
  formData.append('model', transcriptionModel)
  formData.append('language', 'de')

  const response = await axios.post<NeleAITranscriptionResponse>(
    `${NELE_AI_API_BASE}/transcription`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`
        // Don't set Content-Type manually - let axios set it with correct boundary
      }
    }
  )

  return response.data.text
}

/**
 * Matches a company from the transcription using nele.ai chat API
 * Note: Only sends matching-relevant fields to reduce token usage.
 * Contacts and other detailed data are excluded as they're not relevant for company identification.
 */
export const matchCompany = async (
  transcription: string,
  companiesJson: string,
  apiKey: string
): Promise<CompanyMatchResult> => {
  // Parse and extract only matching-relevant fields to reduce token usage
  const companies = JSON.parse(companiesJson)
  const compactCompanies = companies.companies?.map((c: any) => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    aliases: c.aliases || [],
    location: c.location
  })) || []

  const compactJson = JSON.stringify(compactCompanies, null, 2)

  const prompt = `Du bist ein Assistent für StudiumPlus. Analysiere folgende Gesprächsnotiz und identifiziere das erwähnte Partnerunternehmen aus der Liste.

Gesprächsnotiz:
"""
${transcription}
"""

Verfügbare Unternehmen (JSON):
"""
${compactJson}
"""

WICHTIG: Suche nach Namen, Alias, Standort oder Hinweisen im Text. Antworte NUR mit gültigem JSON in diesem Format:
{
  "matched_company_id": "string oder null",
  "confidence": "high/medium/low",
  "reasoning": "kurze Begründung"
}

Antworte AUSSCHLIESSLICH mit dem JSON-Objekt, kein zusätzlicher Text.`

  // Get chat model from environment variable
  const chatModel = import.meta.env.VITE_NELE_AI_CHAT_MODEL_COMPANY_MATCHING || 'gpt-4o-mini'

  const request: NeleAIChatRequest = {
    model: chatModel,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 200
  }

  const response = await axios.post<NeleAIChatSyncResponse>(
    `${NELE_AI_API_BASE}/chat-completion-sync`,
    request,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  )

  const content = response.data.content
  return JSON.parse(content) as CompanyMatchResult
}

/**
 * Processes and enhances the transcribed text using nele.ai chat API
 * Also extracts conversation date and includes metadata section
 */
export const processText = async (
  transcription: string,
  companyName: string,
  contactName: string,
  userName: string,
  apiKey: string
): Promise<ProcessedTextResponse> => {
  const prompt = `Du bist ein Assistent für StudiumPlus und hilfst, Gesprächsnotizen professionell aufzubereiten.

Eingaben:
- Unternehmen: ${companyName}
- Ansprechpartner: ${contactName}
- Direktor/in: ${userName}
- Rohe Gesprächsnotiz: """${transcription}"""

Aufgabe:
1. GESPRÄCHSDATUM ERMITTELN: Suche nach dem Datum, an dem das Gespräch stattfand (NICHT Termine/Deadlines)
2. NOTIZ STRUKTURIEREN: Bereite die Gesprächsnotiz professionell auf

WICHTIGE REGELN:
1. INHALTLICHE TREUE: Verändere KEINE inhaltlichen Aussagen. Bewahre die Originalaussagen.
2. MINIMALE KORREKTUR: Korrigiere NUR offensichtliche Grammatik- und Rechtschreibfehler.
3. KEINE INTERPRETATIONEN: Füge keine eigenen Interpretationen oder Bewertungen hinzu.
4. KEINE ERFINDUNGEN: Erfinde keine Details, die nicht in der Notiz erwähnt wurden.
5. DEADLINE-ERKENNUNG: Identifiziere und extrahiere alle Termine, Fristen und Deadlines explizit.
6. STRUKTURIERUNG: Gliedere den Inhalt in die vorgegebenen Abschnitte, ohne die Aussagen zu verändern.
7. DATUMFORMAT: Wandle Datumsangaben in das Format TT.MM.JJJJ um.
8. ORIGINALWORTLAUT: Verwende möglichst den Originalwortlaut, nur mit Grammatikkorrekturen.

Sprachliche Korrekturen (nur diese sind erlaubt):
- Ergänze fehlende Artikel (der/die/das/ein/eine)
- Ergänze fehlende Präpositionen (zu/von/mit/bei/über)
- Korrigiere Verb-Konjugationen
- Vervollständige unvollständige Sätze minimal

Antworte AUSSCHLIESSLICH mit folgendem JSON-Format (kein zusätzlicher Text!):
{
  "conversationDate": "TT.MM.JJJJ oder leer falls nicht erwähnt",
  "processedText": "## Unternehmen\\n- Name: ${companyName}\\n- Ansprechpartner: ${contactName}\\n\\n## Datum & Teilnehmer\\n- Gesprächsdatum: [Datum oder 'Nicht angegeben']\\n- Direktor/in: ${userName}\\n\\n## Gesprächsnotizen\\n[Hauptinhalt]\\n\\n## Vereinbarungen\\n[Vereinbarungen]\\n\\n## Deadlines & Termine\\n[Termine]\\n\\n## Nächste Schritte\\n[Schritte]"
}

WICHTIG für conversationDate:
- Suche nach "am [Datum]", "das Gespräch fand am", "wir trafen uns am" etc.
- NICHT Termine/Deadlines (die kommen in den Text)
- Wenn nicht erwähnt: leerer String ""`

  // Get chat model from environment variable
  const chatModel = import.meta.env.VITE_NELE_AI_CHAT_MODEL_TEXT_PROCESSING || 'gpt-4o-mini'

  const request: NeleAIChatRequest = {
    model: chatModel,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 1600
  }

  const response = await axios.post<NeleAIChatSyncResponse>(
    `${NELE_AI_API_BASE}/chat-completion-sync`,
    request,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  )

  const content = response.data.content.trim()

  // Parse JSON response
  const parsed = JSON.parse(content) as ProcessedTextResponse

  return parsed
}
