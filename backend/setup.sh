#!/bin/bash

echo "================================================"
echo "Backend Setup für Partner-Notizen PWA"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ist nicht installiert!"
    echo "   Bitte installieren Sie Node.js 18+ von https://nodejs.org"
    exit 1
fi

echo "✓ Node.js $(node --version) gefunden"
echo ""

# Install dependencies
echo "Installiere Dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install fehlgeschlagen"
    exit 1
fi

echo "✓ Dependencies installiert"
echo ""

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Erstelle .env Datei..."
    cp .env.example .env
    echo "✓ .env Datei erstellt"
    echo "⚠️  WICHTIG: Bitte bearbeiten Sie .env und setzen Sie:"
    echo "   - JWT_SECRET (starkes, zufälliges Secret!)"
    echo "   - NELE_AI_API_KEY"
    echo "   - GITHUB_TOKEN"
    echo ""
else
    echo "✓ .env bereits vorhanden"
    echo ""
fi

# Check if users.json exists
if [ ! -f "users.json" ]; then
    echo "⚠️  users.json nicht gefunden"
    echo ""
    echo "Möchten Sie einen Beispiel-Benutzer erstellen? (j/n)"
    read -r response

    if [[ "$response" =~ ^[Jj]$ ]]; then
        echo ""
        echo "Bitte geben Sie einen Benutzernamen ein:"
        read -r username

        echo "Bitte geben Sie ein Passwort ein:"
        read -rs password
        echo ""

        echo "Generiere Password-Hash..."
        hash=$(npm run generate-hash "$password" 2>&1 | grep "^\$2b\$" | tail -1)

        if [ -z "$hash" ]; then
            echo "❌ Hash-Generierung fehlgeschlagen"
            echo "   Bitte führen Sie manuell aus: npm run generate-hash \"IhrPasswort\""
            exit 1
        fi

        echo "Erstelle users.json..."
        cat > users.json <<EOF
{
  "users": [
    {
      "id": "user1",
      "userName": "$username",
      "passwordHash": "$hash",
      "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
    }
  ]
}
EOF

        echo "✓ users.json erstellt mit Benutzer: $username"
    else
        echo ""
        echo "Bitte erstellen Sie users.json manuell:"
        echo "1. npm run generate-hash \"IhrPasswort\""
        echo "2. cp users.example.json users.json"
        echo "3. users.json bearbeiten und Hash einfügen"
    fi
else
    echo "✓ users.json bereits vorhanden"
fi

echo ""
echo "================================================"
echo "Setup abgeschlossen!"
echo "================================================"
echo ""
echo "Nächste Schritte:"
echo ""
echo "1. .env bearbeiten und API-Keys eintragen:"
echo "   nano .env"
echo ""
echo "2. Backend starten:"
echo "   npm run dev"
echo ""
echo "3. Backend läuft dann auf http://localhost:3001"
echo ""
echo "================================================"
