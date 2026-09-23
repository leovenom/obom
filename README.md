# OBOM Captura

A **React + Next.js** PWA to collect **evidence** (photo/video, location, license plates) of traffic incidents and visible violations. The goal is to **aggregate data** so authorities can **measure the scale** of problems that are not handled systematically today.

## Features

- **Sign-up and login** — Each submission is tied to the authenticated user
- **Minimal profile** — Name and Portuguese mobile number (contact)
- **Camera** — Capture photo or video on the phone
- **Geolocation** — GPS with address when available (metadata; not burned into the overlay)
- **Metadata** — Date/time, incident type, detected plates
- **European license plates** — PT, FR, ES, UK, DE, NL, PL, BE, CZ, Nordics, and a generic EU heuristic (5–8 characters); browser OCR + optional Python service
- **Authority report** — Structured JSON per submission (admin dashboard)

## Install

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3001`

## Production

See **[docs/DEPLOY.md](docs/DEPLOY.md)** — HTTPS, `AUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_PASSWORD`, build and run.

**Vercel:** connect **Neon (Postgres)** + **Blob**; set `POSTGRES_URL` / `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN`. Without them, the app uses local `uploads/` and `data/` (dev only).

**iPhone on the same Wi‑Fi (production build + HTTPS):**

```bash
npm run build
npm run start:mobile
```

## Google (Gmail) login

[docs/GOOGLE-OAUTH.md](docs/GOOGLE-OAUTH.md)

```bash
npm run auth:google
npm run dev:mobile
```

## Mobile usage

1. Same Wi‑Fi or HTTPS deploy
2. Allow camera and location
3. Capture → **Send** → login → profile (name + PT mobile) if needed

## Flow

```
Permissions → Camera → Review → [Send] → Login → Profile → Upload → Success + protocol
```

## Authority JSON

Each upload creates a record with media metadata and `relatorioAutoridade` (reporter, incident, aggregation objective). Admins export via `/dashboard`.

**Local dev:** `data/capturas/registros.json` and `uploads/`.  
**Vercel:** Postgres (`obom_captures`) + Blob (`captures/…`).

Example (abbreviated):

```json
{
  "protocolo": "OBOM-20260923-ABC123",
  "denunciante": { "nome": "Maria Silva", "telefone": "+351912345678", "email": "..." },
  "ocorrencia": { "tipoCodigo": "estacionamento", "localizacao": { "endereco": "...", "latitude": 38.72 } },
  "objetivo": {
    "descricao": "Medir volume e padrões de ocorrências reportadas pela população"
  }
}
```

## API

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register (email + password) |
| POST | `/api/auth/login` | Login |
| PATCH | `/api/auth/profile` | Name + PT mobile |
| POST | `/api/upload` | Upload capture (auth required) |
| GET | `/api/capturas` | User’s submissions |
| GET | `/api/capturas/:filename` | Media (owner or admin) |

## Structure

```
obom/
├── app/           # Pages + API
├── components/
├── hooks/
├── lib/           # Auth, authority report, OCR, persistence
├── data/          # Users + records (local dev)
└── uploads/       # Media files (local dev)
```

## Docs

| Document | Description |
|----------|-------------|
| [Legal analysis (Portugal)](docs/analise-legal.md) | GDPR and institutional use |
| [Business plan](docs/business-plan.md) | B2G model (reference) |
| [Design system](docs/design-system.md) | UI |

## License

MIT
