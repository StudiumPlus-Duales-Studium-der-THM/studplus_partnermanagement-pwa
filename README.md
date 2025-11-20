# StudiumPlus Partner-Notizen PWA

Eine Progressive Web App (PWA) für StudiumPlus-Direktoren zur Aufnahme und Verarbeitung von Gesprächsnotizen mit Partnerunternehmen.

## Funktionen

- **Sprachaufnahme**: Aufnehmen von Gesprächsnotizen mit dem Mikrofon
- **KI-Transkription**: Automatische Transkription via OpenAI Whisper
- **Textaufbereitung**: Professionelle Aufbereitung via GPT-4o-mini
- **GitHub Integration**: Automatische Erstellung von Issues im Repository
- **Offline-Fähig**: PWA mit Service Worker für Offline-Nutzung
- **Sicher**: WebAuthn-Authentifizierung und verschlüsselte Datenspeicherung

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
# .env.local mit API Keys füllen
npm run dev
```

### Environment Variables

```bash
VITE_OPENAI_API_KEY=sk-...
VITE_GITHUB_REPO_OWNER=StudiumPlus-Duales-Studium-der-THM
VITE_GITHUB_REPO_NAME=studiumplus-partner-management
```

### Build

```bash
npm run build
npm run preview
```

## GitHub Token

1. GitHub Settings -> Developer settings -> Personal access tokens
2. Fine-grained PAT erstellen
3. Berechtigungen: Issues (Read/Write), Contents (Read)

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
