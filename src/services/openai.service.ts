import axios from 'axios'
import type {
  OpenAITranscriptionResponse,
  OpenAIChatRequest,
  OpenAIChatResponse,
  CompanyMatchResult
} from '@/types'

const OPENAI_API_BASE = 'https://api.openai.com/v1'

/**
 * Transcribes audio using OpenAI Whisper API
 */
export const transcribeAudio = async (
  audioBlob: Blob,
  apiKey: string
): Promise<string> => {
  const formData = new FormData()

  // Convert to mp3 file
  const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' })
  formData.append('file', audioFile)
  formData.append('model', 'whisper-1')
  formData.append('language', 'de')

  const response = await axios.post<OpenAITranscriptionResponse>(
    `${OPENAI_API_BASE}/audio/transcriptions`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'multipart/form-data'
      }
    }
  )

  return response.data.text
}

/**
 * Matches a company from the transcription
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

  const request: OpenAIChatRequest = {
    model: 'gpt-5-mini',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    // Note: GPT-5 only supports temperature=1 (default), custom values not allowed
    max_completion_tokens: 200
  }

  const response = await axios.post<OpenAIChatResponse>(
    `${OPENAI_API_BASE}/chat/completions`,
    request,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  )

  const content = response.data.choices[0].message.content

  // GPT-5 might add text before/after JSON, so we need to extract it
  try {
    // Try to parse directly first
    return JSON.parse(content) as CompanyMatchResult
  } catch (error) {
    // If direct parse fails, try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as CompanyMatchResult
    }

    // If no JSON found, throw with helpful error
    console.error('Company matching response:', content)
    throw new Error(`Failed to parse company matching response: ${content.substring(0, 200)}`)
  }
}

/**
 * Processes and enhances the transcribed text
 */
export const processText = async (
  transcription: string,
  companyName: string,
  contactName: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Du bist ein Assistent für StudiumPlus und hilfst, Gesprächsnotizen professionell aufzubereiten.

Eingaben:
- Unternehmen: ${companyName}
- Ansprechpartner: ${contactName}
- Rohe Gesprächsnotiz: """${transcription}"""

Aufgabe:
Strukturiere die Gesprächsnotiz in folgende Abschnitte und analysiere Deadlines/Termine.

WICHTIGE REGELN:
1. INHALTLICHE TREUE: Verändere KEINE inhaltlichen Aussagen. Bewahre die Originalaussagen.
2. MINIMALE KORREKTUR: Korrigiere NUR offensichtliche Grammatik- und Rechtschreibfehler.
3. KEINE INTERPRETATIONEN: Füge keine eigenen Interpretationen oder Bewertungen hinzu.
4. KEINE ERFINDUNGEN: Erfinde keine Details, die nicht in der Notiz erwähnt wurden.
5. GESPRÄCHSDATUM-ERKENNUNG: Suche EXPLIZIT nach dem Datum, an dem das Gespräch stattfand.
   - Achte auf Formulierungen wie: "Gespräch am...", "Telefonat vom...", "Meeting am...", "heute", "gestern", "letzte Woche"
   - Das Gesprächsdatum ist NICHT das Aufzeichnungsdatum!
   - Falls kein Datum erwähnt wird, schreibe "Nicht im Transkript erwähnt"
6. DEADLINE-ERKENNUNG: Identifiziere und extrahiere alle Termine, Fristen und Deadlines explizit.
7. STRUKTURIERUNG: Gliedere den Inhalt in die vorgegebenen Abschnitte, ohne die Aussagen zu verändern.
8. DATUMFORMAT: Wandle alle Datumsangaben in das Format TT.MM.JJJJ um.
9. ORIGINALWORTLAUT: Verwende möglichst den Originalwortlaut, nur mit Grammatikkorrekturen.

Sprachliche Korrekturen (nur diese sind erlaubt):
- Ergänze fehlende Artikel (der/die/das/ein/eine)
- Ergänze fehlende Präpositionen (zu/von/mit/bei/über)
- Korrigiere Verb-Konjugationen
- Vervollständige unvollständige Sätze minimal

Antworte im Format:
## Gesprächsdatum
[Datum im Format TT.MM.JJJJ, oder "Nicht im Transkript erwähnt"]

## Gesprächsnotizen
[Hauptinhalt mit minimalsten Korrekturen, originalgetreu]

## Vereinbarungen
[Liste der Vereinbarungen, oder "Keine expliziten Vereinbarungen getroffen."]

## Deadlines & Termine
[Alle erwähnten Termine/Fristen mit Datum im Format TT.MM.JJJJ, oder "Keine Termine genannt."]

## Nächste Schritte
[Liste der nächsten Schritte, oder "Keine konkreten nächsten Schritte festgelegt."]`

  const request: OpenAIChatRequest = {
    model: 'gpt-5-mini',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    // Note: GPT-5 only supports temperature=1 (default), custom values not allowed
    max_completion_tokens: 1500
  }

  const response = await axios.post<OpenAIChatResponse>(
    `${OPENAI_API_BASE}/chat/completions`,
    request,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  )

  return response.data.choices[0].message.content
}
