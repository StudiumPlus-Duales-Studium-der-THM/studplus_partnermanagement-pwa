# Migration zu Backend-basierter Architektur

## Übersicht der Änderungen

Diese Migration implementiert ein sicheres Backend mit JWT-Authentifizierung und löst folgende Sicherheitsprobleme:

### Vorher (Sicherheitsprobleme):
- ❌ Jeder mit der URL kann beim ersten Aufruf die App einrichten
- ❌ API-Keys (GitHub, nele.ai) sind im Frontend-Code sichtbar
- ❌ Jeder kann API-Calls durchführen und Kosten verursachen
- ❌ Keine zentrale Benutzerverwaltung

### Nachher (Sicher):
- ✅ Nur konfigurierte Benutzer können sich anmelden
- ✅ API-Keys sind ausschließlich im Backend geschützt
- ✅ JWT-basierte Authentifizierung für alle API-Calls
- ✅ Zentrale Benutzerverwaltung via JSON-Config
- ✅ Audit-Trail über alle API-Zugriffe

## Neue Dateien

### Backend (neu erstellt)
```
backend/
├── src/
│   ├── config/
│   │   └── env.ts                    # Environment-Konfiguration
│   ├── middleware/
│   │   ├── auth.ts                   # JWT-Middleware
│   │   └── errorHandler.ts          # Error-Handling
│   ├── routes/
│   │   ├── auth.ts                   # Login-Endpoint
│   │   ├── github.ts                 # GitHub-Proxy
│   │   └── nele.ts                   # nele.ai-Proxy
│   ├── scripts/
│   │   └── generatePasswordHash.ts   # Password-Hash-Generator
│   ├── types/
│   │   └── index.ts                  # TypeScript-Typen
│   ├── utils/
│   │   ├── auth.ts                   # Auth-Utilities
│   │   └── users.ts                  # User-Management
│   └── index.ts                      # Server Entry Point
├── .env.example                      # Environment-Template
├── .gitignore
├── package.json
├── tsconfig.json
├── users.example.json                # User-Config-Template
├── setup.sh                          # Setup-Script
└── README.md                         # Backend-Dokumentation
```

### Frontend (angepasste Dateien)

**Neue Services:**
- `src/services/api.service.ts` - Axios-Client mit JWT-Handling

**Angepasste Dateien (neue Versionen mit .new Suffix):**
- `src/stores/auth.new.ts` - Backend-Auth statt lokale Auth
- `src/services/github.service.new.ts` - Nutzt Backend-API
- `src/services/nele.service.new.ts` - Nutzt Backend-API
- `src/composables/useProcessing.new.ts` - Keine API-Keys mehr
- `src/views/AuthView.new.vue` - Username + Password Login
- `src/router/index.new.ts` - Kein Onboarding mehr
- `.env.example.new` - Nur noch Backend-URL

**Entfernte Funktionalität:**
- OnboardingView (nicht mehr benötigt)
- Lokale User-Verwaltung (jetzt im Backend)
- Lokale Passwort-Validierung (jetzt im Backend)
- API-Keys im Frontend (jetzt im Backend)

## Migrations-Prozess

### 1. Migration durchführen

```bash
# Führt Migration aus und erstellt Backups
./migrate-to-backend.sh
```

Das Script:
- Sichert alte Dateien in `backup-<timestamp>/`
- Ersetzt Frontend-Dateien mit neuen Versionen
- Entfernt OnboardingView
- Aktualisiert .env.example

### 2. Backend einrichten

```bash
cd backend
./setup.sh
```

Das Script:
- Installiert Dependencies
- Erstellt .env
- Hilft bei User-Erstellung

**Manuelle Schritte:**
1. `.env` bearbeiten und API-Keys eintragen
2. `users.json` erstellen (falls nicht vom Script gemacht)

### 3. Frontend aktualisieren

```bash
# .env.local erstellen
echo 'VITE_BACKEND_URL=http://localhost:3001' > .env.local
```

### 4. Starten

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

## Benutzer-Verwaltung

### Neuen Benutzer erstellen

1. **Password-Hash generieren:**
```bash
cd backend
npm run generate-hash "DasPasswort"
```

2. **Zu users.json hinzufügen:**
```json
{
  "users": [
    {
      "id": "user1",
      "userName": "Prof. Dr. Max Mustermann",
      "passwordHash": "$2b$10$...",
      "createdAt": "2024-11-30T00:00:00.000Z"
    },
    {
      "id": "user2",
      "userName": "Prof. Dr. Anna Schmidt",
      "passwordHash": "$2b$10$...",
      "createdAt": "2024-11-30T00:00:00.000Z"
    }
  ]
}
```

3. **Backend neustarten**

## API-Endpoints

### Authentication
- `POST /api/auth/login` - Login (gibt JWT-Token zurück)

### GitHub (benötigt JWT)
- `POST /api/github/issues` - Issue erstellen
- `GET /api/github/companies` - companies.json laden

### nele.ai (benötigt JWT)
- `POST /api/nele/transcribe` - Audio transkribieren
- `POST /api/nele/chat` - Chat-Completion

## Sicherheits-Features

### Backend
- **JWT-Tokens**: 24h Gültigkeit
- **bcrypt**: Password-Hashing (10 Salting-Runden)
- **Helmet**: Security-Header
- **CORS**: Nur Frontend-URL erlaubt
- **Rate-Limiting**: (konfigurierbar)

### Frontend
- **Token-Storage**: localStorage (automatisches Refresh)
- **401-Handling**: Automatischer Logout bei ungültigem Token
- **Auth-Guards**: Router-basierte Zugriffskontrolle

## Rollback

Falls Probleme auftreten, können Sie zum alten System zurückkehren:

```bash
# Backup-Ordner finden
ls -la | grep backup-

# Dateien wiederherstellen
cp backup-<timestamp>/*.bak src/...
```

Oder nutzen Sie Git:
```bash
git checkout src/stores/auth.ts
git checkout src/services/github.service.ts
# etc.
```

## Production-Deployment

### Backend
1. Build: `cd backend && npm run build`
2. ENV-Variablen auf Server setzen
3. `users.json` auf Server kopieren
4. Start: `npm start` oder `pm2 start dist/index.js`

### Frontend
1. `.env.production` erstellen mit `VITE_BACKEND_URL=https://ihre-backend-url.com`
2. Build: `npm run build`
3. `dist/` deployen (Vercel, Netlify, etc.)

## Support

Bei Problemen:
1. Backend-Logs prüfen
2. Browser-Console prüfen
3. JWT-Token validieren
4. CORS-Konfiguration prüfen
