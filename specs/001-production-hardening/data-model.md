# Data Model: Production Hardening (Minimum)

This feature does not introduce new persistent entities. It constrains access and documents
configuration for existing stores.

## Existing entities (unchanged schema)

### CaptureRecord

Source: `lib/capturas-types.ts` / `data/capturas/registros.json`

| Field | Role in hardening |
|-------|-------------------|
| `id` / `filename` | Media identifier; MUST match safe pattern `captura-<timestamp>.<ext>` |
| `userId` | Owner check for media GET |
| `userEmail`, `userNome` | Admin views only |
| `metadata` | Includes location (not overlay); unchanged |

**Validation (hardening)**:

- Media route MUST only serve files whose basename passes `SAFE_FILENAME` in `lib/upload-files.ts`.
- Owner authorization: `session.user.id === record.userId`.

### User (session)

Source: `lib/db.ts` / session cookie or NextAuth

- Required for `POST /api/upload` and owner media access.
- `profileComplete` rules unchanged for send.

### Admin session

Source: `lib/admin-auth.ts` cookie `obom_admin`

- HMAC-signed token bound to `ADMIN_PASSWORD` / signing secret.
- Required for `/api/admin/*` and admin media access.

## Configuration (documented, not stored in repo)

| Variable | Production | Purpose |
|----------|------------|---------|
| `AUTH_SECRET` | Required | Session/JWT signing |
| `NEXTAUTH_URL` | Required if Google OAuth | Public origin for Auth.js |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional pair | Google login |
| `ADMIN_PASSWORD` | Required | Dashboard admin gate |
| `USER_COMMISSION_PCT`, etc. | Optional | Business defaults |

## Filesystem layout (operational)

```text
uploads/              # Binary capture media (must persist on VPS)
data/capturas/        # registros.json registry
data/users.json       # Credentials (existing)
```

**Hardening note**: Ephemeral hosts lose `uploads/` and JSON files on redeploy — documented in
deploy guide, not fixed in this feature.

## State transitions

No new transitions. Authorization is evaluated per request:

```text
Media GET request
  → invalid filename? → deny (400/401)
  → no record? → 404
  → not admin and not owner? → 401
  → read file via resolveUploadPath → 200 or 404
```
