#!/bin/bash
set -e

echo "🚀 KetoBro Deployment..."

# Pull latest changes (if git)
if [ -d ".git" ]; then
  echo "📥 Ziehe neueste Änderungen..."
  git pull
fi

# Build and restart
echo "🐳 Baue und starte Container..."
docker compose down
docker compose up -d --build

# Wait for healthy
echo "⏳ Warte auf Datenbank..."
sleep 10

# Run migrations
echo "🗄️  Führe Migrations aus..."
docker compose exec -T app npx prisma migrate deploy || true

echo "✅ Deployment abgeschlossen!"
echo "🌐 KetoBro läuft auf Port 3000"
