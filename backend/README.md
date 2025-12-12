# StudiumPlus Partner-Notizen Backend API

Backend-API für die StudiumPlus Partner-Notizen PWA mit JWT-Authentifizierung und Proxy-Endpoints für GitHub und nele.ai.

## Features

- **JWT-Authentifizierung**: Sichere Token-basierte Authentifizierung
- **User-Management**: JSON-basierte User-Konfiguration
- **GitHub-Proxy**: Sichere GitHub API-Aufrufe (Issues, Repository-Content)
- **nele.ai-Proxy**: Sichere nele.ai API-Aufrufe (Transkription, Chat)
- **Rate-Limiting**: Schutz vor Missbrauch
- **CORS**: Konfigurierbare Cross-Origin-Anfragen

## Setup

### 1. Installation

```bash
cd backend
npm install
```

### 2. Environment-Konfiguration

```bash
cp .env.example .env
```

Bearbeiten Sie `.env` mit Ihren Konfigurationen:

```bash
# Server
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# APIs
NELE_AI_API_KEY=your-nele-api-key
GITHUB_TOKEN=ghp_your_github_token

# CORS
FRONTEND_URL=http://localhost:5173
```

### 3. User-Konfiguration erstellen

#### Schritt 1: Password-Hash generieren

```bash
npm run generate-hash "MeinSicheresPasswort123"
```

Kopieren Sie den generierten Hash.

#### Schritt 2: users.json erstellen

```bash
cp users.example.json users.json
```

Bearbeiten Sie `users.json`:

```json
{
  "users": [
    {
      "id": "user1",
      "userName": "Prof. Dr. Max Mustermann",
      "passwordHash": "$2b$10$... (hier den kopierten Hash einfügen)",
      "createdAt": "2024-11-30T00:00:00.000Z"
    }
  ]
}
```

### 4. Server starten

#### Development

```bash
npm run dev
```

#### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

#### POST `/api/auth/login`

Login mit Username und Passwort.

**Request:**
```json
{
  "userName": "Prof. Dr. Max Mustermann",
  "password": "MeinSicheresPasswort123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userName": "Prof. Dr. Max Mustermann"
}
```

### GitHub API (Authentifizierung erforderlich)

Alle Requests benötigen Header: `Authorization: Bearer <token>`

#### POST `/api/github/issues`

Erstellt ein GitHub Issue.

#### GET `/api/github/companies`

Lädt companies.json aus dem Repository.

### nele.ai API (Authentifizierung erforderlich)

#### POST `/api/nele/transcribe`

Transkribiert Audio.

#### POST `/api/nele/chat`

Chat-Completion via nele.ai.

## Security

- **JWT-Tokens**: 24h Gültigkeit (konfigurierbar)
- **bcrypt**: Password-Hashing mit 10 Salting-Runden
- **Helmet**: Security-Header
- **CORS**: Nur konfigurierte Origins erlaubt
- **Rate-Limiting**: Schutz vor Brute-Force

## User-Management

Zum Hinzufügen weiterer User:

1. Hash generieren: `npm run generate-hash "neuesPasswort"`
2. User zu `users.json` hinzufügen
3. Server neustarten (lädt Config beim Start)

## Deployment

### Umgebungsvariablen setzen

Stellen Sie sicher, dass alle benötigten ENV-Variablen gesetzt sind:

- `JWT_SECRET`
- `NELE_AI_API_KEY`
- `GITHUB_TOKEN`
- `FRONTEND_URL`

### Process Manager (PM2)

```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name partner-notizen-api
```

## Troubleshooting

**Server startet nicht:**
- Prüfen Sie `.env` Datei
- Prüfen Sie `users.json` Format

**Login funktioniert nicht:**
- Überprüfen Sie Username (Case-sensitive!)
- Generieren Sie neuen Password-Hash

**API-Fehler:**
- Prüfen Sie Backend-Logs
- Validieren Sie JWT-Token
