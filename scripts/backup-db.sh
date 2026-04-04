#!/bin/bash
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "📦 Erstelle Datenbank-Backup..."
docker compose exec -T postgres pg_dump -U ketobro ketobro | gzip > "$BACKUP_DIR/ketobro_$DATE.sql.gz"

# Alte Backups löschen (älter als 30 Tage)
find "$BACKUP_DIR" -name "ketobro_*.sql.gz" -mtime +30 -delete

echo "✅ Backup erstellt: ketobro_$DATE.sql.gz"
echo "📁 Speicherort: $BACKUP_DIR"
