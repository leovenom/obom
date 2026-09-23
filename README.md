# OBOM Captura

App web (PWA) em **React + Next.js** para captura de fotos e vídeos pelo celular, com geolocalização, reconhecimento de placas, cadastro de usuários, comissionamento e geração de JSON para autoridades competentes.

## Funcionalidades

- **Cadastro e login** — Cada captura é vinculada ao usuário autenticado
- **Perfil com PIX** — Nome, CPF, telefone e chave PIX para recebimento de comissão
- **Câmera** — Acesso à câmera traseira/frontal do celular
- **Geolocalização** — localização automática (browser) com endereço reverso
- **Metadados na imagem** — Data/hora, localização, tipo de ocorrência e placas
- **Foto ou vídeo** — Modo foto ou gravação (5–120 segundos)
- **Reconhecimento de placas** — OCR com Tesseract.js (Mercosul e antigo)
- **Comissionamento** — Percentual configurável para denunciante e plataforma
- **JSON para autoridades** — Relatório estruturado gerado automaticamente a cada envio

## Comissionamento

> ⚠️ **Atenção legal (Portugal):** Percentagem sobre coimas a cidadãos **não tem amparo legal**. Os valores abaixo são para **simulação interna / contratos B2G** — ver [analise-legal.md](docs/analise-legal.md).

| Parte | Percentual padrão |
|-------|-------------------|
| Denunciante (usuário) | 30% |
| Plataforma (intermediário) | 10% |
| Autoridade / órgão | 60% |

Configure em `.env`:

```env
USER_COMMISSION_PCT=30
PLATFORM_COMMISSION_PCT=10
PLATFORM_NAME=OBOM
PLATFORM_CNPJ=00.000.000/0001-00
PLATFORM_CONTACT=contato@obom.com.br
```

## Instalação

```bash
cp .env.example .env
npm install
npm run dev
```

Acesse `http://localhost:3001`

## Produção

Guia completo: **[docs/DEPLOY.md](docs/DEPLOY.md)** — HTTPS, variáveis obrigatórias (`AUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_PASSWORD`), OAuth, `npm run build` + `npm run start`, riscos de storage local e rotação da senha admin.

Use `.env.example` como referência; não commite secrets reais.

## Login com Google (Gmail)

Guia completo: [docs/GOOGLE-OAUTH.md](docs/GOOGLE-OAUTH.md)

```bash
npm run auth:google   # assistente interativo (cola Client ID e Secret)
npm run dev:mobile    # reinicie depois de configurar o .env
```

Resumo: credencial OAuth tipo **Web** no [Google Cloud Console](https://console.cloud.google.com/apis/credentials), com callback `https://localhost:3001/api/auth/callback/google` (use **HTTPS**, não HTTP).

Sem `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, o login por e-mail/senha continua a funcionar.

## Uso no celular

1. Celular e computador na mesma rede Wi-Fi
2. Acesse `http://<SEU-IP>:3001`
3. Permita câmera e localização
4. Capture, revise e clique **Enviar**
5. Faça login (Google ou e-mail) e complete perfil (CPF/PIX) se necessário

## Fluxo

```
Permissões → Câmera → Captura → Preview → [Enviar] → Login (Google/e-mail) → Perfil → Upload → Sucesso + JSON
```

## JSON para autoridades

A cada envio, o sistema gera automaticamente:

- `uploads/captura-XXX.autoridade.json` — Relatório completo
- Disponível via API: `GET /api/authority-report/:filename`

Exemplo de estrutura:

```json
{
  "versao": "1.0",
  "protocolo": "OBOM-20250922-ABC123",
  "denunciante": {
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "chavePix": "joao@email.com"
  },
  "ocorrencia": {
    "tipo": "Estacionamento irregular",
    "localizacao": { "latitude": -23.55, "longitude": -46.63 },
    "placasIdentificadas": ["ABC1D23"]
  },
  "comissionamento": {
    "percentualDenunciante": 30,
    "percentualPlataforma": 10,
    "percentualOrgao": 60
  }
}
```

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Cadastro |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Usuário atual |
| PATCH | `/api/auth/profile` | Atualizar perfil |
| POST | `/api/upload` | Enviar captura (requer login) |
| GET | `/api/capturas` | Listar capturas do usuário |
| GET | `/api/authority-report/:filename` | JSON para autoridades |
| GET | `/api/capturas/:filename` | Baixar mídia |

## Estrutura

```
obom/
├── app/                  # Next.js (páginas + API routes)
├── components/           # Telas React
├── hooks/                # Auth, câmera, geolocalização
├── lib/                  # DB, auth, comissão, OCR
├── data/                 # Usuários e sessões (JSON)
├── uploads/              # Mídia + relatórios
└── public/               # PWA
```

## Documentação de negócio

| Documento | Descrição |
|-----------|-----------|
| [Plano de Negócio](docs/business-plan.md) | Modelo SaaS B2G, projeções, go-to-market |
| [Análise Legal (Portugal)](docs/analise-legal.md) | RGPD, comissões, viabilidade de monetização |
| [Design System](docs/design-system.md) | Cores, tipografia, componentes |
| [Organograma](docs/organograma.md) | Estrutura startup e escala |

> **Nota legal:** Comissão sobre coimas a cidadãos **não é viável** em Portugal. O modelo recomendado é SaaS institucional (municípios/ANSR).

## Licença

MIT
