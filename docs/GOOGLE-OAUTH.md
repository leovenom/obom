# Login com Google (Gmail)

## 1. Google Cloud Console

1. Abra [Credenciais](https://console.cloud.google.com/apis/credentials)
2. Crie um **projeto** (se ainda não tiver)
3. **APIs e Serviços → Tela de consentimento OAuth**
   - Tipo: **Externo**
   - Preencha nome da app (ex: OBOM), e-mail de suporte
   - Em **Utilizadores de teste**, adicione o seu Gmail (obrigatório enquanto a app estiver em "Teste")
4. **Credenciais → Criar credenciais → ID do cliente OAuth**
   - Tipo: **Aplicativo da Web**

### Origens JavaScript autorizadas

```
https://localhost:3001
https://192.168.1.65:3001
```

(Substitua `192.168.1.65` pelo IP da sua rede — aparece ao correr `npm run dev:mobile`.)

### URIs de redirecionamento autorizados

```
https://localhost:3001/api/auth/callback/google
https://192.168.1.65:3001/api/auth/callback/google
```

5. Copie **ID do cliente** e **Chave secreta do cliente**

## 2. Ficheiro `.env`

```env
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
AUTH_SECRET=... já gerado ...
NEXTAUTH_URL=https://localhost:3001
```

## 3. Reiniciar o servidor

```bash
# Pare o servidor (Ctrl+C) e volte a correr:
npm run dev:mobile
```

## 4. Testar

1. Abra `https://localhost:3001`
2. Capture e envie → ecrã de login
3. **Entrar com Google**

## Problemas comuns

| Erro | Solução |
|------|---------|
| `redirect_uri_mismatch` | URI de callback no Google deve coincidir **exactamente** com `NEXTAUTH_URL` + `/api/auth/callback/google` |
| `access_denied` | Adicione o seu Gmail em **Utilizadores de teste** na tela de consentimento |
| Botão Google não aparece | Confirme `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env` e reinicie o servidor |
| `AUTH_SECRET em falta` | Já está no `.env`; reinicie o dev server |
