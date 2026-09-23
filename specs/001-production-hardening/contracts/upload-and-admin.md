# Contract: Upload and Admin APIs (Security Gates)

## POST /api/upload

**Auth**: Valid user session required.

| Status | Condition |
|--------|-----------|
| 401 | No session — `{ "error": "Faça login para enviar capturas" }` |
| 404 | User record missing |
| 4xx/5xx | Validation / server errors (existing behaviour) |
| 200 | Successful registration + file stored |

## GET /api/capturas

**Auth**: Valid user session.

| Status | Condition |
|--------|-----------|
| 401 | `{ "error": "Não autenticado" }` |
| 200 | List of captures for session user |

## POST /api/admin/login

**Auth**: None (credential exchange).

| Status | Condition |
|--------|-----------|
| 401 | Wrong password |
| 200 | Sets admin session cookie |

## GET /api/admin/capturas

**Auth**: Admin session.

| Status | Condition |
|--------|-----------|
| 401 | `{ "error": "Não autorizado" }` |
| 200 | Full registry payload for dashboard |

## GET /api/admin/capturas/{id}

**Auth**: Admin session (existing route — verify unchanged).

## Regression requirement

Hardening MUST NOT remove or bypass these gates.
