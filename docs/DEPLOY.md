# Deploy OBOM (produção)

Checklist para colocar o OBOM em produção com HTTPS, autenticação e storage persistente.

## Pré-requisitos

- Node.js 18+
- Host com **HTTPS** (câmera e GPS no telemóvel exigem contexto seguro)
- Disco **persistente** para `uploads/` e `data/` (ver riscos abaixo)

## 1. Variáveis de ambiente

Copie `.env.example` para `.env` no servidor.

| Variável | Produção | Descrição |
|----------|----------|-----------|
| `AUTH_SECRET` | **Obrigatório** | Segredo de sessão (`openssl rand -base64 32`) |
| `NEXTAUTH_SECRET` | Opcional | Alias de `AUTH_SECRET` |
| `NEXTAUTH_URL` | **Obrigatório** | Origem pública HTTPS, ex. `https://obom.example.com` |
| `ADMIN_PASSWORD` | **Obrigatório** | Senha do `/dashboard` — **altere** qualquer valor de exemplo |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Opcional | Login Google — ver [GOOGLE-OAUTH.md](./GOOGLE-OAUTH.md) |
| `PORT` | Opcional | Porta HTTP interna (predefinição 3001) |
| Plataforma (relatórios) | Opcional | `PLATFORM_NAME`, `PLATFORM_CONTACT` |

Nunca commite `.env` com secrets reais.

## 2. Google OAuth (se usar)

1. Credencial OAuth tipo **Web** no Google Cloud Console.
2. **Origens JavaScript autorizadas:** `https://<seu-dominio>`
3. **URI de redirecionamento:** `https://<seu-dominio>/api/auth/callback/google`
4. `NEXTAUTH_URL` deve ser **exactamente** a mesma origem (HTTPS).

Sintoma de URL errada: erro de configuração Auth.js ou loop no login Google.

## 3. Build e arranque

```bash
npm ci
cp .env.example .env   # editar valores antes de arrancar
npm run build
npm run start
```

Em desenvolvimento local com telemóvel: `npm run dev:mobile` (certificado HTTPS local).

## 4. Serviço de placas (opcional)

```bash
npm run plates:dev   # Python, porta 5050
```

Se estiver offline, a app continua com OCR no browser (Tesseract).

## 5. Verificação de segurança (mínimo)

Com o servidor de produção a correr:

```bash
BASE=https://<seu-dominio>
# Mídia anónima deve falhar (401 ou 400), não 200 com bytes
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/capturas/captura-123.jpg"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/upload"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/admin/capturas"
```

Upload e admin: esperado **401** sem cookies. Mídia: **401** (ou **404** se ficheiro não existir), nunca download anónimo.

Ver também: [specs/001-production-hardening/quickstart.md](../specs/001-production-hardening/quickstart.md)

## 6. Riscos conhecidos e mitigação

### Storage local em hosts efémeros

Ficheiros em `uploads/` e registos em `data/capturas/` **perdem-se** em redeploys serverless
(Vercel, etc.) sem volume persistente.

**Mitigação recomendada:** VPS ou servidor dedicado com disco; migração para object storage
fica para uma feature futura (fora do hardening mínimo).

### Senha admin fraca ou por omissão

**Mitigação:** definir `ADMIN_PASSWORD` longa e única antes de expor `/dashboard` à internet.

## 7. Pós-deploy

- Confirmar `npm run build` e `npx tsc --noEmit` no pipeline ou manualmente
- Testar fluxo: permissões → câmera → envio → sucesso (copy UI inalterada)
- Rever [analise-legal.md](./analise-legal.md) antes de uso público em Portugal
