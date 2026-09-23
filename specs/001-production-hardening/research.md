# Research: Production Hardening (Minimum)

**Feature**: `001-production-hardening`  
**Date**: 2026-09-23

## R1 — Media access control pattern

**Decision**: Keep registry lookup + session check + `resolveUploadPath` before disk read (existing
stack).

**Rationale**: `app/api/capturas/[filename]/route.ts` already requires admin or owner;
`lib/upload-files.ts` enforces `captura-<digits>.<ext>` and blocks path escape. Minimal diff aligns
with constitution (smallest correct change).

**Alternatives considered**:

- Signed URLs with TTL — rejected (new UX/API surface, out of scope).
- Moving media behind a single POST body endpoint — rejected (breaks dashboard `<img src>` usage).

## R2 — Filename validation ordering

**Decision**: Reject invalid filenames (traversal / pattern mismatch) before registry lookup where
practical, returning 400 or 401 consistently without reading disk.

**Rationale**: Avoids ambiguous 404 vs 401 for malicious probes; satisfies FR-004 acceptance tests.

**Alternatives considered**:

- Always 404 — rejected (information leakage debate; spec prefers deny without filesystem escape).

## R3 — Production secrets and NextAuth URL

**Decision**: Document `AUTH_SECRET` (or `NEXTAUTH_SECRET`) as mandatory in production;
`NEXTAUTH_URL` MUST match the public HTTPS origin; `getAuthSecret()` already throws in production
when missing.

**Rationale**: Matches Auth.js requirements and pre-production review findings.

**Alternatives considered**:

- Runtime auto-detect URL from headers — rejected (host header spoofing risk in some deployments).

## R4 — Admin password defaults

**Decision**: Document that `ADMIN_PASSWORD` MUST be changed from any sample value; optional
startup warning in production if password matches a known weak default (implementation task, not
blocking if docs are clear).

**Rationale**: Constitution requires strong admin password; code already uses `timingSafeEqual`.

**Alternatives considered**:

- Force random password on boot — rejected (breaks operator deploy flow without secret manager).

## R5 — Deployment target and storage

**Decision**: Primary target = VPS or persistent Node host with `uploads/` and `data/capturas/`;
document serverless/ephemeral limitations without S3 migration in this feature.

**Rationale**: Spec explicitly excludes object-storage migration unless trivial; local FS is current
architecture.

**Alternatives considered**:

- Vercel Blob in this feature — rejected (scope creep).

## R6 — Verification approach (no automated test suite)

**Decision**: Use `quickstart.md` curl/manual checklist plus `npm run build` and `npx tsc --noEmit`
as release gates per constitution.

**Rationale**: Project has no Jest/Playwright yet; constitution mandates build/tsc.

**Alternatives considered**:

- Add Playwright in this feature — rejected (not requested; increases scope).

## R7 — UX freeze

**Decision**: No changes under `components/` except if required for security messaging (none
expected); hardening is API + docs + env template only.

**Rationale**: Spec FR-010 and constitution Principle I.

**Alternatives considered**: N/A.
