# smART IVF — Next.js + Node.js Revamp

Modern rewrite of the legacy ASP.NET `smart` IVF clinic system (`Desktop/ivf/smart`).

## Structure

```
ivf_ng/
├── ivf-next/   → Next.js 15 + React 19 + Tailwind (trending UI)
└── ivf-api/    → Express API calling SQL Server stored procedures
```

## Features

- **Trending login** — split hero + glass sign-in card
- **Trending dashboard** — KPI bento, quick actions, patient snapshot (SP-backed)
- **Left sidebar + top menu** — mirrors legacy Master / Clinical / Cryo / Report structure
- **Clinical modules** — IUI, Cycle, IVF, ICSI, ET, BT
- **Masters** — common masters by CatID, patient/doctor/satellite/user
- **Consent Form Book** — case-category presets + form checklist
- **Reports / Cryo / SMS / Role** — SP-driven shells via module registry
- **Auth** — `spUserLogin` when DB is configured; demo fallback `admin / admin123`

## Quick Start

### 1. API

```bash
cd ivf-api
cp .env.example .env
# Edit DB_* from Web.config connectionStrings name="ConsmArt"
npm install
npm run dev
```

API: **http://localhost:3000**

### 2. Frontend

```bash
cd ivf-next
cp .env.example .env.local
npm install
npm run dev
```

App: **http://localhost:3001**

## Demo Login

| Username | Password  |
|----------|-----------|
| sachin@gmail.com    | sachin  |
| doctor   | doctor123 |

When `DB_*` is set, production users authenticate via **`spUserLogin`**.

## Key APIs

| Route | Purpose |
|-------|---------|
| `POST /api/auth/login` | `spUserLogin` |
| `GET /api/dashboard/summary` | Clinic KPIs + `spCycOutComeExtDRL` / `spIUIOutComeExtDRL` |
| `GET /api/consent/*` | Presets, forms, patient context |
| `POST /api/sp/drl` | Generic SP executor (legacy DAL pattern) |
| `/api/patients`, `/api/cycles`, `/api/iui`, `/api/ivf`, `/api/icsi`, `/api/et`, `/api/bt`, `/api/masters` | Module APIs |

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind |
| API | Express 5, JWT, `mssql` stored procedures |
| Legacy source | ASP.NET WebForms `ivf/smart` |
