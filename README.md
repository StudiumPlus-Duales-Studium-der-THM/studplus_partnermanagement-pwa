# StudiumPlus Partner-Notizen PWA

Eine Progressive Web App (PWA) mit Backend-API für StudiumPlus-Direktoren zur Aufnahme und Verarbeitung von Gesprächsnotizen mit Partnerunternehmen.

## Architektur

```
┌─────────────────┐      ┌─────────────────┐      ┌──────────────────┐
│   Frontend      │ ───► │   Backend API   │ ───► │  GitHub          │
│   (Vue PWA)     │      │   (Express)     │      │  nele.ai         │
│                 │      │   JWT Auth      │      │                  │
└─────────────────┘      └─────────────────┘      └──────────────────┘
```

**Sicherheitskonzept:**
- ✅ JWT-basierte Authentifizierung
- ✅ API-Keys nur im Backend (nicht öffentlich)
- ✅ User-Management via JSON-Config
- ✅ Sichere Proxy-Endpoints für alle externen APIs

## Funktionen

- **Sprachaufnahme**: Aufnehmen von Gesprächsnotizen mit dem Mikrofon
- **KI-Transkription**: Automatische Transkription via nele.ai (azure-whisper)
- **Textaufbereitung**: Professionelle Aufbereitung via nele.ai (azure-gpt-4o-mini)
- **GitHub Integration**: Automatische Erstellung von Issues im Repository
- **Offline-Fähig**: PWA mit Service Worker für Offline-Nutzung
- **Sicher**: JWT-Authentifizierung, Backend-geschützte API-Keys

## Technologie-Stack

### Frontend
- **Framework**: Vue.js 3 (Composition API), TypeScript
- **UI**: Vuetify 3 (Material Design)
- **State**: Pinia
- **Storage**: IndexedDB (Dexie.js)
- **Build**: Vite
- **PWA**: vite-plugin-pwa

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Auth**: JWT (jsonwebtoken)
- **Security**: bcrypt, helmet, CORS

## Setup

### 1. Backend einrichten

#### Installation

```bash
cd backend
npm install
```

#### Environment-Konfiguration

```bash
cp .env.example .env
```

Bearbeiten Sie `backend/.env`:

```bash
# Server
PORT=3001
JWT_SECRET=IhrSuperSicheresSecretHier

# APIs
NELE_AI_API_KEY=your-nele-api-key
GITHUB_TOKEN=ghp_your_github_token

# CORS
FRONTEND_URL=http://localhost:5173
```

#### Benutzer erstellen

1. Password-Hash generieren:

```bash
cd backend
npm run generate-hash "MeinSicheresPasswort123"
```

2. User-Konfiguration erstellen:

```bash
cp users.example.json users.json
```

3. `users.json` bearbeiten und Hash einfügen:

```json
{
  "users": [
    {
      "id": "user1",
      "userName": "Prof. Dr. Max Mustermann",
      "passwordHash": "$2b$10$... (hier den Hash einfügen)",
      "createdAt": "2024-11-30T00:00:00.000Z"
    }
  ]
}
```

#### Backend starten

```bash
npm run dev
```

Der Backend-Server läuft nun auf `http://localhost:3001`.

### 2. Frontend einrichten

#### Installation

```bash
npm install
```

#### Environment-Konfiguration

```bash
cp .env.example .env.local
```

Bearbeiten Sie `.env.local`:

```bash
VITE_BACKEND_URL=http://localhost:3001
```

#### Frontend starten

```bash
npm run dev
```

Die App ist nun verfügbar auf `http://localhost:5173`.

### 3. Erste Schritte

1. Öffnen Sie `http://localhost:5173`
2. Melden Sie sich mit Ihrem konfigurierten Benutzernamen und Passwort an
3. Die App ist nun einsatzbereit!

## Deployment

### Backend (Production)

1. **Build erstellen:**

```bash
cd backend
npm run build
```

2. **Umgebungsvariablen setzen:**

Stellen Sie sicher, dass folgende ENV-Variablen auf dem Server gesetzt sind:
- `PORT`
- `JWT_SECRET` (starkes, einzigartiges Secret!)
- `NELE_AI_API_KEY`
- `GITHUB_TOKEN`
- `FRONTEND_URL` (Ihre Frontend-URL)

3. **Server starten:**

```bash
npm start
```

Oder mit PM2:

```bash
pm2 start dist/index.js --name partner-notizen-api
```

### Frontend (Production)

1. **Build erstellen:**

```bash
npm run build
```

2. **Umgebungsvariable setzen:**

Erstellen Sie `.env.production`:

```bash
VITE_BACKEND_URL=https://ihre-backend-url.com
```

3. **Deployen:**

Der `dist/` Ordner kann auf jedem statischen Hosting-Service deployed werden:
- Vercel
- Netlify
- GitHub Pages
- etc.

## Sicherheit

### Backend-Sicherheitsfeatures

- **JWT-Tokens**: 24h Gültigkeit (konfigurierbar via `JWT_EXPIRES_IN`)
- **bcrypt**: Password-Hashing mit 10 Salting-Runden
- **Helmet**: Security-Header
- **CORS**: Nur konfigurierte Origins erlaubt
- **API-Keys**: Niemals im Frontend, nur im Backend

### Best Practices

1. **JWT_SECRET**: Verwenden Sie ein starkes, zufälliges Secret
2. **HTTPS**: Nutzen Sie immer HTTPS in Production
3. **User-Management**: Regelmäßiges Passwort-Update empfohlen
4. **Backups**: Sichern Sie `users.json` regelmäßig

## Benutzer-Verwaltung

### Neuen Benutzer hinzufügen

1. Hash generieren: `npm run generate-hash "passwort"`
2. User zu `backend/users.json` hinzufügen
3. Backend neustarten

### Passwort ändern

1. Neuen Hash generieren: `npm run generate-hash "neues-passwort"`
2. Hash in `backend/users.json` aktualisieren
3. Backend neustarten

## PWA Installation

- **iOS**: Safari → Teilen → Zum Home-Bildschirm
- **Android**: Chrome → Menü → App installieren
- **Desktop**: Adressleiste → Install-Icon

## Projektstruktur

```
.
├── backend/                 # Backend-API
│   ├── src/
│   │   ├── config/         # Konfiguration
│   │   ├── middleware/     # Express Middleware
│   │   ├── routes/         # API Routes
│   │   ├── types/          # TypeScript Types
│   │   ├── utils/          # Utilities
│   │   └── index.ts        # Server Entry Point
│   ├── users.json          # User-Konfiguration (nicht in Git!)
│   └── package.json
│
├── src/                    # Frontend
│   ├── stores/            # Pinia State Management
│   ├── services/          # API Services
│   ├── composables/       # Vue Composables
│   ├── views/             # Page Components
│   ├── types/             # TypeScript Interfaces
│   └── utils/             # Utilities
│
└── README.md              # Diese Datei
```

## Troubleshooting

### Backend

**Server startet nicht:**
- Prüfen Sie `.env` Datei
- Prüfen Sie `users.json` Format
- Überprüfen Sie Port-Verfügbarkeit

**Login funktioniert nicht:**
- Username ist case-sensitive!
- Hash korrekt generiert?
- Backend-Logs prüfen

### Frontend

**"Failed to fetch":**
- Backend läuft?
- `VITE_BACKEND_URL` korrekt gesetzt?
- CORS-Konfiguration prüfen

**401 Unauthorized:**
- Token abgelaufen → Neu anmelden
- JWT_SECRET im Backend geändert?

## Migration von alter Version

Falls Sie von der alten Version (ohne Backend) migrieren:

```bash
chmod +x migrate-to-backend.sh
./migrate-to-backend.sh
```

Das Script erstellt ein Backup und führt die Migration durch.

## Lizenz

MIT License
