---
description: "Task list for production hardening (001)"
---

# Tasks: Production Hardening (Minimum)

**Input**: Design documents from `/specs/001-production-hardening/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested — validation via quickstart.md curl/manual checks only.

**Organization**: Tasks grouped by user story (US1–US4) for independent delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 maps to spec.md user stories

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align implementer with feature context before code changes.

- [x] T001 Review spec.md, plan.md, and contracts/ under `specs/001-production-hardening/` against current repo baseline
- [x] T002 [P] Confirm `.specify/feature.json` `feature_directory` is `specs/001-production-hardening`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared filename validation helper used by media route (FR-004).

**⚠️ CRITICAL**: Complete before US1 implementation tasks that depend on early validation.

- [x] T003 Export `isSafeCaptureFilename(filename: string): boolean` in `lib/upload-files.ts` using existing `SAFE_FILENAME` rule `^captura-\d+\.(jpg|jpeg|png|webm|mp4)$` (case-insensitive extension) and basename-only check via `path.basename`

**Checkpoint**: Foundation ready — user story work can begin.

---

## Phase 3: User Story 1 - Capture media stays private (Priority: P1) 🎯 MVP

**Goal**: Anonymous users cannot download capture media; owners and admins can; invalid filenames rejected.

**Independent Test**: `specs/001-production-hardening/quickstart.md` §3 — anonymous GET returns non-200 success; traversal probe does not leak files.

### Implementation for User Story 1

- [x] T004 [US1] In `app/api/capturas/[filename]/route.ts`, call `isSafeCaptureFilename` from `lib/upload-files.ts` before `getCaptureById`; return 400 JSON `{ error: 'Nome de ficheiro inválido' }` when false
- [x] T005 [US1] In `app/api/capturas/[filename]/route.ts`, verify owner (`user.id === record.userId`) or `isAdminAuthenticated()` before `readUploadFile`; keep `Cache-Control: private, no-store` per `specs/001-production-hardening/contracts/media-access.md`
- [x] T006 [US1] After `npm run build` and `npm run start`, run anonymous media curl checks in `specs/001-production-hardening/quickstart.md` §3 and record results

**Checkpoint**: US1 complete — media privacy verified on production build.

---

## Phase 4: User Story 2 - Operator can deploy without guessing secrets (Priority: P2)

**Goal**: `.env.example` + deploy guide let a new operator configure production without hunting the codebase.

**Independent Test**: Reviewer lists all mandatory env vars from `.env.example` and completes `docs/DEPLOY.md` checklist without author help.

### Implementation for User Story 2

- [x] T007 [P] [US2] Expand `.env.example` with sections **Obrigatório em produção** (`AUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_PASSWORD`) and **Opcional** (Google OAuth, commission vars, `PORT`); note `NEXTAUTH_SECRET` alias; link `docs/GOOGLE-OAUTH.md`; no real secrets
- [x] T008 [P] [US2] Create `docs/DEPLOY.md` covering HTTPS, `NEXTAUTH_URL`, Google redirect URI `{ORIGIN}/api/auth/callback/google`, `npm run build` + `npm run start`, optional plate service, ephemeral storage risk, admin password rotation (FR-008, FR-009)
- [x] T009 [US2] Add **Produção** subsection in `README.md` linking to `docs/DEPLOY.md` and `.env.example`

**Checkpoint**: US2 complete — deploy documentation shippable.

---

## Phase 5: User Story 3 - Sensitive actions remain gated (Priority: P3)

**Goal**: Upload and admin APIs stay protected; no regression from hardening.

**Independent Test**: `specs/001-production-hardening/quickstart.md` §4–5 — upload and admin list return 401 without credentials.

### Implementation for User Story 3

- [x] T010 [P] [US3] Confirm `app/api/upload/route.ts` returns 401 when `getSessionUser()` is null per `specs/001-production-hardening/contracts/upload-and-admin.md`
- [x] T011 [P] [US3] Confirm `app/api/admin/capturas/route.ts` and `app/api/admin/capturas/[id]/route.ts` require `isAdminAuthenticated()` with 401 when false
- [x] T012 [US3] Run upload and admin denial curls in `specs/001-production-hardening/quickstart.md` §4–5 on production server

**Checkpoint**: US3 complete — auth gates verified.

---

## Phase 6: User Story 4 - Capture experience unchanged (Priority: P3)

**Goal**: No UX/copy regressions from hardening (FR-010, constitution Principle I).

**Independent Test**: Manual walkthrough — OBOM header, «Registre ocorrências», same step order; overlay without address.

### Implementation for User Story 4

- [x] T013 [US4] Verify hardening diff touches only `app/api/`, `lib/upload-files.ts`, `docs/`, `.env.example`, `README.md` — no changes to `components/PermissionsScreen.tsx`, `components/PreviewScreen.tsx`, `components/AuthScreen.tsx`, or `app/globals.css` layout/copy
- [x] T014 [US4] Execute manual capture walkthrough per `specs/001-production-hardening/quickstart.md` §8 (permissions → camera → review → send → success)

**Checkpoint**: US4 complete — UX scope guard satisfied.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Constitution quality gates and doc sync.

- [x] T015 Run `npm run build` and `npx tsc --noEmit` at repository root (constitution Principle V)
- [x] T016 [P] Update `specs/001-production-hardening/quickstart.md` if env variable names or validation steps changed during implementation
- [x] T017 Mark completed tasks as `[x]` in `specs/001-production-hardening/tasks.md` after `/speckit-implement` verification

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1–2**: Start immediately; Phase 2 blocks T004–T005
- **Phase 3 (US1)**: After T003 — **MVP**
- **Phase 4 (US2)**: After Phase 1 — parallel with US1 (docs only)
- **Phase 5 (US3)**: After Phase 1 — parallel with US1/US2 (audit + curl)
- **Phase 6 (US4)**: After code changes from US1–US3 (before sign-off)
- **Phase 7**: After US1–US4

### User Story Dependencies

- **US1**: Depends on T003 only
- **US2**: Independent of US1 (documentation)
- **US3**: Independent audit (may run parallel to US1/US2)
- **US4**: Depends on all code/doc tasks finishing

### Parallel Opportunities

- **T007 + T008**: Different files (`.env.example`, `docs/DEPLOY.md`)
- **T010 + T011**: Different route files
- **US2 entire phase** can run parallel to **US1** after Phase 2
- **T016** parallel to **T015** if different owners

---

## Parallel Example: User Story 2

```bash
# Documentation in parallel:
# T007 — expand .env.example
# T008 — create docs/DEPLOY.md
# Then T009 — README link (depends on DEPLOY.md existing)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1–2 (T001–T003)
2. Complete Phase 3 (T004–T006)
3. **STOP and VALIDATE** — anonymous media denied on production build
4. Ship media fix before docs if urgent

### Incremental Delivery

1. US1 → verify curls → deploy hotfix if needed
2. US2 → operator-ready documentation
3. US3 → regression audit
4. US4 + Polish → release sign-off

### Suggested `/speckit-implement` order

T001 → T002 → T003 → T004 → T005 → T006 → (T007 ∥ T008) → T009 → (T010 ∥ T011) → T012 → T013 → T014 → T015 → T016 → T017

---

## Notes

- Media auth may already pass T005/T006 before T004; T004 still required for FR-004 ordering
- Do not implement S3/object storage in this task list
- Commit after each phase checkpoint if using git

## Phase 8: Convergence

- [x] T018 Run full end-to-end capture (permissions → camera → review → send → success) on HTTPS or `dev:mobile` and note pass/fail in `specs/001-production-hardening/quickstart.md` §8 per SC-004 (partial)
- [x] T019 In `app/api/capturas/[filename]/route.ts`, require authentication before registry 404 so anonymous clients always receive 401 for valid `captura-*` names (eliminate 404 vs 401 existence oracle) per spec Edge Cases / US1 (partial)
