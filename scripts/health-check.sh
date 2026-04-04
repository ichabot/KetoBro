#!/bin/bash

echo "🏥 KetoBro Health Check"
echo "========================"

# Check containers
echo ""
echo "📦 Container-Status:"
docker compose ps

# Check app
echo ""
echo "🌐 App-Status:"
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
  echo "  ✅ App erreichbar (Port 3000)"
else
  echo "  ❌ App NICHT erreichbar!"
fi

# Check DB
echo ""
echo "🗄️  Datenbank-Status:"
if docker compose exec -T postgres pg_isready -U ketobro > /dev/null 2>&1; then
  echo "  ✅ PostgreSQL läuft"
else
  echo "  ❌ PostgreSQL NICHT erreichbar!"
fi

# Disk space
echo ""
echo "💾 Speicherplatz:"
df -h / | tail -1 | awk '{print "  Belegt: " $3 " / " $2 " (" $5 " genutzt)"}'

# Docker stats
echo ""
echo "📊 Ressourcen:"
docker stats --no-stream --format "  {{.Name}}: CPU {{.CPUPerc}} | RAM {{.MemUsage}}" 2>/dev/null || echo "  Keine Container laufen"

echo ""
echo "========================"
echo "✅ Health Check abgeschlossen"
