#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Verwendung: ./scripts/restore-db.sh <backup-file>"
  echo "Beispiel: ./scripts/restore-db.sh backups/ketobro_20250101_030000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Datei nicht gefunden: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  ACHTUNG: Die aktuelle Datenbank wird überschrieben!"
read -p "Fortfahren? (j/N) " confirm
if [ "$confirm" != "j" ] && [ "$confirm" != "J" ]; then
  echo "Abgebrochen."
  exit 0
fi

echo "🔄 Stelle Datenbank wieder her..."
gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U ketobro ketobro

echo "✅ Datenbank wiederhergestellt aus: $BACKUP_FILE"
