# Feature Specification: Production Hardening (Minimum)

**Feature Branch**: `001-production-hardening`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Preparar o OBOM para produção (hardening mínimo, sem redesenhar UX): Garantir que acesso a ficheiros de captura permanece protegido (administrador ou dono do envio); validar nomes de ficheiro contra path traversal. Documentar variáveis de ambiente obrigatórias (segredos de sessão, URL pública da app, senha de admin, OAuth Google, sem valores reais). Checklist README ou guia de deploy: HTTPS, URL pública de produção, redirect OAuth, build e arranque, serviço de placas opcional. Confirmar que envio exige sessão; dashboard admin exige senha. Não alterar fluxo de captura nem textos da UI acordados (OBOM no topo, subtítulo «Registre ocorrências», etc.). Identificar riscos restantes (storage local em ambientes efémeros, senha admin por omissão) e propor mitigação realista (VPS ou object storage) sem implementar migração de object storage nesta feature, salvo se trivial. Critérios de aceite: build de produção passa; acesso anónimo a mídia recusado; documentação permite deploy por outra pessoa sem adivinhar secrets."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture media stays private (Priority: P1)

A person who is not signed in (and not an administrator) must not be able to view or download
another user's photo or video capture, even if they know or guess the file identifier.

**Why this priority**: Public capture media exposes personal evidence, location metadata, and
identity context; this was identified as a critical production risk.

**Independent Test**: Attempt to open a known capture file URL without any session; verify access
is refused. Repeat as the capture owner and as an administrator; verify both can access when
appropriate.

**Acceptance Scenarios**:

1. **Given** a capture file exists on the system, **When** an anonymous visitor requests that
   file, **Then** access is denied (not served as a public download).
2. **Given** a signed-in user who owns a capture, **When** they request their own capture file,
   **Then** they receive the media.
3. **Given** an administrator with a valid admin session, **When** they request any valid capture
   file, **Then** they receive the media.
4. **Given** a request whose file identifier contains path traversal patterns (e.g. parent
   directory segments or disallowed characters), **When** the request is processed, **Then**
   access is denied and no files outside the capture store are exposed.

---

### User Story 2 - Operator can deploy without guessing secrets (Priority: P2)

A new operator (not the original developer) must be able to configure and deploy OBOM using
documented environment variables and a step-by-step checklist, without inventing secret values
or hunting through the codebase.

**Why this priority**: Production failures from missing `AUTH_SECRET`, wrong public URL, or OAuth
redirect mismatch block all authenticated flows.

**Independent Test**: A reviewer follows only `.env.example` (or equivalent) plus the deploy
guide and confirms every required variable is named, described, and marked optional vs mandatory.

**Acceptance Scenarios**:

1. **Given** the repository's environment template, **When** an operator reads it, **Then** every
   mandatory production variable is listed with a short purpose and no real secret values.
2. **Given** the deploy guide, **When** an operator follows it for a HTTPS production host,
   **Then** they can configure public URL, OAuth redirect, build, start, and optional plate
   service without undocumented steps.
3. **Given** Google sign-in is enabled, **When** the operator configures OAuth, **Then** the
   guide states which redirect URI must match the production public URL.

---

### User Story 3 - Sensitive actions remain gated (Priority: P3)

Submitting a capture and viewing the admin dashboard must remain protected: anonymous users
cannot upload, and the dashboard cannot be used without administrator authentication.

**Why this priority**: Confirms existing security posture before go-live and prevents regression
during hardening work.

**Independent Test**: Call upload and admin flows without credentials; verify refusal. Complete
one end-to-end capture as a signed-in user; verify upload still succeeds.

**Acceptance Scenarios**:

1. **Given** no user session, **When** a client attempts to submit a capture, **Then** submission
   is refused.
2. **Given** no valid admin session, **When** a client attempts to use admin-only capture listing
   or dashboard APIs, **Then** access is refused.
3. **Given** a user with incomplete profile when profile is required for send, **When** they try
   to submit, **Then** existing profile-completion rules still apply (no bypass introduced by
   hardening).

---

### User Story 4 - Capture experience unchanged (Priority: P3)

End users continue the agreed capture journey (permissions → camera → review → auth/profile when
needed → send → success) with the same primary labels (OBOM header, subtitle «Registre
ocorrências», no large decorative camera icon on auth screens).

**Why this priority**: Scope guard—hardening must not become a UX redesign.

**Independent Test**: Manual walkthrough of the primary capture path on mobile or desktop; compare
to pre-hardening agreed copy and step order.

**Acceptance Scenarios**:

1. **Given** a user starting a new capture, **When** they progress through permissions and camera,
   **Then** the step order and main UI copy match the agreed baseline (no new step wizard or
   relocated footer/toast pattern from rejected redesigns).
2. **Given** hardening changes are applied, **When** a complete capture is submitted successfully,
   **Then** success feedback and metadata behaviour remain consistent with constitution
   (location in metadata, not burned into image overlay).

### Edge Cases

- Request for a non-existent capture filename: denied without leaking whether other files exist.
- Request with URL-encoded traversal sequences: treated as invalid; no file system escape.
- Production started with default or weak administrator password: deploy guide MUST warn and
  require rotation before go-live.
- Deployment on ephemeral/serverless hosts where local disk is not durable: guide MUST document
  that captures and registry JSON may be lost and recommend VPS or future object-storage spec.
- Optional plate-recognition helper offline: capture flow still works via browser fallback;
  deploy guide marks the helper as optional.
- OAuth configured but public URL mismatch: guide explains symptom (login loop / error) and fix.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST deny anonymous access to stored capture media files.
- **FR-002**: The system MUST allow capture owners (authenticated as the submitting user) to
  retrieve their own media files.
- **FR-003**: The system MUST allow authenticated administrators to retrieve capture media files
  needed for dashboard and authority workflows.
- **FR-004**: The system MUST reject file identifiers that are not strictly valid capture media
  names, including attempts at directory traversal or unexpected path components.
- **FR-005**: The system MUST refuse capture submission when the submitter has no valid user
  session.
- **FR-006**: The system MUST refuse admin dashboard and admin capture APIs without valid
  administrator authentication.
- **FR-007**: The project MUST ship an environment variable template listing all mandatory
  production settings (session secret, public app URL, administrator password, OAuth client
  credentials when Google login is used) with placeholders only—never committed real secrets.
- **FR-008**: The project MUST include a deploy checklist (standalone doc or README section)
  covering HTTPS requirement, production public URL, OAuth redirect alignment, production build
  and start commands, and optional plate service.
- **FR-009**: The deploy checklist MUST document known residual risks: local filesystem storage on
  non-persistent hosts and use of default administrator credentials, with recommended mitigations
  (strong passwords, VPS or dedicated server; object storage as a follow-up feature).
- **FR-010**: Hardening work MUST NOT change the agreed capture UX flow, primary screen copy, or
  location-on-metadata / not-on-overlay policy defined in the project constitution.
- **FR-011**: Production release verification MUST include a successful production build and an
  explicit check that anonymous media access is denied.

### Key Entities *(include if feature involves data)*

- **Capture media file**: Photo or video blob tied to one submission; identified by a safe,
  system-generated name; accessible only to owner or administrator.
- **Environment configuration**: Named settings for secrets, public URL, OAuth, and admin access;
  documented for operators, not committed with real values.
- **Deploy guide**: Human-readable checklist linking configuration, HTTPS, OAuth, build/start, and
  optional services to a repeatable go-live process.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In production verification, 100% of tested anonymous requests for existing capture
  media are denied (no successful anonymous download in the test set).
- **SC-002**: A reviewer who has not written the application can list all mandatory environment
  settings and complete the deploy checklist in one pass without asking the author for missing
  secret names.
- **SC-003**: Production build completes successfully with zero errors before release sign-off.
- **SC-004**: At least one end-to-end capture (permissions through successful send) completes
  after hardening with the same user-visible steps and agreed primary copy as before the feature.
- **SC-005**: Deploy documentation explicitly calls out at least two residual risks (ephemeral
  storage and weak default admin password) and states recommended mitigations without requiring
  object-storage migration in this feature.

## Assumptions

- Hardening builds on existing email/password and optional Google sign-in; no new auth methods are
  in scope.
- Media protection may already be partially implemented; this feature verifies, documents, and
  closes gaps rather than redesigning storage architecture.
- Primary deployment target for the checklist is a HTTPS-capable VPS or similar persistent host;
  serverless is supported only with documented limitations.
- Migrating uploads and registry data to object storage or a database is out of scope unless a
  trivial documentation-only note suffices; a separate feature spec would cover migration.
- Constitution v1.0.0 (capture flow, security, location privacy, build gates) is binding for
  implementation and review.
- European Portuguese remains the language for user-facing copy; documentation for operators may
  be Portuguese or bilingual as already used in the repo.
