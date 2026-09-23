# Contract: Capture Media Access

**Endpoint**: `GET /api/capturas/{filename}`

## Purpose

Serve capture photo/video to authorized parties only.

## Path parameters

| Name | Type | Rules |
|------|------|-------|
| `filename` | string | Basename only; MUST match `^captura-\d+\.(jpg|jpeg|png|webm|mp4)$` (case-insensitive ext) |

Invalid pattern or traversal attempt MUST NOT read arbitrary filesystem paths.

## Authentication

One of:

1. Valid user session where `user.id === record.userId`, OR
2. Valid admin session (`obom_admin` cookie)

## Responses

| Status | Condition | Body |
|--------|-----------|------|
| 200 | Authorized and file exists | Raw media bytes, `Content-Type` by extension, `Cache-Control: private, no-store` |
| 401 | Anonymous or non-owner non-admin | `{ "error": "Não autorizado" }` |
| 404 | Unknown capture id or missing file on disk | `{ "error": "Arquivo não encontrado" }` |
| 400 | Optional: invalid filename before lookup | `{ "error": "..." }` (if implemented in hardening pass) |

## Security notes

- Do not serve media when only the filename is known and caller is unauthenticated.
- Registry entry MUST exist before streaming bytes (prevents orphan file leaks if policy requires).
