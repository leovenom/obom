# OBOM Captura

PWA em **React + Next.js** para recolher **evidências** (foto/vídeo, localização, placas) de ocorrências de trânsito e infrações visíveis. O objectivo é **agregar dados** para que as autoridades competentes consigam **medir a dimensão** do problema que hoje não resolvem de forma sistemática.

## Funcionalidades

- **Cadastro e login** — Cada envio fica associado ao utilizador autenticado
- **Perfil mínimo** — Nome e telemóvel português (contacto)
- **Câmera** — Captura foto ou vídeo no telemóvel
- **Geolocalização** — GPS com morada quando disponível (metadados, não gravada no overlay)
- **Metadados** — Data/hora, tipo de ocorrência, placas detectadas
- **Matrículas europeias** — PT, FR, ES, UK, DE, NL, PL, BE, CZ, Nordics e heurística genérica UE (5–8 caracteres); OCR no browser + serviço Python opcional
- **Relatório para autoridades** — JSON estruturado por envio (dashboard admin)

## Instalação

```bash
cp .env.example .env
npm install
npm run dev
```

Aceda a `http://localhost:3001`

## Produção

Guia: **[docs/DEPLOY.md](docs/DEPLOY.md)** — HTTPS, `AUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_PASSWORD`, build e arranque.

## Login com Google (Gmail)

[docs/GOOGLE-OAUTH.md](docs/GOOGLE-OAUTH.md)

```bash
npm run auth:google
npm run dev:mobile
```

## Uso no telemóvel

1. Mesma rede Wi‑Fi ou deploy HTTPS
2. Permita câmera e localização
3. Capture → **Enviar** → login → perfil (nome + telemóvel PT) se necessário

## Fluxo

```
Permissões → Câmera → Revisão → [Enviar] → Login → Perfil → Upload → Sucesso + protocolo
```

## JSON para autoridades

Cada envio gera um registo em `data/capturas/registros.json` com media, metadados e `relatorioAutoridade` (denunciante, ocorrência, objectivo de agregação). O admin exporta via `/dashboard`.

Exemplo (resumido):

```json
{
  "protocolo": "OBOM-20260923-ABC123",
  "denunciante": { "nome": "Maria Silva", "telefone": "+351912345678", "email": "..." },
  "ocorrencia": { "tipoCodigo": "estacionamento", "localizacao": { "endereco": "...", "latitude": 38.72 } },
  "objetivo": {
    "descricao": "Medir volume e padrões de ocorrências reportadas pela população"
  }
}
```

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registo (e-mail + senha) |
| POST | `/api/auth/login` | Login |
| PATCH | `/api/auth/profile` | Nome + telemóvel PT |
| POST | `/api/upload` | Enviar captura (requer login) |
| GET | `/api/capturas` | Listagem do utilizador |
| GET | `/api/capturas/:filename` | Mídia (dono ou admin) |

## Estrutura

```
obom/
├── app/           # Páginas + API
├── components/
├── hooks/
├── lib/           # Auth, relatório autoridade, OCR
├── data/          # Utilizadores + registos
└── uploads/       # Ficheiros media
```

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [Análise Legal (Portugal)](docs/analise-legal.md) | RGPD e uso institucional |
| [Plano de Negócio](docs/business-plan.md) | Modelo B2G (referência) |
| [Design System](docs/design-system.md) | UI |

## Licença

MIT
