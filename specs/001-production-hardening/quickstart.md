# Quickstart: Validate Production Hardening

Prerequisites: Node 18+, `.env` from `.env.example`, production build.

## 1. Build gates (constitution)

```bash
cd /Users/leonardt/obom
npm run build
npx tsc --noEmit
```

**Expected**: Both exit 0.

## 2. Start production server

```bash
npm run start
# default PORT=3001 unless overridden
```

Set `BASE=http://localhost:3001` (or your HTTPS URL).

## 3. Anonymous media denied (P1)

After at least one capture exists (note `filename` from upload response or `data/capturas/registros.json`):

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/capturas/captura-EXAMPLE.jpg"
```

Replace with a real filename. **Expected**: `401` (not `200`), including for valid-pattern filenames that do not exist in the registry (no 404 vs 401 oracle).

Invalid basename (pattern mismatch):

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/capturas/not-a-capture.jpg"
```

**Expected**: `400` with JSON error (not file bytes).

Traversal probe:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/capturas/..%2F..%2Fetc%2Fpasswd"
```

**Expected**: `400` (or other non-200); no file content from outside `uploads/`.

## 4. Upload without session (P3)

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/upload"
```

**Expected**: `401`.

## 5. Admin API without session (P3)

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/admin/capturas"
```

**Expected**: `401`.

## 6. Owner access (optional smoke)

1. Register/login via UI or `/api/auth/register` + `/api/auth/login` (save cookies).
2. `curl -b cookies.txt -s -o /dev/null -w "%{http_code}\n" "$BASE/api/capturas/<own-filename>"`

**Expected**: `200` for own file.

## 7. Documentation review (P2)

- [ ] `.env.example` lists all mandatory production variables with comments.
- [ ] `docs/DEPLOY.md` (or README section) covers HTTPS, `NEXTAUTH_URL`, Google redirect, build/start,
      optional `npm run plates:dev`, storage risks, admin password rotation.

## 8. UX regression (P3)

Manual: permissions → camera → review → send → success. Confirm header **OBOM**, subtitle
**Registre ocorrências**, no rejected layout changes.

### Verification log (SC-004)

| Date | Environment | Result | Notes |
|------|-------------|--------|-------|
| 2026-09-23 | `http://localhost:3001` (production `npm run start`) | **PASS (UI smoke)** | Browser: home shows **OBOM** + subtitle **Registre ocorrências**; permission controls present; no layout regression observed |
| 2026-09-23 | Same + API | **PASS (submit path)** | Register → login → `POST /api/upload` with test JPEG returns 200; owner `GET /api/capturas/<filename>` returns 200 |
| 2026-09-23 | `:3010` after T019 | **PASS (oracle)** | Anonymous GET valid-pattern missing/existing filenames both **401** |
| — | HTTPS mobile (`npm run dev:mobile`) | **Pending operator** | Full camera/GPS E2E requires device + HTTPS trust; run before public launch |

See [spec.md](./spec.md) for full acceptance criteria.
