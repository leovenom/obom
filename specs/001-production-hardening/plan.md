# Implementation Plan: Production Hardening (Minimum)

**Branch**: `001-production-hardening` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-production-hardening/spec.md`

## Summary

Close production gaps for OBOM without UX changes: verify and tighten capture media authorization
(already largely implemented), document environment and deploy steps for operators, and provide a
repeatable verification guide. Most security logic exists in `app/api/capturas/[filename]/route.ts`,
`lib/upload-files.ts`, `app/api/upload/route.ts`, and `app/api/admin/*`; this plan focuses on
gaps (early filename validation, `.env.example`, `docs/DEPLOY.md`, README link) and regression
checks per [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: TypeScript 5.x, Node 18+  
**Primary Dependencies**: Next.js 15 (App Router), NextAuth/Auth.js, React 19 PWA  
**Storage**: Local filesystem — `uploads/`, JSON registry `data/capturas/registros.json`, `data/users.json`  
**Testing**: Manual/curl per quickstart; `npm run build`, `npx tsc --noEmit` (no unit test framework yet)  
**Target Platform**: HTTPS web (mobile Safari/Chrome priority); production on VPS or persistent Node host  
**Project Type**: Web application (single Next.js repo)  
**Performance Goals**: N/A for hardening (no new hot paths)  
**Constraints**: No capture UX/copy changes; no S3/DB migration in this feature; constitution v1.0.0  
**Scale/Scope**: Single-tenant deploy; optional Python plate service on port 5050

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Fluxo de captura preservado | PASS | Plan limits changes to API + docs |
| II. Stack e estrutura | PASS | Edits in `app/api`, `lib`, `docs`, `.env.example` only |
| III. Segurança e acesso | PASS | Feature goal aligns; media auth reinforced |
| IV. Privacidade de localização | PASS | No overlay/metadata changes |
| V. Qualidade mínima | PASS | quickstart includes build + tsc |

**Post-design re-check**: PASS — no violations; Complexity Tracking table empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-production-hardening/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1 validation
├── contracts/           # Phase 1 API contracts
│   ├── media-access.md
│   └── upload-and-admin.md
└── tasks.md             # /speckit-tasks (next)
```

### Source Code (repository root — touch surface)

```text
app/api/capturas/[filename]/route.ts   # Media auth (verify / early validate)
lib/upload-files.ts                    # Safe filename helper (reuse)
.env.example                           # Mandatory env documentation
docs/DEPLOY.md                         # New deploy checklist (preferred)
README.md                              # Link to DEPLOY + production note
```

**Structure Decision**: Single Next.js app at repo root; no new packages or services.

## Implementation Phases (for /speckit-tasks)

### Phase A — Verify & harden media access (P1)

1. Confirm `GET /api/capturas/[filename]` returns 401 for anonymous requests (post-build restart).
2. Call `resolveUploadPath` (or equivalent) on `filename` **before** registry lookup; return 400/401
   for invalid basenames.
3. Ensure `readUploadFile` never receives unvalidated input (single code path).
4. Optional: add minimal comment in route pointing to [contracts/media-access.md](./contracts/media-access.md).

### Phase B — Environment template (P2)

1. Expand `.env.example`: mark **Required in production** vs optional; include `NEXTAUTH_SECRET`
   alias note, commission vars, `PORT`, plate service URL if documented elsewhere.
2. Cross-link `docs/GOOGLE-OAUTH.md` for OAuth setup.
3. Explicit warning: do not commit `.env`; rotate `ADMIN_PASSWORD` from any sample.

### Phase C — Deploy documentation (P2)

1. Create `docs/DEPLOY.md` with:
   - HTTPS requirement (camera/GPS)
   - `NEXTAUTH_URL` = public origin
   - Google redirect URI pattern
   - `npm run build && npm run start` (or host-specific)
   - Optional `npm run plates:dev` / production plate service
   - **Risks**: ephemeral disk, default admin password → VPS recommendation
2. Add short pointer in README under new "Produção" section.

### Phase D — Regression verification (P3)

1. Run [quickstart.md](./quickstart.md) end-to-end.
2. One manual capture walkthrough (UX unchanged).
3. Fix only defects found; no scope creep.

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Generated Artifacts (Phase 0–1)

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| Contracts | [contracts/](./contracts/) |
| Quickstart | [quickstart.md](./quickstart.md) |

**Next command**: `/speckit-tasks` to produce dependency-ordered `tasks.md`, then `/speckit-implement`.
