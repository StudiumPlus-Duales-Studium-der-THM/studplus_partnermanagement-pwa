# StudiumPlus Partner-Notizen - Applikationsübersicht

> **⚠️ WICHTIG - Kostenmanagement:**
> Diese Dokumentation enthält eine wichtige Sektion zur **Token-Optimierung & Kostenmanagement** (siehe unten).
> Die implementierte Feld-Filterung beim Company-Matching reduziert API-Kosten deutlich (>90%) und ist essentiell für den wirtschaftlichen Betrieb.

## Zweck der Anwendung

Die StudiumPlus Partner-Notizen App ist eine Progressive Web Application (PWA), die StudiumPlus-Direktoren bei der Dokumentation von Partnergesprächen unterstützt. Die App automatisiert den Workflow von der Sprachaufnahme bis zum fertigen GitHub Issue durch den Einsatz von KI-Technologien.

### Hauptziele

1. **Schnelle Erfassung**: Gesprächsnotizen per Sprachaufnahme direkt nach Partnergesprächen aufnehmen
2. **Automatische Verarbeitung**: KI-gestützte Transkription und professionelle Textaufbereitung
3. **Zentrale Dokumentation**: Automatische Erstellung von GitHub Issues als zentrale Wissensdatenbank
4. **Offline-fähig**: Nutzung auch ohne Internetverbindung, Synchronisation erfolgt später

## Technologie-Stack

### Frontend
- **Vue.js 3** mit Composition API - Modernes reaktives Framework
- **TypeScript** - Typsicherheit und bessere Developer Experience
- **Vuetify 3** - Material Design Komponenten-Bibliothek
- **Vue Router** - Client-seitige Navigation

### State Management & Storage
- **Pinia** - Zentrales State Management für Vue 3
- **IndexedDB** (via Dexie.js) - Lokale Datenspeicherung im Browser
- **LocalStorage** - Verschlüsselte Speicherung von API-Keys

### Build & Development
- **Vite** - Schneller Build-Tool und Dev-Server
- **vite-plugin-pwa** - PWA-Funktionalität mit Service Worker
- **TypeScript Compiler** - Type-Checking

### APIs & Services
- **OpenAI Whisper API** - Sprachtranskription (Audio → Text)
- **OpenAI GPT-5-mini** - Textaufbereitung und Company-Matching
- **GitHub API** - Issue-Erstellung und Datenabfrage

### Sicherheit
- **WebAuthn** - Biometrische Authentifizierung (Fingerprint, FaceID)
- **crypto-js** - AES-Verschlüsselung für sensible Daten

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                         PWA Frontend                         │
│                    (Vue.js + TypeScript)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Views      │  │  Composables │  │   Stores     │      │
│  │  (Pages)     │  │  (Logic)     │  │   (State)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Services (API Layer)                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ OpenAI   │  │  GitHub  │  │  DB      │           │  │
│  │  │ Service  │  │  Service │  │  Service │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Storage Layer                            │  │
│  │  ┌──────────────┐          ┌──────────────┐          │  │
│  │  │  IndexedDB   │          │ LocalStorage │          │  │
│  │  │  (Dexie.js)  │          │ (encrypted)  │          │  │
│  │  └──────────────┘          └──────────────┘          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
        ┌─────────────────────────────────────┐
        │       External Services             │
        ├─────────────────────────────────────┤
        │  OpenAI API    │  GitHub API        │
        │  - Whisper     │  - Issues          │
        │  - GPT-5-mini  │  - Contents        │
        └─────────────────────────────────────┘
```

## Hauptkomponenten

### Views (Seiten)

| View | Route | Beschreibung |
|------|-------|--------------|
| **OnboardingView** | `/onboarding` | Erstmaliges Setup: Name, API-Keys, GitHub Token |
| **AuthView** | `/auth` | WebAuthn Login-Bildschirm |
| **HomeView** | `/` | Dashboard mit letzten Notizen |
| **RecordingView** | `/recording` | Sprachaufnahme-Interface |
| **PreviewView** | `/preview/:id` | Bearbeitung von Transkription und aufbereitetem Text |
| **HistoryView** | `/history` | Übersicht aller Notizen mit Filter |
| **SettingsView** | `/settings` | Einstellungen (API-Keys, Auto-Lock, Daten-Export) |

### Stores (Pinia)

| Store | Verantwortlichkeit |
|-------|-------------------|
| **authStore** | Authentifizierung, API-Keys, User-Daten |
| **voiceNotesStore** | CRUD-Operationen für Sprachnotizen |
| **companiesStore** | Verwaltung der Partnerunternehmen-Daten |
| **settingsStore** | App-Einstellungen (Auto-Lock, Theme) |
| **notificationStore** | Toast-Benachrichtigungen |

### Services

| Service | Datei | Beschreibung |
|---------|-------|--------------|
| **OpenAI Service** | `src/services/openai.service.ts` | Whisper-Transkription, GPT-Textaufbereitung, Company-Matching |
| **GitHub Service** | `src/services/github.service.ts` | Issue-Erstellung, Abruf von `companies.json` |
| **DB Service** | `src/services/db.ts` | IndexedDB-Zugriff (Dexie.js Schema) |
| **Encryption Service** | `src/services/encryption.service.ts` | AES-Verschlüsselung für API-Keys |

### Composables

| Composable | Datei | Beschreibung |
|------------|-------|--------------|
| **useProcessing** | `src/composables/useProcessing.ts` | Zentrale Verarbeitungslogik: Transkription, Aufbereitung, GitHub-Versand |
| **useOfflineSync** | `src/composables/useOfflineSync.ts` | Offline-Synchronisation und Retry-Mechanismen |

## Verarbeitungs-Pipeline

Die Verarbeitung einer Notiz durchläuft mehrere Phasen. Details zu den Status-Übergängen finden sich in der [Note Status Model Dokumentation](./note-status-model.md).

### 1. Aufnahme (Recording)

**Komponente:** `RecordingView.vue`

```
User drückt Record-Button
    ↓
MediaRecorder API startet Aufnahme
    ↓
Audio-Chunks werden gesammelt
    ↓
User stoppt Aufnahme
    ↓
Blob wird in IndexedDB gespeichert
    ↓
Status: RECORDED
```

### 2. Transkription

**Service:** `openai.service.ts:transcribeAudio()`
**Trigger:** User klickt "Transkribieren" oder automatisch nach Aufnahme

```
Status: RECORDED → TRANSCRIBING
    ↓
Audio Blob → FormData (MP3)
    ↓
POST /v1/audio/transcriptions (OpenAI Whisper)
    ↓
Response: { text: "..." }
    ↓
Text wird gespeichert
    ↓
Status: TRANSCRIBED
```

**Fehlerbehandlung:** Bei API-Fehler → Status `ERROR` mit Fehlermeldung

### 3. Company-Matching (Optional, automatisch)

**Service:** `openai.service.ts:matchCompany()`
**Trigger:** Automatisch nach Transkription

```
Transkription + companies.json werden an GPT-5-mini gesendet
    ↓
Nur matching-relevante Felder werden extrahiert:
  • id, name, shortName, aliases, location
  • KEINE Kontakt-Daten (nicht relevant für Firmen-Matching)
  • Reduziert Token-Verbrauch um ~70-80%
    ↓
KI analysiert Text und findet erwähntes Unternehmen
    ↓
Response: { matched_company_id: "...", confidence: "high/medium/low" }
    ↓
Company/Contact werden vorausgewählt
```

**Hinweise:**
- Nicht kritisch - User kann Company manuell wählen, falls Matching fehlschlägt
- Token-Optimierung: Nur 5 Felder pro Firma werden gesendet
- Funktioniert effizient auch bei vielen Unternehmen

### 4. Textaufbereitung

**Service:** `openai.service.ts:processText()`
**Trigger:** User wählt Company/Contact und klickt "Verarbeiten"

```
Status: TRANSCRIBED → PROCESSING
    ↓
Transkription + Company + Contact → GPT-5-mini
    ↓
KI strukturiert den Text nach klaren Regeln:
  - INHALTLICHE TREUE: Keine Änderung von Aussagen
  - MINIMALE KORREKTUR: Nur Grammatik & Rechtschreibung
  - GESPRÄCHSDATUM-ERKENNUNG: Explizite Extraktion des Gesprächsdatums (nicht Aufzeichnungsdatum!)
  - DEADLINE-ERKENNUNG: Extraktion aller Termine/Fristen
  - STRUKTURIERUNG: Gliederung in Abschnitte
    • Gesprächsdatum (dedizierte Extraktion)
    • Gesprächsnotizen (originalgetreu)
    • Vereinbarungen
    • Deadlines & Termine (zukünftige Termine)
    • Nächste Schritte
    ↓
Response: Strukturierter Text (Originalaussagen erhalten)
    ↓
Status: PROCESSED
```

**GPT-Prompt-Regeln:**
- Bewahrt inhaltliche Aussagen (keine Interpretationen)
- Korrigiert nur offensichtliche Fehler
- **Extrahiert Gesprächsdatum explizit** (Regel 5: sucht nach "Gespräch am...", "heute", etc.)
- Extrahiert alle Termine/Deadlines in Format TT.MM.JJJJ
- Verwendet möglichst Originalwortlaut

### 5. GitHub Issue-Erstellung

**Service:** `github.service.ts:createIssue()`
**Trigger:** User klickt "An GitHub senden"

```
Status: PROCESSED → SENDING
    ↓
Formatierung des Issue-Body:
  - Titel: [Company] - Datum - User
  - Body: Markdown mit Metadaten + aufbereitetem Text
  - Labels: partner-kontakt, company-slug
    ↓
POST /repos/{owner}/{repo}/issues (GitHub API)
    ↓
Response: { html_url, number }
    ↓
URL & Issue-Nummer werden gespeichert
    ↓
Status: SENT
```

**Issue-Format:**
```markdown
## Metadaten
- **Unternehmen:** ABC GmbH
- **Ansprechpartner:** Max Mustermann (Geschäftsführer)
- **Datum:** 21.11.2025
- **Erfasst von:** John Doe

## Gesprächsnotiz
[Aufbereiteter Text von GPT]
```

## Token-Optimierung & Kostenmanagement

**⚠️ WICHTIG:** Die Anzahl der an OpenAI gesendeten Tokens hat direkten Einfluss auf die API-Kosten. Besonders beim Company-Matching kann eine naive Implementierung sehr teuer werden.

### Problem: Company-Matching mit großen Datensätzen

**Szenario:** Bei vielen Unternehmen würde eine naive Implementierung alle Daten senden:
```
1 Unternehmen mit allen Feldern (inkl. Kontakte, Notes, etc.): ~200-500 tokens
100 Unternehmen: ~20.000-50.000 tokens pro Anfrage
1000 Unternehmen: ~200.000-500.000 tokens pro Anfrage ❌ (überschreitet Context Window!)
```

**Kosten-Beispiel (GPT-5-mini) bei naiver Implementierung:**
- Input: $0.25 per 1M tokens
- Output: $2.00 per 1M tokens
- Bei 100 Anfragen/Tag mit 50.000 tokens Input: 0.05M × $0.25 × 100 Tage = ~$1.25/Tag
- = ~$450/Jahr nur für Company-Matching (ohne Output!) ❌

### Implementierte Lösung: Feld-Filterung (Option 1)

**Aktueller Ansatz in `openai.service.ts:matchCompany()`:**

Die Funktion extrahiert automatisch nur matching-relevante Felder, bevor Daten an die API gesendet werden:

```typescript
// Nur 5 relevante Felder pro Unternehmen
const compactCompanies = companies.companies?.map((c: any) => ({
  id: c.id,              // Für Rückmeldung nötig
  name: c.name,          // Primäres Matching-Kriterium
  shortName: c.shortName,// Häufig verwendet in Gesprächen
  aliases: c.aliases,    // Wichtig für Varianten (z.B. "Viessmann" vs "Viessmann Group")
  location: c.location   // Optional, falls Standort erwähnt wird
}))
```

**Ausgeschlossene Felder (nicht relevant für Firmen-Matching):**
- ❌ `contacts[]` - Ansprechpartner (größter Token-Verbraucher!)
- ❌ `studyPrograms[]` - Nicht relevant für Identifikation
- ❌ `notes` - Zu viele Tokens
- ❌ `partnershipType` - Nicht relevant für Matching
- ❌ `lastContactDate` - Nicht relevant für Matching

**Effekt:**
- **Token-Reduktion: ~70-80%**
- 1 Unternehmen: ~50-100 tokens (statt 200-500)
- 100 Unternehmen: ~5.000-10.000 tokens ✅
- 1000 Unternehmen: ~50.000-100.000 tokens ✅

**Kostenersparnis durch Feld-Filterung:**
- Mit Optimierung: ~$0.21/Monat = ~$2.50/Jahr für Matching
- Ohne Optimierung (naive Implementierung): ~$450/Jahr
- **Einsparung: ~99.4% (~$447/Jahr)** 🎯

### Alternative Ansätze (für Zukunft dokumentiert)

#### Option 2: Pre-Filtering (für sehr große Datensätze)

```typescript
// Im Frontend: Erst Keyword-Extraktion
const keywords = extractKeywords(transcription)
const relevantCompanies = companies.filter(c =>
  keywords.some(kw =>
    c.name.toLowerCase().includes(kw.toLowerCase()) ||
    c.aliases.some(a => a.toLowerCase().includes(kw.toLowerCase()))
  )
)

// Nur 10-50 relevante Firmen an API senden
await matchCompany(transcription, relevantCompanies, apiKey)
```

**Vorteile:**
- Weitere Token-Reduktion: ~90-95%
- Schnellere API-Antworten

**Nachteile:**
- Komplexere Logik
- Risiko: Relevante Firma wird vorab ausgefiltert

#### Option 3: Zwei-Stufen-Ansatz

1. **Stufe 1:** Nur Namen an GPT senden → Kandidaten-Liste
2. **Stufe 2:** Details aus lokalem Cache laden

**Vorteile:**
- Minimale Tokens (~10-20 pro Firma)

**Nachteile:**
- 2 API-Calls (mehr Latenz)
- Komplexere Implementierung

#### Option 4: Vector Search / Embeddings

Embeddings-basierte Suche für semantisches Matching ohne große Prompts.

**Vorteile:**
- Extrem effizient bei >1000 Firmen
- Einmalige Embedding-Kosten

**Nachteile:**
- Hohe Komplexität
- Zusätzliche Infrastruktur nötig

### Empfohlene Strategie

**Aktuell (< 500 Unternehmen):**
- ✅ **Option 1** (Feld-Filterung) - bereits implementiert
- ✅ **Zusätzlich:** Manuelle Vorauswahl in companies.json (nur wichtige Partner)

**Zukünftig (> 500 Unternehmen):**
- 🔄 **Option 2** (Pre-Filtering) hinzufügen
- 🔄 **Oder** Option 3 (Zwei-Stufen) für maximale Effizienz

### Monitoring & Best Practices

**Token-Verbrauch überwachen:**
```typescript
// Optional: Token-Zählung loggen
console.log(`Sent ${compactJson.length} characters (~${compactJson.length/4} tokens)`)
```

**Kostenoptimierung:**
- companies.json klein halten (nur aktive Partner)
- Regelmäßig alte/inaktive Firmen entfernen
- Bei Bedarf: Caching für häufige Matches

**Geschätzte Gesamtkosten (bei 100 Notizen/Monat):**

*Pricing-Annahmen (Stand: OpenAI GPT-5-mini Preise):*
- Whisper: $0.006 per Minute Audio
- GPT-5-mini Input: $0.25 per 1M tokens
- GPT-5-mini Cached Input: $0.25 per 1M tokens
- GPT-5-mini Output: $2.00 per 1M tokens

*Berechnungen:*
1. **Whisper (Transkription):**
   - 100 Notizen × 3 Min Ø = 300 Min/Monat
   - 300 Min × $0.006 = **~$1.80/Monat**

2. **GPT-5-mini (Company Matching):**
   - 100 Anfragen × 7.500 tokens Input (Ø) = 750k tokens
   - 100 Anfragen × 100 tokens Output (Ø) = 10k tokens
   - Input: 0.75M × $0.25 = $0.19
   - Output: 0.01M × $2.00 = $0.02
   - **~$0.21/Monat**

3. **GPT-5-mini (Textaufbereitung):**
   - 100 Anfragen × 1.000 tokens Input (Ø) = 100k tokens
   - 100 Anfragen × 800 tokens Output (Ø) = 80k tokens
   - Input: 0.1M × $0.25 = $0.025
   - Output: 0.08M × $2.00 = $0.16
   - **~$0.19/Monat**

**Total: ~$2.20/Monat oder ~$26/Jahr** ✅

*Hinweis: Preise Stand August 2025 (GPT-5-mini Release). Aktuelle Preise prüfen unter: https://openai.com/pricing*

---

## Datenfluss

### Lokale Datenhaltung

**IndexedDB (via Dexie.js):**
```typescript
// Schema in src/services/db.ts
{
  voiceNotes: {
    id: string (nanoid)
    audioBlob: Blob
    transcription?: string
    processedText?: string
    selectedCompanyId?: string
    selectedContactId?: string
    recordedAt: Date
    status: NoteStatus
    errorMessage?: string
    githubIssueUrl?: string
    githubIssueNumber?: number
  }
}
```

**LocalStorage (verschlüsselt):**
```json
{
  "auth_data": "<AES-verschlüsseltes JSON>",
  "settings": {
    "autoLockMinutes": 15
  }
}
```

### API-Kommunikation

**OpenAI API:**
- Endpoint: `https://api.openai.com/v1`
- Authentifizierung: `Bearer <API-Key>`
- Verwendete Modelle:
  - `whisper-1` - Transkription
  - `gpt-5-mini` - Textaufbereitung und Matching

**GPT-5 API-Unterschiede:**
- ⚠️ Verwendet `max_completion_tokens` statt `max_tokens`
- ⚠️ `temperature` Parameter nicht unterstützt (nur Standard-Wert 1)
- ⚠️ Unterschiedliche Token-Limits: 272k Input, 128k Output (inkl. Reasoning)

**GitHub API:**
- Endpoint: `https://api.github.com`
- Authentifizierung: `token <GitHub-PAT>`
- Verwendete Endpoints:
  - `POST /repos/{owner}/{repo}/issues` - Issue erstellen
  - `GET /repos/{owner}/{repo}/contents/companies.json` - Unternehmensdaten
- Hinweis: User-Agent Header kann in Browsern nicht gesetzt werden (Sicherheitsrestriktion)

## Sicherheitskonzept

### Authentifizierung

**WebAuthn (biometrisch):**
- Fingerabdruck (iOS, Android, Windows Hello)
- FaceID (iOS, macOS)
- PIN als Fallback
- Challenge-Response-Mechanismus
- Credentials werden im Browser gespeichert (nicht übertragbar)

**Implementierung:** `src/stores/auth.ts`

### Datenverschlüsselung

**API-Keys (AES-256):**
```typescript
// Verschlüsselung
const encrypted = CryptoJS.AES.encrypt(apiKey, passphrase).toString()

// Entschlüsselung
const decrypted = CryptoJS.AES.decrypt(encrypted, passphrase).toString(CryptoJS.enc.Utf8)
```

**Passphrase-Generierung:** Aus WebAuthn-Challenge abgeleitet

### Auto-Lock

- Automatisches Logout nach konfigurierbarer Inaktivität (1, 5, 15 Min oder Aus)
- Bei Verlassen der App (Tab-Wechsel, App in Hintergrund)
- Implementierung: `src/composables/useAutoLock.ts`

## Offline-Funktionalität

### Service Worker

**Caching-Strategie:**
- **App-Shell:** Precaching aller statischen Assets (HTML, CSS, JS, Fonts)
- **Runtime-Caching:** API-Responses (stale-while-revalidate)
- **IndexedDB:** Alle Notizen und Audio-Daten

**Offline-Fähigkeiten:**
- Sprachaufnahme funktioniert komplett offline
- Notizen werden lokal gespeichert
- Verarbeitung erfordert Internet (OpenAI/GitHub APIs)

### Synchronisation

**Implementierung:** `src/composables/useOfflineSync.ts`

```
App startet / Kommt online
    ↓
Prüfe alle Notizen mit Status PROCESSED
    ↓
Finde Notizen ohne GitHub Issue URL
    ↓
Versuche automatisch, Issues zu erstellen
    ↓
Bei Erfolg: Status → SENT
Bei Fehler: Status bleibt PROCESSED (erneuter Versuch beim nächsten Online-Event)
```

## Workflow-Beispiel

**Typischer User-Workflow:**

1. **Login**
   - App öffnen → WebAuthn-Authentifizierung (Fingerprint)

2. **Aufnahme**
   - "Neue Aufnahme" → Aufnahme-Button drücken
   - Gesprächsnotiz sprechen
   - Aufnahme stoppen → Automatische Transkription startet

3. **Bearbeitung**
   - Transkription erscheint
   - Company wird (meist) automatisch erkannt
   - Optional: Company/Contact manuell korrigieren
   - "Verarbeiten" → KI bereitet Text auf

4. **Review & Senden**
   - Aufbereiteten Text prüfen
   - Optional: Nachbearbeitung
   - "An GitHub senden" → Issue wird erstellt

5. **Fertig**
   - GitHub Issue-URL wird angezeigt
   - Notiz hat Status "Gesendet"
   - In Historie abrufbar

**Zeitaufwand:** Ca. 30-60 Sekunden vom Start bis zum fertigen Issue (ohne Aufnahmezeit)

## Fehlerbehandlung

### API-Fehler

**Retry-Mechanismus:**
- Automatische Wiederholung bei Netzwerkfehlern
- Exponential Backoff: 2s, 4s, 8s, 16s
- Max. 4 Versuche
- Implementierung in allen API-Services

**User-Feedback:**
- Toast-Benachrichtigungen bei Fehlern
- Detaillierte Fehlermeldung im ERROR-Status
- "Erneut versuchen"-Button in HistoryView

### Offline-Handling

- Prüfung auf Internet-Verbindung vor API-Calls
- Benachrichtigung: "Keine Internetverbindung"
- Notizen bleiben in lokalem Status (RECORDED, TRANSCRIBED, PROCESSED)
- Automatische Synchronisation bei Wiederverbindung

## Performance-Optimierungen

### Lazy Loading

- Route-basiertes Code-Splitting
- Komponenten werden nur geladen, wenn benötigt
- Reduzierte initiale Bundle-Größe

### Audio-Kompression

- Aufnahme in WebM/Opus oder MP4/AAC
- Konvertierung zu MP3 für OpenAI
- Blob-URLs für effiziente Speicherung

### IndexedDB

- Asynchrone Operationen (kein Blocking der UI)
- Indexed Queries für schnelle Suche
- Automatisches Cleanup von Blob-URLs

## Erweiterbarkeit

### Geplante Features

- **Team-Funktionalität:** Mehrere User, Notizen teilen
- **Templates:** Vordefinierte Gesprächsstrukturen
- **Export:** PDF-Export von Notizen
- **Statistiken:** Übersicht über Gespräche pro Unternehmen
- **Sprach-Unterstützung:** Mehrsprachigkeit (aktuell nur Deutsch)

### Extension Points

1. **Neue Status:** Erweiterung des `NoteStatus` Enums
2. **Neue Verarbeitungsschritte:** Hooks in `useProcessing.ts`
3. **Weitere AI-Features:** Sentiment-Analyse, Zusammenfassungen
4. **Integration:** Weitere Issue-Tracker (Jira, Linear, etc.)

## Entwickler-Hinweise

### Setup für lokale Entwicklung

```bash
# Dependencies installieren
npm install

# .env.local erstellen
cp .env.example .env.local

# Dev-Server starten
npm run dev

# TypeScript prüfen
npm run build

# Tests ausführen
npm run test
```

### Wichtige Konventionen

1. **Composables:** Wiederverwendbare Logik mit `use*` Prefix
2. **Services:** Pure Functions, keine Vue-Dependencies
3. **Stores:** Minimale Business-Logik, hauptsächlich State
4. **Error-Handling:** Immer try/catch bei async Operations
5. **TypeScript:** Keine `any` Types, vollständige Typisierung

### Debugging

- **Vue DevTools:** Pinia State, Component Tree
- **IndexedDB:** Chrome DevTools → Application → IndexedDB
- **Service Worker:** Chrome DevTools → Application → Service Workers
- **Network:** Alle API-Calls in Network-Tab sichtbar

## Weitere Dokumentation

- [Note Status Model](./note-status-model.md) - Details zum Status-Management
- [README.md](../README.md) - Setup und Installation
