# 🥑 KetoBro - KI-gestützter Keto-Ernährungsassistent

KetoBro ist eine Next.js-Webanwendung, die Menschen auf ihrem ketogenen Ernährungsweg begleitet. Mit KI-Integration (Claude), umfassendem Tracking und personalisierten Berechnungen hilft KetoBro, die Keto-Ziele zu erreichen.

## ✨ Features

- **📊 Dashboard** — Gewichtsverlauf, Körpermaße, Makronährstoff-Verteilung (Kreisdiagramme), Ketose-Status, Skaldeman Ratio
- **🤖 KI-Assistent** — Claude AI Chat mit Zugriff auf alle User-Daten, personalisiertes Keto-Coaching auf Deutsch
- **📈 Tracking** — Körpermaße (Gewicht, Bauch-, Bein-, Armumfang), Vitalwerte (Blutdruck, Blutzucker, Ketone), Ernährungsdaten (Makros)
- **🧮 Berechnungen** — BMR (Mifflin-St Jeor), TDEE, Netto-Carbs, Skaldeman Ratio, Ketose-Status
- **🔐 Auth** — Email/Passwort mit NextAuth.js, bcrypt-Hashing

## 🛠️ Tech Stack

| Bereich | Technologie |
|---------|------------|
| Frontend & Backend | Next.js 16 (App Router, TypeScript) |
| Datenbank | PostgreSQL 16 |
| ORM | Prisma 6 |
| KI | Anthropic Claude API |
| Auth | NextAuth.js (Credentials) |
| UI | Tailwind CSS, shadcn/ui-Style |
| Charts | Recharts |
| Deployment | Docker, Docker Compose, Caddy |

## 🚀 Schnellstart

### Voraussetzungen
- Docker & Docker Compose

### 1. Repository klonen
```bash
git clone https://github.com/ichabot/KetoBro.git
cd KetoBro
```

### 2. Environment konfigurieren
```bash
cp .env.example .env.production
# Bearbeite .env.production mit deinen Werten:
# - POSTGRES_PASSWORD (sicheres Passwort generieren)
# - NEXTAUTH_SECRET (openssl rand -base64 32)
# - ANTHROPIC_API_KEY (dein Claude API Key)
# - NEXTAUTH_URL (deine Domain)
```

### 3. Starten
```bash
docker compose --env-file .env.production up -d --build
```

Die App läuft auf Port 3000. Für HTTPS empfehlen wir Caddy als Reverse Proxy.

## 📁 Projektstruktur

```
KetoBro/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API Routes (auth, chat, dashboard, measurements, nutrition, profile, vitals)
│   │   ├── chat/             # KetoBro Chat
│   │   ├── dashboard/        # Dashboard mit Charts
│   │   ├── login/            # Login
│   │   ├── profile/          # Profil
│   │   ├── register/         # Registrierung
│   │   └── track/            # Daten erfassen
│   ├── components/           # React Komponenten
│   │   ├── dashboard/        # Chart-Komponenten
│   │   └── ui/               # UI Primitives (Button, Card, Input, etc.)
│   └── lib/                  # Utilities
│       ├── auth.ts           # NextAuth Config
│       ├── calculations.ts   # Keto-Berechnungen
│       ├── claude.ts         # Claude AI Integration
│       ├── prisma.ts         # Prisma Client
│       └── utils.ts          # Helpers
├── prisma/
│   └── schema.prisma         # Datenbankschema
├── scripts/                  # Deployment & Wartung
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## 🧮 Keto-Berechnungen

- **Netto-Carbs** = Kohlenhydrate - Ballaststoffe (Europa-Standard)
- **Skaldeman Ratio** = Fett(g) / (Protein(g) + Netto-Carbs(g)) — optimal: 1.0-2.0
- **Ketose-Status**: ≤20g = Tiefe Ketose 🟢 | ≤30g = Ketose 🟡 | ≤50g = Grenzbereich 🟠 | >50g = Keine Ketose 🔴
- **BMR** (Mifflin-St Jeor): 10×Gewicht + 6.25×Größe - 5×Alter ± Geschlecht
- **TDEE** = BMR × Aktivitätsfaktor (1.2 bis 1.9)

## 🔧 Scripts

```bash
./scripts/backup-db.sh              # Datenbank-Backup
./scripts/restore-db.sh <file>      # Datenbank wiederherstellen
./scripts/deploy.sh                 # Update & Deployment
./scripts/health-check.sh           # System Health Check
```

## 📄 Lizenz

MIT

---

# 🥑 KetoBro - AI-Powered Keto Nutrition Assistant (English)

KetoBro is a Next.js web application that supports people on their ketogenic nutrition journey. With AI integration (Claude), comprehensive tracking, and personalized calculations, KetoBro helps achieve keto goals.

## ✨ Features

- **📊 Dashboard** — Weight history, body measurements, macronutrient distribution (pie charts), ketosis status, Skaldeman ratio
- **🤖 AI Assistant** — Claude AI chat with access to all user data, personalized keto coaching in German
- **📈 Tracking** — Body measurements (weight, waist, thigh, arm), vitals (blood pressure, blood sugar, ketones), nutrition data (macros)
- **🧮 Calculations** — BMR (Mifflin-St Jeor), TDEE, net carbs, Skaldeman ratio, ketosis status
- **🔐 Auth** — Email/password with NextAuth.js, bcrypt hashing

## 🚀 Quick Start

```bash
git clone https://github.com/ichabot/KetoBro.git
cd KetoBro
cp .env.example .env.production
# Edit .env.production with your values
docker compose --env-file .env.production up -d --build
```

The app runs on port 3000. Use Caddy or Nginx as reverse proxy for HTTPS.

## Tech Stack

Next.js 16 (TypeScript) | PostgreSQL 16 | Prisma 6 | Anthropic Claude API | NextAuth.js | Tailwind CSS | Recharts | Docker

---

**Made with 🥑 and ❤️**
