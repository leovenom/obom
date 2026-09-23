<!--
Sync Impact Report
- Version change: (template placeholders) → 1.0.0
- Modified principles: all placeholders replaced with OBOM-specific governance
- Added sections: Security & Privacy, Development Workflow (filled)
- Removed sections: none
- Deferred TODOs: none
-->

# OBOM Constitution

## Core Principles

### I. Fluxo de captura preservado

O fluxo permissions → câmera → revisão → auth/perfil (quando necessário) → envio → sucesso
MUST remain intact unless a spec explicitly documents a breaking UX change and migration.

**Rationale:** Users and field workflows depend on a stable capture path; silent flow changes
cause lost submissions and support burden.

### II. Stack e estrutura

Implementation MUST stay on Next.js App Router, TypeScript, React components in `components/`,
hooks in `hooks/`, and route handlers in `app/api/`. New code MUST match existing naming,
imports, and patterns in adjacent files.

**Rationale:** Consistency reduces review cost and avoids parallel architectures in one repo.

### III. Segurança e acesso

Sensitive routes MUST enforce authentication. Secrets MUST NOT be committed (`.env` stays
ignored). Admin dashboard and capture media MUST NOT be world-readable. Media filenames MUST
be validated against path traversal. Production MUST use strong `ADMIN_PASSWORD` and
`AUTH_SECRET`.

**Rationale:** The app handles personal media, location metadata, and identity data.

### IV. Privacidade de localização

Full address and coordinates belong in metadata, JSON, and admin views—not burned into
capture overlays unless a future spec explicitly requires it. UI MUST NOT expose crude IP
fallback messaging to end users.

**Rationale:** Location is sensitive; presentation should match user expectations and prior
product decisions.

### V. Qualidade mínima verificável

Before treating work as done, `npm run build` and `npx tsc --noEmit` MUST pass. Changes MUST
be the smallest correct diff. User-facing copy MUST be European Portuguese.

**Rationale:** The project ships as a PWA with no automated test suite yet; build/type gates
and scope discipline are the baseline quality bar.

## Security & Privacy Requirements

- HTTPS is required for camera and geolocation on mobile browsers; dev uses documented
  `dev:mobile` / certificate trust flows.
- Upload endpoints MUST reject unauthenticated submissions.
- Authority JSON and dashboard data are admin-facing; access controls MUST be preserved when
  adding features.
- Storage today is local (`uploads/`, `data/capturas/`); any move to object storage or DB MUST
  include a spec with migration and rollback notes.

## Development Workflow

- Spec Kit SDD: constitution once per project; per feature use specify → (clarify) → plan →
  tasks → (analyze) → implement → converge.
- Do not drive large refactors or deployment changes through constitution updates—use
  `/speckit-specify` instead.
- Optional plate service (Python, port 5050) MAY be offline; browser OCR fallback MUST remain
  functional for capture flows.
- Auth MUST support email/password and Google (NextAuth) where configured; incomplete profiles
  MUST block send until required fields are satisfied per existing `profileComplete` rules.

## Governance

This constitution supersedes ad-hoc agent instructions for OBOM when they conflict. Amendments
require updating this file, bumping `CONSTITUTION_VERSION` semantically, and setting
`LAST_AMENDED_DATE`. MAJOR bumps remove or redefine non-negotiable rules; MINOR adds principles
or material guidance; PATCH clarifies wording only.

Compliance: every `/speckit-plan` and `/speckit-implement` cycle MUST be checked against these
principles. Justify exceptions in the feature spec or plan.

**Version**: 1.0.0 | **Ratified**: 2026-09-23 | **Last Amended**: 2026-09-23
