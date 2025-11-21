# StudiumPlus Partner-Notizen - Applikationsübersicht

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
- **OpenAI GPT-4o-mini** - Textaufbereitung und Company-Matching
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
        │  - GPT-4o-mini │  - Contents        │
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
Transkription + companies.json werden an GPT-4o-mini gesendet
    ↓
KI analysiert Text und findet erwähntes Unternehmen
    ↓
Response: { matched_company_id: "...", confidence: "high/medium/low" }
    ↓
Company/Contact werden vorausgewählt
```

**Hinweis:** Nicht kritisch - User kann Company manuell wählen, falls Matching fehlschlägt

### 4. Textaufbereitung

**Service:** `openai.service.ts:processText()`
**Trigger:** User wählt Company/Contact und klickt "Verarbeiten"

```
Status: TRANSCRIBED → PROCESSING
    ↓
Transkription + Company + Contact → GPT-4o-mini
    ↓
KI strukturiert und professionalisiert den Text:
  - Grammatik & Rechtschreibung
  - Professioneller Ton
  - Strukturierung (Themen, Vereinbarungen, Nächste Schritte)
    ↓
Response: Aufbereiteter Text
    ↓
Status: PROCESSED
```

**GPT-Prompt:** Enthält Kontext über StudiumPlus, Unternehmen und Ansprechpartner

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
  - `gpt-4o-mini` - Textaufbereitung und Matching

**GitHub API:**
- Endpoint: `https://api.github.com`
- Authentifizierung: `token <GitHub-PAT>`
- Verwendete Endpoints:
  - `POST /repos/{owner}/{repo}/issues` - Issue erstellen
  - `GET /repos/{owner}/{repo}/contents/companies.json` - Unternehmensdaten

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
