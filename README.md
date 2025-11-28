# StudiumPlus Partner-Notizen PWA

Eine Progressive Web App (PWA) für StudiumPlus-Direktoren zur Aufnahme und Verarbeitung von Gesprächsnotizen mit Partnerunternehmen.

## Funktionen

- **Sprachaufnahme**: Aufnehmen von Gesprächsnotizen mit dem Mikrofon
- **KI-Transkription**: Automatische Transkription via OpenAI Whisper
- **Textaufbereitung**: Professionelle Aufbereitung via GPT-4o-mini
- **GitHub Integration**: Automatische Erstellung von Issues im Repository
- **Offline-Fähig**: PWA mit Service Worker für Offline-Nutzung
- **Sicher**: Passwort-geschützte Authentifizierung mit verschlüsselter Datenspeicherung

## Technologie-Stack

- **Frontend**: Vue.js 3 (Composition API), TypeScript
- **UI**: Vuetify 3 (Material Design)
- **State**: Pinia
- **Storage**: IndexedDB (Dexie.js)
- **Build**: Vite
- **PWA**: vite-plugin-pwa

## Setup

### Voraussetzungen

- Node.js 18+
- npm oder yarn

### Installation

```bash
npm install
cp .env.example .env.local
# .env.local mit API Keys und GitHub Token konfigurieren
npm run dev
```

### Environment Variables

Erstellen Sie eine `.env.local` Datei mit folgenden Konfigurationen:

```bash
# OpenAI API Key
VITE_OPENAI_API_KEY=sk-...

# GitHub Token (Fine-grained PAT mit Issues: Read/Write, Contents: Read)
VITE_GITHUB_TOKEN=ghp_...

# GitHub Repository Configuration
VITE_GITHUB_REPO_OWNER=StudiumPlus-Duales-Studium-der-THM
VITE_GITHUB_REPO_NAME=studiumplus-partner-management
```

### GitHub Token erstellen

1. GitHub Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens
2. Neuen Token erstellen
3. Berechtigungen setzen:
   - **Issues**: Read and Write
   - **Contents**: Read only
4. Token in `.env.local` als `VITE_GITHUB_TOKEN` eintragen

### Build

```bash
npm run build
npm run preview
```

## PWA Installation

- **iOS**: Safari -> Teilen -> Zum Home-Bildschirm
- **Android**: Chrome -> Menü -> App installieren
- **Desktop**: Adressleiste -> Install-Icon

## Projektstruktur

```
src/
├── stores/          # Pinia State Management
├── services/        # API Services (OpenAI, GitHub, DB)
├── composables/     # Vue Composables
├── views/           # Page Components
├── types/           # TypeScript Interfaces
└── utils/           # Utilities
```

## Lizenz

MIT License
