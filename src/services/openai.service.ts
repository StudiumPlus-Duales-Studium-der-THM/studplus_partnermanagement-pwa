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
 */
export const matchCompany = async (
  transcription: string,
  companiesJson: string,
  apiKey: string
): Promise<CompanyMatchResult> => {
  const prompt = `Du bist ein Assistent für StudiumPlus. Analysiere folgende Gesprächsnotiz und identifiziere das erwähnte Partnerunternehmen aus der Liste.

Gesprächsnotiz:
"""
${transcription}
"""

Verfügbare Unternehmen (JSON):
"""
${companiesJson}
"""

WICHTIG: Suche nach Namen, Alias, oder Hinweisen im Text. Antworte NUR mit gültigem JSON in diesem Format:
{
  "matched_company_id": "string oder null",
  "confidence": "high/medium/low",
  "reasoning": "kurze Begründung"
}

Antworte AUSSCHLIESSLICH mit dem JSON-Objekt, kein zusätzlicher Text.`

  const request: OpenAIChatRequest = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 200
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
  return JSON.parse(content) as CompanyMatchResult
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
Erstelle einen strukturierten, professionellen Text mit folgenden Abschnitten:
1. Gesprächsnotizen (Hauptinhalt, erweitert und sprachlich verbessert)
2. Vereinbarungen (falls erwähnt, als Liste)
3. Nächste Schritte (falls erwähnt, als Liste)

Anforderungen:
- Vollständige Sätze, korrekte Grammatik und Zeichensetzung
- Sachlicher, professioneller Ton
- Ergänze fehlende Artikel, Präpositionen
- Keine Erfindungen, bleibe beim Inhalt der Notiz
- Falls Datum erwähnt: In Standardformat (TT.MM.JJJJ)

Antworte im Format:
## Gesprächsnotizen
[Text]

## Vereinbarungen
[Liste oder "Keine expliziten Vereinbarungen getroffen."]

## Nächste Schritte
[Liste oder "Keine konkreten nächsten Schritte festgelegt."]`

  const request: OpenAIChatRequest = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.5,
    max_tokens: 1500
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
