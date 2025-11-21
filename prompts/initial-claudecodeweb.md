# Projektanweisung: Vue.js PWA für Partner-Gesprächsnotizen mit KI-Verarbeitung

## Projektziel
Entwickle eine Progressive Web App (PWA) mit Vue.js, mit der Direktoren von StudiumPlus nach Gesprächen mit Partnerunternehmen Sprachnotizen aufnehmen können. Diese werden per KI transkribiert, sprachlich aufbereitet und als GitHub Issues im Repository gespeichert. Die PWA läuft im Browser und kann auf dem Home-Screen installiert werden.

---

## 1. Technologie-Stack

### Frontend
- **Framework:** Vue.js 3 (Composition API)
- **Sprache:** TypeScript
- **Build-Tool:** Vite
- **PWA-Plugin:** vite-plugin-pwa
- **Plattformen:** Web-Browser (iOS Safari, Android Chrome, Desktop-Browser)
- **UI-Sprache:** Nur Deutsch

### UI-Bibliothek
- **Component Library:** Vuetify 3 (Material Design) oder PrimeVue
- **Alternative:** Tailwind CSS + HeadlessUI für individuelles Design
- **Icons:** Material Design Icons oder Heroicons

### APIs & Services
- **Speech-to-Text:** OpenAI Whisper API
- **Text-Aufbereitung:** OpenAI GPT-5-mini API (aktuelles Modell, später Umstellung auf nele.ai vorbereiten)
- **Ticketing:** GitHub REST API v3
- **Repository:** `https://github.com/StudiumPlus-Duales-Studium-der-THM/studiumplus-partner-management.git` (private)

### Datenspeicherung
- **Browser Storage:** 
  - IndexedDB (für Historie und Queue) via Dexie.js
  - LocalStorage (für einfache Einstellungen)
  - Verschlüsselung: crypto-js für sensible Daten (Token, Passwort-Hash)
- **Unternehmensdaten:** JSON-Dateien von GitHub geladen und in IndexedDB gecacht

### State Management
- **Pinia** (offizieller Vue 3 State Manager)

---

## 2. Sicherheit & Authentifizierung

### PWA-Zugang (Variante A)
- **Erstmalige Einrichtung:**
  - Benutzer gibt Namen ein (frei wählbar, wird in Issues verwendet)
  - Passwort festlegen (Mindestanforderung: 8 Zeichen)
  - GitHub Personal Access Token eingeben
  - Alle sensiblen Daten verschlüsselt in IndexedDB speichern (crypto-js: AES-256)
  - Master-Key aus Passwort ableiten (PBKDF2)

- **Web Authentication API (WebAuthn):**
  - Biometrische Authentifizierung via WebAuthn (Face ID, Touch ID, Windows Hello)
  - Fallback auf Passwort-Eingabe
  - Package: Native Web Authentication API (kein Package nötig)
  - Funktioniert auf iOS Safari 14.3+, Android Chrome, Desktop

- **Session-Management:**
  - Automatische Sperre nach 5 Minuten Inaktivität
  - Session Token in Memory (nicht persistent)
  - Optional: Nach 3 Fehlversuchen → 1 Minute Wartezeit

### GitHub Token-Konfiguration
- **Typ:** Fine-grained Personal Access Token
- **Repository:** Nur `StudiumPlus-Duales-Studium-der-THM/studiumplus-partner-management`
- **Berechtigungen:**
  - `Issues: Read and Write`
  - `Contents: Read` (für companies.json)
- **Expiration:** 1 Jahr (mit Hinweis in App zur Erneuerung)

### HTTPS-Anforderung
- **Entwicklung:** localhost (HTTP erlaubt)
- **Production:** HTTPS zwingend erforderlich für:
  - Mikrofon-Zugriff (MediaRecorder API)
  - Service Worker (PWA)
  - WebAuthn (Biometrie)

---

## 3. Datenstrukturen

### companies.json (auf GitHub Repository)
```json
{
  "companies": [
    {
      "id": "string",
      "name": "string",
      "shortName": "string",
      "aliases": ["string"],
      "location": "string",
      "partnershipType": "string",
      "studyPrograms": ["string"],
      "contacts": [
        {
          "id": "string",
          "firstName": "string",
          "lastName": "string",
          "role": "string",
          "email": "string",
          "phone": "string",
          "isPrimaryContact": boolean
        }
      ],
      "notes": "string",
      "lastContactDate": "string (ISO 8601)"
    }
  ]
}
```

### TypeScript Interfaces

**VoiceNote:**
```typescript
interface VoiceNote {
  id: string;
  audioBlob: Blob | null; // Audio als Blob gespeichert
  audioBlobUrl?: string; // Object URL für Playback
  transcription?: string;
  processedText?: string;
  selectedCompanyId?: string;
  selectedContactId?: string;
  recordedAt: Date;
  status: NoteStatus; // enum: 'recorded' | 'transcribed' | 'processed' | 'sent' | 'error'
  errorMessage?: string;
  githubIssueUrl?: string;
}

enum NoteStatus {
  RECORDED = 'recorded',
  TRANSCRIBED = 'transcribed',
  PROCESSED = 'processed',
  SENT = 'sent',
  ERROR = 'error'
}
```

**Company & Contact:**
```typescript
interface Company {
  id: string;
  name: string;
  shortName: string;
  aliases: string[];
  location: string;
  partnershipType: string;
  studyPrograms: string[];
  contacts: Contact[];
  notes: string;
  lastContactDate: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  isPrimaryContact: boolean;
}
```

---

## 4. Kernfunktionalität

### 4.1 Onboarding & Setup

**Erster App-Start (PWA-Installation):**
1. Willkommensbildschirm
2. Eingabe: Name des Nutzers
3. Eingabe: Passwort (min. 8 Zeichen, Bestätigung)
4. Eingabe: GitHub Personal Access Token
5. WebAuthn-Setup (optional, empfohlen - falls Browser unterstützt)
6. Verschlüsselte Speicherung in IndexedDB

**Bei jedem App-Start:**
- WebAuthn-Authentifizierung (oder Passwort)
- Prüfung auf Internet-Verbindung (navigator.onLine)
- Versuch, companies.json von GitHub zu laden (falls Update vorhanden)
- Service Worker-Status prüfen

### 4.2 Hauptfunktionen

#### Aufnahme-Screen
**UI-Elemente:**
- Header: "Neue Gesprächsnotiz"
- Info-Box (ausklappbar via `v-expansion-panel`, beim ersten Mal offen):
  ```
  💡 Bitte in Ihrer Sprachnotiz eingehen auf:
  • Unternehmen & Ansprechpartner
  • Datum des Gesprächs
  • Besprochene Themen
  • Vereinbarungen
  • Nächste Schritte
  ```
- Großer "🎤 Aufnahme starten" Button (FAB - Floating Action Button)
- Während Aufnahme: Timer (computed property), Waveform-Visualisierung (canvas), "Stopp"-Button
- Nach Aufnahme: "Verarbeiten"-Button, "Neu aufnehmen"-Button, "Löschen"-Button

**Technische Implementierung:**
```typescript
// MediaRecorder API für Audioaufnahme
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000 // Optimal für Whisper
      } 
    });
    
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus' // Beste Kompression
      // Fallback: 'audio/mp4' für Safari
    });
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    
    mediaRecorder.start();
    isRecording.value = true;
  } catch (err) {
    console.error('Mikrofon-Zugriff verweigert', err);
  }
};

const stopRecording = () => {
  mediaRecorder.stop();
  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    // Speichern in IndexedDB via Dexie
    saveVoiceNote({ audioBlob, status: 'recorded' });
  };
};
```

**Ablauf:**
1. User startet Aufnahme (MediaRecorder API)
2. Audio wird als Blob gesammelt
3. Nach Stopp: Blob in IndexedDB speichern (Dexie.js)
4. User klickt "Verarbeiten"

#### Verarbeitungs-Flow
**Schritt 1: Transkription**
- Audio-Blob via OpenAI Whisper API senden
- Request:
  ```typescript
  const formData = new FormData();
  // Konvertierung zu .mp3 für bessere Kompatibilität
  const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' });
  formData.append('file', audioFile);
  formData.append('model', 'whisper-1');
  formData.append('language', 'de');
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: formData
  });
  
  const data = await response.json();
  const transcription = data.text;
  ```
- Response: `{ "text": "transkribierter Text" }`
- Transkription in VoiceNote speichern (status: transcribed)

**Schritt 2: Unternehmens-Matching**
- Transkription + Liste der companies.json an GPT-5-mini senden
- **Token-Optimierung:** Nur matching-relevante Felder werden extrahiert (id, name, shortName, aliases, location)
- Keine Kontakt-Daten werden gesendet (nicht relevant für Firmen-Matching)
- Prompt:
  ```
  Du bist ein Assistent für StudiumPlus. Analysiere folgende Gesprächsnotiz und identifiziere das erwähnte Partnerunternehmen aus der Liste.
  
  Gesprächsnotiz:
  """
  [TRANSKRIPTION]
  """
  
  Verfügbare Unternehmen (JSON):
  """
  [COMPANIES JSON]
  """
  
  WICHTIG: Suche nach Namen, Alias, oder Hinweisen im Text. Antworte NUR mit gültigem JSON in diesem Format:
  {
    "matched_company_id": "string oder null",
    "confidence": "high/medium/low",
    "reasoning": "kurze Begründung"
  }
  
  Antworte AUSSCHLIESSLICH mit dem JSON-Objekt, kein zusätzlicher Text.
  ```
- Response parsen, Unternehmen vorschlagen

**Schritt 3: Text-Aufbereitung**
- Transkription + ausgewähltes Unternehmen + Ansprechpartner an GPT-5-mini
- Prompt:
  ```
  Du bist ein Assistent für StudiumPlus und hilfst, Gesprächsnotizen professionell aufzubereiten.

  Eingaben:
  - Unternehmen: [NAME]
  - Ansprechpartner: [VORNAME NACHNAME, ROLLE]
  - Rohe Gesprächsnotiz: """[TRANSKRIPTION]"""

  Aufgabe:
  Strukturiere die Gesprächsnotiz in folgende Abschnitte und analysiere Deadlines/Termine.

  WICHTIGE REGELN:
  1. INHALTLICHE TREUE: Verändere KEINE inhaltlichen Aussagen. Bewahre die Originalaussagen.
  2. MINIMALE KORREKTUR: Korrigiere NUR offensichtliche Grammatik- und Rechtschreibfehler.
  3. KEINE INTERPRETATIONEN: Füge keine eigenen Interpretationen oder Bewertungen hinzu.
  4. KEINE ERFINDUNGEN: Erfinde keine Details, die nicht in der Notiz erwähnt wurden.
  5. GESPRÄCHSDATUM-ERKENNUNG: Suche EXPLIZIT nach dem Datum, an dem das Gespräch stattfand.
     - Achte auf Formulierungen wie: "Gespräch am...", "Telefonat vom...", "Meeting am...", "heute", "gestern"
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
  [Liste der nächsten Schritte, oder "Keine konkreten nächsten Schritte festgelegt."]
  ```
- Response in VoiceNote speichern (status: processed)

**Schritt 4: Vorschau & Bestätigung**
- Screen zeigt:
  - Autocomplete/Select: Unternehmen (Suchfunktion)
  - Autocomplete/Select: Ansprechpartner (gefiltert nach Unternehmen)
  - Editable Textarea: Aufbereiteter Text (mit Markdown-Preview - marked.js)
  - "Senden"-Button, "Verwerfen"-Button

**Schritt 5: GitHub Issue erstellen**
- Bei "Senden":
  ```typescript
  const response = await fetch(
    'https://api.github.com/repos/StudiumPlus-Duales-Studium-der-THM/studiumplus-partner-management/issues',
    {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `[${companyName}] - ${formattedDate} - ${userName}`,
        body: `## Unternehmen\n- Name: ${companyName}\n- Ansprechpartner: ${contactName}\n\n## Datum & Teilnehmer\n- Gesprächsdatum: ${date}\n- Direktor/in: ${userName}\n\n${processedText}\n\n## Metadaten\n- Erstellt: ${isoTimestamp}\n- Studiengang: ${studyPrograms.join(', ')}`,
        labels: ['partner-kontakt', companyName.toLowerCase()]
      })
    }
  );
  
  const issue = await response.json();
  ```
- Response: Issue-URL speichern (`issue.html_url`)
- VoiceNote status: sent
- Erfolgs-Meldung anzeigen (Toast/Snackbar)

### 4.3 Offline-Handling via Service Worker

**Service Worker Setup:**
```javascript
// vite.pwa.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.github\.com\/.*/i,
        handler: 'NetworkFirst', // Versuche Online, Fallback Cache
        options: {
          cacheName: 'github-api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 // 24 Stunden
          }
        }
      }
    ]
  },
  manifest: {
    name: 'StudiumPlus Partner-Notizen',
    short_name: 'Partner-Notizen',
    description: 'KI-gestützte Gesprächsnotizen für Partnerunternehmen',
    theme_color: '#1976D2', // StudiumPlus Blau
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
});
```

**Bei fehlender Internet-Verbindung:**
- Aufnahmen werden normal in IndexedDB gespeichert (status: recorded)
- Bei "Verarbeiten"-Klick: Prüfung via `navigator.onLine`
- Falls offline: Fehlermeldung
  ```
  "Keine Internetverbindung. Die Notiz wird automatisch verarbeitet, sobald eine Verbindung besteht."
  ```
- Background Sync API (wenn unterstützt):
  ```typescript
  // Registrierung für Background Sync
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-voice-notes');
  }
  ```
- Alternative (wenn Background Sync nicht unterstützt):
  - Polling alle 5 Minuten (wenn App offen)
  - Beim nächsten App-Start automatische Verarbeitung

**Verarbeitungs-Queue:**
- IndexedDB-Tabelle: `pendingVoiceNotes`
- Bei Online-Event (`window.addEventListener('online', ...)`):
  - Alle Notes mit status `recorded` laden
  - Sequenziell verarbeiten (transcribe → match → process → send)
  - Browser-Notification bei Erfolg (Notification API)

### 4.4 Historie

**Historie-Screen (Vue Component):**
- Liste aller VoiceNotes (v-for über Pinia Store)
- Sortierung: Datum absteigend (neueste zuerst)
- Anzeige pro Eintrag (Card/List Item):
  - Unternehmensname, Ansprechpartner
  - Datum (formatiert: date-fns oder dayjs)
  - Status-Badge (Vuetify Chip mit Farbe)
    - Wartend: Orange
    - Verarbeitet: Blau
    - Gesendet: Grün
    - Fehler: Rot
  - Bei "Gesendet": Link zum GitHub Issue (external link icon)
- Swipe-to-delete (Vuetify v-list-item mit slide actions)
  - Nur lokale Daten löschen, Issue bleibt
- Filter (Dropdown oben rechts):
  - Nach Status
  - Nach Unternehmen
  - Nach Datumsbereich

### 4.5 Einstellungen

**Einstellungen-Screen:**
- Name ändern (Input Field + Speichern-Button)
- Passwort ändern (Altes PW + Neues PW + Bestätigung)
- GitHub Token ändern (mit Validierungs-Call)
  - Test-Button: "Token validieren"
  - Zeigt Token-Berechtigungen an
- WebAuthn aktivieren/deaktivieren
  - Registrierung neuer Credentials
  - Liste vorhandener Credentials
- Auto-Lock-Zeit (Select: 1, 5, 15 Minuten, Aus)
- Unternehmensdaten aktualisieren (Button mit Spinner)
  - Lädt companies.json von GitHub
  - Zeigt letzte Aktualisierung an
- Dark Mode Toggle (Vuetify Theme Switcher)
- Über die App (Expansion Panel):
  - Version (aus package.json)
  - Open-Source-Lizenzen
  - Datenschutzerklärung (Link oder Inline)
- Erweitert (für Entwickler):
  - IndexedDB löschen (alle lokalen Daten)
  - Service Worker neu registrieren

---

## 5. Detaillierte technische Anforderungen

### 5.1 NPM Packages

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "vuetify": "^3.5.0",
    "@mdi/font": "^7.4.0",
    
    "dexie": "^3.2.0",
    "crypto-js": "^4.2.0",
    
    "axios": "^1.6.0",
    
    "date-fns": "^3.0.0",
    "marked": "^11.0.0",
    
    "workbox-window": "^7.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/crypto-js": "^4.2.0",
    
    "vitest": "^1.0.0",
    "@vue/test-utils": "^2.4.0",
    "happy-dom": "^12.10.0",
    
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "prettier": "^3.1.0"
  }
}
```

**Zusätzliche Packages (optional):**
- `@vueuse/core` - Composition API Utilities (useMediaRecorder)
- `zod` - TypeScript Schema Validation
- `nanoid` - ID-Generierung
- `idb-keyval` - Einfacherer IndexedDB Wrapper (Alternative zu Dexie)

### 5.2 Projektstruktur

```
src/
├── main.ts
├── App.vue
├── router/
│   └── index.ts
├── stores/
│   ├── auth.ts          # Authentifizierung, User-Daten
│   ├── voiceNotes.ts    # Voice Notes State & Actions
│   ├── companies.ts     # Unternehmensdaten
│   └── settings.ts      # App-Einstellungen
├── composables/
│   ├── useAudioRecorder.ts
│   ├── useOpenAI.ts
│   ├── useGitHub.ts
│   ├── useEncryption.ts
│   └── useOfflineSync.ts
├── services/
│   ├── db.ts            # Dexie IndexedDB Setup
│   ├── openai.service.ts
│   ├── github.service.ts
│   └── encryption.service.ts
├── components/
│   ├── layout/
│   │   ├── AppBar.vue
│   │   ├── Navigation.vue
│   │   └── BottomNav.vue
│   ├── recording/
│   │   ├── RecordButton.vue
│   │   ├── WaveformVisualizer.vue
│   │   └── RecordingTimer.vue
│   ├── preview/
│   │   ├── CompanySelect.vue
│   │   ├── ContactSelect.vue
│   │   └── MarkdownEditor.vue
│   └── common/
│       ├── StatusBadge.vue
│       ├── LoadingSpinner.vue
│       └── ErrorAlert.vue
├── views/
│   ├── OnboardingView.vue
│   ├── AuthView.vue
│   ├── HomeView.vue
│   ├── RecordingView.vue
│   ├── PreviewView.vue
│   ├── HistoryView.vue
│   └── SettingsView.vue
├── types/
│   ├── voiceNote.ts
│   ├── company.ts
│   └── api.ts
├── utils/
│   ├── validators.ts
│   ├── formatters.ts
│   └── constants.ts
├── assets/
│   ├── styles/
│   │   └── main.scss
│   └── icons/
└── public/
    ├── icon-192.png
    ├── icon-512.png
    └── manifest.json

```

### 5.3 API-Konfiguration

**Environment Variables (.env):**
```bash
# .env.local (nicht committen!)
VITE_OPENAI_API_KEY=sk-...
VITE_GITHUB_REPO_OWNER=StudiumPlus-Duales-Studium-der-THM
VITE_GITHUB_REPO_NAME=studiumplus-partner-management
VITE_COMPANIES_JSON_PATH=companies.json

# Optional
VITE_SENTRY_DSN=https://...
```

**Zugriff in TypeScript:**
```typescript
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
```

**OpenAI API:**
- Base URL: `https://api.openai.com/v1`
- Modelle:
  - Whisper: `whisper-1`
  - GPT: `gpt-5-mini`

**GPT-5 API-Unterschiede zu GPT-4o:**
- Verwendet `max_completion_tokens` statt `max_tokens`
- `temperature` Parameter nicht unterstützt (nur Wert 1)
- Kann mit Reasoning Levels betrieben werden (minimal/low/medium/high)

**GitHub API:**
- Base URL: `https://api.github.com`
- Hinweis: User-Agent Header kann in Browsern nicht gesetzt werden (Sicherheitsrestriktion)

### 5.4 Error Handling

**Globaler Error Handler:**
```typescript
// main.ts
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err, info);
  // Optional: Sentry.captureException(err);
};
```

**API-Call Error Handling (Composable):**
```typescript
const useAPI = () => {
  const handleError = (error: any) => {
    if (error.response?.status === 401) {
      // Token ungültig
      router.push('/auth');
      showToast('GitHub Token ungültig. Bitte neu eingeben.');
    } else if (error.response?.status === 429) {
      // Rate Limit
      showToast('Zu viele Anfragen. Bitte warten...');
      // Exponential Backoff implementieren
    } else if (!navigator.onLine) {
      // Offline
      showToast('Keine Internetverbindung. Wird später verarbeitet.');
    } else {
      // Generischer Fehler
      showToast('Ein Fehler ist aufgetreten. Bitte erneut versuchen.');
    }
  };
  
  return { handleError };
};
```

**Logging:**
- Console.log für Entwicklung
- Optional: Sentry für Production (ohne sensible Daten)

### 5.5 Testing-Anforderungen

**Unit Tests (Vitest):**
```typescript
// composables/useAudioRecorder.test.ts
import { describe, it, expect, vi } from 'vitest';
import { useAudioRecorder } from '@/composables/useAudioRecorder';

describe('useAudioRecorder', () => {
  it('should start recording when startRecording is called', async () => {
    const { isRecording, startRecording } = useAudioRecorder();
    
    // Mock MediaRecorder
    global.MediaRecorder = vi.fn();
    
    await startRecording();
    expect(isRecording.value).toBe(true);
  });
});
```

**Component Tests:**
```typescript
// components/recording/RecordButton.test.ts
import { mount } from '@vue/test-utils';
import RecordButton from '@/components/recording/RecordButton.vue';

describe('RecordButton', () => {
  it('renders correctly', () => {
    const wrapper = mount(RecordButton);
    expect(wrapper.find('button').exists()).toBe(true);
  });
});
```

**E2E Tests (Playwright - optional):**
- Aufnahme → Verarbeitung → Issue-Erstellung
- Mit Mock-APIs (MSW - Mock Service Worker)

**Coverage-Ziel:** >80% für kritische Funktionen

---

## 6. UI/UX-Spezifikationen

### Design-Prinzipien
- **Material Design 3** (via Vuetify)
- **Primärfarbe:** Blau (#1976D2 - StudiumPlus-Corporate)
- **Akzentfarbe:** Orange (#FF6F00)
- **Dark Mode:** Unterstützt (Vuetify Theme)
- **Responsive:** Mobile-First (320px - Desktop)

### Vuetify Theme Konfiguration
```typescript
// plugins/vuetify.ts
import { createVuetify } from 'vuetify';

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#FF6F00',
          accent: '#FFC107',
          error: '#F44336',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FF9800',
        }
      },
      dark: {
        colors: {
          primary: '#2196F3',
          secondary: '#FF6F00',
        }
      }
    }
  }
});
```

### Wichtige Screens (Vue Components)

**1. OnboardingView (4 Steps mit Stepper):**
```vue
<template>
  <v-stepper v-model="step">
    <v-stepper-header>
      <v-stepper-item title="Willkommen" value="1"></v-stepper-item>
      <v-stepper-item title="Name" value="2"></v-stepper-item>
      <v-stepper-item title="Passwort" value="3"></v-stepper-item>
      <v-stepper-item title="GitHub Token" value="4"></v-stepper-item>
    </v-stepper-header>
    
    <v-stepper-window>
      <v-stepper-window-item value="1">
        <!-- Willkommenstext + App-Erklärung -->
      </v-stepper-window-item>
      <!-- ... weitere Steps -->
    </v-stepper-window>
  </v-stepper>
</template>
```

**2. AuthView:**
```vue
<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title>Partner-Notizen</v-card-title>
          <v-card-text>
            <!-- Logo -->
            <v-img src="/logo.svg" height="100"></v-img>
            
            <!-- WebAuthn Button -->
            <v-btn 
              v-if="webAuthnAvailable" 
              @click="authenticateWithBiometrics"
              block
              color="primary"
              prepend-icon="mdi-fingerprint"
            >
              Mit Biometrie entsperren
            </v-btn>
            
            <!-- Passwort Fallback -->
            <v-text-field
              v-model="password"
              label="Passwort"
              type="password"
              @keyup.enter="login"
            ></v-text-field>
            
            <v-btn @click="login" block color="primary">
              Anmelden
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
```

**3. HomeView/RecordingView:**
```vue
<template>
  <v-container>
    <v-app-bar>
      <v-app-bar-title>Partner-Notizen</v-app-bar-title>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </v-app-bar>
    
    <v-main>
      <!-- Info-Box -->
      <v-expansion-panels v-model="panel">
        <v-expansion-panel>
          <v-expansion-panel-title>
            💡 Hinweise für Ihre Sprachnotiz
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <ul>
              <li>Unternehmen & Ansprechpartner</li>
              <li>Datum des Gesprächs</li>
              <li>Besprochene Themen</li>
              <li>Vereinbarungen</li>
              <li>Nächste Schritte</li>
            </ul>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      
      <!-- Record Button (FAB) -->
      <div class="record-button-container">
        <RecordButton 
          :is-recording="isRecording"
          @start="startRecording"
          @stop="stopRecording"
        />
        <div v-if="isRecording" class="timer">{{ formattedTime }}</div>
      </div>
      
      <!-- Waveform Visualizer -->
      <WaveformVisualizer v-if="isRecording" :stream="audioStream" />
      
      <!-- Actions nach Aufnahme -->
      <v-card v-if="hasRecording" class="mt-4">
        <v-card-actions>
          <v-btn @click="processRecording" color="primary">
            Verarbeiten
          </v-btn>
          <v-btn @click="retakeRecording">Neu aufnehmen</v-btn>
          <v-btn @click="deleteRecording" color="error">Löschen</v-btn>
        </v-card-actions>
      </v-card>
    </v-main>
    
    <!-- Bottom Navigation -->
    <v-bottom-navigation>
      <v-btn value="recording" to="/">
        <v-icon>mdi-microphone</v-icon>
        <span>Aufnahme</span>
      </v-btn>
      <v-btn value="history" to="/history">
        <v-icon>mdi-history</v-icon>
        <span>Historie</span>
      </v-btn>
    </v-bottom-navigation>
  </v-container>
</template>
```

**4. PreviewView:**
```vue
<template>
  <v-container>
    <v-card>
      <v-card-title>Vorschau & Bestätigung</v-card-title>
      
      <v-card-text>
        <!-- Unternehmen Autocomplete -->
        <v-autocomplete
          v-model="selectedCompanyId"
          :items="companies"
          item-title="name"
          item-value="id"
          label="Unternehmen"
          prepend-icon="mdi-office-building"
        ></v-autocomplete>
        
        <!-- Ansprechpartner Autocomplete -->
        <v-autocomplete
          v-model="selectedContactId"
          :items="filteredContacts"
          :item-title="(contact) => `${contact.firstName} ${contact.lastName}`"
          item-value="id"
          label="Ansprechpartner"
          prepend-icon="mdi-account"
        ></v-autocomplete>
        
        <!-- Markdown Editor -->
        <v-textarea
          v-model="processedText"
          label="Aufbereiteter Text"
          rows="10"
          auto-grow
        ></v-textarea>
        
        <!-- Markdown Preview -->
        <v-card variant="outlined" class="mt-4">
          <v-card-title>Vorschau</v-card-title>
          <v-card-text v-html="renderedMarkdown"></v-card-text>
        </v-card>
      </v-card-text>
      
      <v-card-actions>
        <v-btn 
          @click="sendToGitHub" 
          color="primary" 
          :loading="isSending"
          prepend-icon="mdi-send"
        >
          Senden
        </v-btn>
        <v-btn @click="discard" prepend-icon="mdi-delete">
          Verwerfen
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';

const renderedMarkdown = computed(() => marked(processedText.value));
</script>
```

**5. HistoryView:**
```vue
<template>
  <v-container>
    <v-app-bar>
      <v-app-bar-title>Historie</v-app-bar-title>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-filter</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="filterByStatus('all')">Alle</v-list-item>
          <v-list-item @click="filterByStatus('sent')">Gesendet</v-list-item>
          <v-list-item @click="filterByStatus('error')">Fehler</v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>
    
    <v-list>
      <v-list-item
        v-for="note in filteredNotes"
        :key="note.id"
      >
        <v-list-item-title>{{ note.companyName }}</v-list-item-title>
        <v-list-item-subtitle>
          {{ formatDate(note.recordedAt) }} · {{ note.contactName }}
        </v-list-item-subtitle>
        
        <template v-slot:append>
          <StatusBadge :status="note.status" />
          
          <v-btn
            v-if="note.githubIssueUrl"
            icon
            :href="note.githubIssueUrl"
            target="_blank"
          >
            <v-icon>mdi-open-in-new</v-icon>
          </v-btn>
        </template>
        
        <!-- Swipe-to-delete -->
        <template v-slot:prepend>
          <v-list-item-action start>
            <v-btn 
              icon 
              @click="deleteNote(note.id)"
              color="error"
              variant="text"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
  </v-container>
</template>
```

### Accessibility
- **ARIA-Labels:** Alle interaktiven Elemente
- **Keyboard Navigation:** Tab-Reihenfolge logisch
- **Screen-Reader:** Vuetify unterstützt ARIA nativ
- **Farbkontrast:** WCAG AA-konform (4.5:1)
- **Touch-Targets:** Min. 48x48px (Vuetify Standard)

---

## 7. Deployment & Konfiguration

### Build & Deployment

**Vite Build:**
```bash
npm run build
```
Generiert optimierte statische Files in `dist/`

**Hosting-Optionen:**

**Option A: GitHub Pages (Kostenlos)**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Option B: Netlify (Kostenlos für kleine Projekte)**
- Verbindung mit GitHub Repo
- Auto-Deploy bei Push
- HTTPS automatisch
- Custom Domain möglich

**Option C: Vercel (Kostenlos für kleine Projekte)**
- Ähnlich wie Netlify
- Bessere Performance
- Edge Functions möglich

**Option D: Self-Hosted (z.B. THM-Server)**
- HTTPS zwingend erforderlich!
- Nginx-Konfiguration:
```nginx
server {
    listen 443 ssl http2;
    server_name partner-notizen.studiumplus.de;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/partner-notizen/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Service Worker Cache-Control
    location /sw.js {
        add_header Cache-Control "no-cache";
    }
}
```

### PWA Installation

**iOS Safari:**
1. Öffne App im Safari
2. Teilen-Button → "Zum Home-Bildschirm"
3. App erscheint wie native App

**Android Chrome:**
1. Öffne App
2. Browser zeigt "Installieren"-Prompt
3. Oder: Menü → "App installieren"

**Desktop (Chrome/Edge):**
1. Adressleiste: Install-Icon
2. Oder: Menü → "App installieren"

### Environment Variables Management

**Entwicklung:**
```bash
# .env.local (gitignored)
VITE_OPENAI_API_KEY=sk-proj-...
VITE_GITHUB_REPO_OWNER=StudiumPlus-Duales-Studium-der-THM
VITE_GITHUB_REPO_NAME=studiumplus-partner-management
```

**Production (Build-Time):**
- Netlify/Vercel: Environment Variables im Dashboard
- GitHub Actions: Repository Secrets
- Self-Hosted: .env.production

**Wichtig:** OpenAI API Key NICHT im Client-Code!
- **Besser:** Backend-Proxy (z.B. Netlify Functions, Vercel Edge Functions)
- Oder: API Key vom User eingeben lassen (wie GitHub Token)

---

## 8. Zusätzliche Anforderungen

### Performance

**Ziele:**
- **First Contentful Paint (FCP):** < 1.5s
- **Time to Interactive (TTI):** < 3s
- **Lighthouse Score:** > 90 (Performance, PWA, Accessibility)

**Optimierungen:**
- Code Splitting (Vue Router lazy loading)
- Tree Shaking (Vite automatisch)
- Image Optimization (WebP, AVIF)
- Lazy Loading für nicht-kritische Components
- Service Worker Caching

**Bundle Size:**
- Ziel: < 500KB (gzipped)
- Vuetify Tree Shaking aktivieren

### Datenschutz

**DSGVO-Konformität:**
- Lokale Speicherung: Datenschutz-konform (keine Cloud)
- Audio-Blobs: Nach erfolgreicher Übertragung löschen (optional: 30 Tage behalten)
- GitHub API: Nur Issues, keine Personendaten in öffentlichen Repos
- OpenAI API: 
  - Datenverarbeitung außerhalb EU
  - Alternative: Azure OpenAI (EU-Region)
  - In Datenschutzerklärung erwähnen

**Keine Analytics/Tracking ohne Consent:**
- Cookie-Banner (wenn externe Services verwendet)
- Optional: Matomo/Plausible (privacy-friendly)

**Datenschutzerklärung:**
- In Settings verlinken
- Informiert über:
  - Lokale Speicherung (IndexedDB)
  - GitHub API Nutzung
  - OpenAI API Nutzung
  - Mikrofon-Zugriff

### Vorbereitung für nele.ai

**AI Service Abstraction:**
```typescript
// services/ai.service.ts
interface AIService {
  transcribe(audioBlob: Blob): Promise<string>;
  processText(prompt: string, text: string): Promise<string>;
}

class OpenAIService implements AIService {
  async transcribe(audioBlob: Blob) {
    // Whisper API Call
  }
  
  async processText(prompt: string, text: string) {
    // GPT API Call
  }
}

class NeleAIService implements AIService {
  async transcribe(audioBlob: Blob) {
    // nele.ai API Call
  }
  
  async processText(prompt: string, text: string) {
    // nele.ai API Call
  }
}

// Factory
export const createAIService = (): AIService => {
  const provider = import.meta.env.VITE_AI_PROVIDER || 'openai';
  return provider === 'nele' ? new NeleAIService() : new OpenAIService();
};
```

**Config-Flag:**
```typescript
// .env
VITE_AI_PROVIDER=openai # oder 'nele'
```

### Dokumentation

**README.md:**
```markdown
# StudiumPlus Partner-Notizen PWA

## Setup
```bash
npm install
cp .env.example .env.local
# .env.local mit API Keys füllen
npm run dev
```

## Build
```bash
npm run build
npm run preview # Preview des Builds
```

## Testing
```bash
npm run test        # Unit Tests
npm run test:e2e    # E2E Tests (optional)
npm run lint        # ESLint
npm run format      # Prettier
```

## Deployment
Siehe [DEPLOYMENT.md](./DEPLOYMENT.md)

## Environment Variables
- `VITE_OPENAI_API_KEY` - OpenAI API Key (optional, kann auch vom User eingegeben werden)
- `VITE_GITHUB_REPO_OWNER` - GitHub Organisation
- `VITE_GITHUB_REPO_NAME` - Repository Name
```

**Inline-Code-Kommentare:**
- JSDoc für Funktionen
- Komplexe Prompts erklären
- API-Calls dokumentieren

---

## 9. Projektphasen & Meilensteine

### Phase 1: Setup & Grundgerüst (Woche 1-2)
- Vue 3 + Vite Projekt aufsetzen
- Dependencies installieren (Vuetify, Pinia, Dexie, etc.)
- Projektstruktur erstellen
- Routing aufsetzen (Vue Router)
- Onboarding & Auth-Views (UI nur)
- PWA-Konfiguration (Manifest, Icons)

### Phase 2: Core Functionality (Woche 3-4)
- Audio-Aufnahme implementieren (MediaRecorder API)
- Waveform-Visualisierung (Canvas)
- IndexedDB Setup (Dexie)
- OpenAI Whisper Integration
- OpenAI GPT-4o-mini Integration (Matching + Aufbereitung)
- Verschlüsselung (crypto-js)

### Phase 3: GitHub Integration (Woche 5)
- GitHub API Service
- Issue-Erstellung
- companies.json von GitHub laden
- Preview-View mit Autocomplete
- Markdown-Rendering (marked.js)

### Phase 4: Offline & Service Worker (Woche 6)
- Service Worker Setup (Workbox)
- Offline-Queue Implementierung
- Background Sync API (falls unterstützt)
- Online/Offline Event Listener
- Retry-Logik mit Exponential Backoff
- Browser Notifications

### Phase 5: Historie & Settings (Woche 7)
- HistoryView mit Filtering
- Status-Badges
- Swipe-to-delete
- SettingsView
- WebAuthn Integration
- Auto-Lock Implementierung

### Phase 6: Testing & Polish (Woche 8)
- Unit Tests (Vitest)
- Component Tests (@vue/test-utils)
- E2E Tests (Playwright - optional)
- UI/UX Verbesserungen
- Bug Fixes
- Performance-Optimierung (Lighthouse)

### Phase 7: Deployment-Vorbereitung (Woche 9)
- Production Build testen
- PWA-Features validieren (Lighthouse)
- Cross-Browser Testing (iOS Safari, Android Chrome, Desktop)
- Deployment auf Hosting (Netlify/Vercel/Self-Hosted)
- Dokumentation finalisieren
- User-Testing mit Direktoren

---

## 10. Akzeptanzkriterien

Die PWA gilt als fertig, wenn:
✅ Ein Direktor kann eine Sprachnotiz im Browser aufnehmen (min. 30 Sek., max. 5 Min.)
✅ Die Notiz wird korrekt transkribiert (Whisper)
✅ Unternehmen wird intelligent vorgeschlagen (GPT Matching, >80% Genauigkeit bei klarer Nennung)
✅ Text wird professionell aufbereitet (grammatikalisch korrekt, strukturiert)
✅ GitHub Issue wird erfolgreich erstellt mit korrektem Template
✅ Offline-Aufnahmen werden automatisch synchronisiert bei Internet-Verbindung
✅ Historie zeigt alle Notizen mit korrekten Status an
✅ PWA ist via WebAuthn oder Passwort geschützt und speichert Token verschlüsselt
✅ companies.json wird von GitHub geladen und aktualisiert
✅ PWA ist auf iOS Home-Screen und Android installierbar
✅ Service Worker funktioniert (Offline-Fähigkeit)
✅ Alle kritischen Funktionen sind getestet (>80% Code Coverage)
✅ PWA läuft stabil auf iOS Safari 14+, Android Chrome 90+, Desktop Chrome/Edge/Firefox
✅ Lighthouse Score: >90 für Performance, PWA, Accessibility
✅ HTTPS ist aktiviert (Production)

---

## 11. Wichtige Hinweise für die Implementierung

1. **API-Keys niemals im Client-Code hardcoden**
   - Besser: Backend-Proxy (Netlify/Vercel Functions) für OpenAI API
   - Oder: User gibt API Key selbst ein (wie GitHub Token)
   
2. **HTTPS ist Pflicht für Production**
   - Mikrofon-Zugriff funktioniert nur über HTTPS
   - Service Worker nur über HTTPS
   - WebAuthn nur über HTTPS
   
3. **Browser-Kompatibilität prüfen:**
   ```typescript
   // Feature Detection
   if (!('mediaDevices' in navigator)) {
     alert('Ihr Browser unterstützt keine Audioaufnahme.');
   }
   
   if (!('serviceWorker' in navigator)) {
     console.warn('Service Worker nicht unterstützt');
   }
   ```

4. **Prompts sind entscheidend**
   - A/B-Testing mit verschiedenen Prompt-Varianten
   - System-Prompts separat in constants.ts pflegen

5. **IndexedDB Limits beachten:**
   - Browser-abhängig (ca. 50% freier Festplatte oder min. 10GB)
   - Audio-Blobs sind groß → nach Upload löschen
   - Quota API nutzen: `navigator.storage.estimate()`

6. **Audio-Format:**
   - Chrome/Edge: `audio/webm;codecs=opus` (beste Kompression)
   - Safari: `audio/mp4` oder `audio/wav`
   - Für Whisper API: In .mp3 konvertieren (ffmpeg.wasm - optional)

7. **PWA-Installation fördern:**
   - Install-Prompt anzeigen (beforeinstallprompt Event)
   - "Add to Home Screen"-Banner bei erstem Besuch

8. **WebAuthn ist optional:**
   - Prüfen ob Browser unterstützt: `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`
   - Fallback auf Passwort immer bereitstellen

9. **Service Worker Update-Strategie:**
   - Bei Update: User benachrichtigen
   - "Neu laden"-Button anbieten
   - `workbox-window` für Update-Handling nutzen

10. **CORS bei GitHub API:**
    - GitHub API unterstützt CORS
    - Bei Problemen: CORS-Proxy (nur Entwicklung!)
    - Production: Direkter Call ist OK

---

## 12. Beispiel-Daten für Entwicklung

### Beispiel companies.json (minimal)
```json
{
  "companies": [
    {
      "id": "comp_001",
      "name": "Viessmann Climate Solutions",
      "shortName": "Viessmann",
      "aliases": ["Viessmann", "Viessmann Group"],
      "location": "Allendorf",
      "partnershipType": "Dualer Partner",
      "studyPrograms": ["SWT-ITS", "BW-WIN"],
      "contacts": [
        {
          "id": "contact_001",
          "firstName": "Max",
          "lastName": "Mustermann",
          "role": "Ausbildungsleiter",
          "email": "max.mustermann@viessmann.com",
          "phone": "+49 6452 70-1234",
          "isPrimaryContact": true
        }
      ],
      "notes": "Langjähriger Partner seit 2015",
      "lastContactDate": "2024-11-15"
    }
  ]
}
```

### Beispiel Sprachnotiz (Test-Transkription)
```
"Heute hatte ich ein Gespräch mit Max Mustermann von Viessmann. 
Wir haben über die geplante Erhöhung der dualen Studienplätze für 
das Wintersemester 2025 gesprochen. Viessmann möchte von 8 auf 12 
Plätze aufstocken, speziell im Bereich Softwaretechnik. 
Als nächsten Schritt soll ich bis Ende Dezember ein Konzept für die 
zusätzlichen Betreuungskapazitäten erstellen. 
Termin für Folgegespräch: 15. Januar 2025."
```

### Mock-Daten für Testing
```typescript
// tests/mocks/voiceNotes.mock.ts
export const mockVoiceNote: VoiceNote = {
  id: 'note_001',
  audioBlob: new Blob(['mock audio'], { type: 'audio/webm' }),
  transcription: 'Test-Transkription...',
  processedText: '## Gesprächsnotizen\n...',
  selectedCompanyId: 'comp_001',
  selectedContactId: 'contact_001',
  recordedAt: new Date('2024-11-19'),
  status: NoteStatus.PROCESSED,
  githubIssueUrl: 'https://github.com/...'
};
```

---

## 13. Browser-Kompatibilität & Fallbacks

### Minimal Supported Versions
- **iOS Safari:** 14.3+ (WebAuthn, MediaRecorder)
- **Android Chrome:** 90+
- **Desktop Chrome:** 90+
- **Desktop Edge:** 90+
- **Desktop Firefox:** 88+
- **Desktop Safari:** 14.1+

### Feature Detection & Fallbacks
```typescript
// utils/featureDetection.ts
export const checkFeatures = () => {
  const features = {
    mediaRecorder: 'MediaRecorder' in window,
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window,
    webAuthn: 'credentials' in navigator && 
              'PublicKeyCredential' in window,
    notifications: 'Notification' in window,
    backgroundSync: 'serviceWorker' in navigator && 
                    'sync' in ServiceWorkerRegistration.prototype
  };
  
  return features;
};

// In App.vue beim Mount
const features = checkFeatures();
if (!features.mediaRecorder) {
  showError('Ihr Browser unterstützt keine Audioaufnahme.');
}
```

---

## Kontakt & Support
Bei Fragen zur Spezifikation:
- **Projektverantwortlicher:** Prof. Dr. Carsten Lucke
- **GitHub Repository:** https://github.com/StudiumPlus-Duales-Studium-der-THM/studiumplus-partner-management.git

---

## Anhang: Wichtige Web APIs

### MediaRecorder API
```typescript
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'audio/webm' });
    // Verarbeiten...
  };
  
  mediaRecorder.start();
};
```

### Web Authentication API (WebAuthn)
```typescript
// Credential Registration
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: new Uint8Array(32),
    rp: { name: "StudiumPlus" },
    user: {
      id: new Uint8Array(16),
      name: userName,
      displayName: userName
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required"
    }
  }
});

// Authentication
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: new Uint8Array(32),
    rpId: window.location.hostname,
    userVerification: "required"
  }
});
```

### Service Worker Registration
```typescript
// main.ts
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      // Update-Handling
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Zeige "Update verfügbar"-Nachricht
            showUpdateNotification();
          }
        });
      });
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  });
}
```

---

**Version:** 2.0 (Vue.js PWA)  
**Datum:** 19.11.2024  
**Status:** Final Specification - PWA Version
