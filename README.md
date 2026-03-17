# 🏥 AfyaLink - Chronic Disease Monitoring Platform

A two-sided health platform connecting patients and clinicians for real-time chronic disease monitoring.

## Monorepo Structure

```
chronic-disease-platform/
├── backend/         # Go + Gin REST API (port 8080)
├── dashboard/       # Next.js Doctor Dashboard (port 3000)
├── patient-app/     # Expo React Native Patient App (port 8081)
└── docs/            # API reference
```

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Go | 1.21+ | https://go.dev/dl/ |
| Node.js | 20+ | https://nodejs.org |
| npm | 10+ | Bundled with Node.js |

## Quick Start

### 1. Backend

```bash
cd backend
go mod tidy
go run main.go
# Server starts at http://localhost:8080
# SQLite DB auto-created as chronic.db
```

### 2. Doctor Dashboard

```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:3000
# Demo login: doctor@hospital.com / password123
```

### 3. Patient App (Expo Web)

```bash
cd patient-app
npm install
npx expo start --web
# Open http://localhost:8081
# Demo login: phone 0712345678 / pin 1234
```

## Environment Variables

Copy `.env.example` to `.env` in each directory and configure:

```bash
cp backend/.env.example backend/.env
cp dashboard/.env.example dashboard/.env
cp patient-app/.env.example patient-app/.env
```

## Alert Thresholds (MVP)

| Condition | Metric | Warning | Critical |
|-----------|--------|---------|---------|
| Hypertension | Systolic BP | > 140 | > 160 |
| Hypertension | Diastolic BP | > 90 | > 100 |
| Diabetes | Blood Glucose | > 7 mmol/L | > 10 mmol/L |

## SMS / Africa's Talking

Set `AT_API_KEY` and `AT_USERNAME` in `backend/.env` to enable real SMS notifications. Without these, notifications are logged to console.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system architecture diagram.
