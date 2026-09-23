#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"

echo ""
echo "============================================"
echo "  OBOM — configurar login Google"
echo "============================================"
echo ""

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT/.env.example" "$ENV_FILE"
  echo "Criado .env a partir de .env.example"
fi

if ! grep -q '^AUTH_SECRET=.\+' "$ENV_FILE" 2>/dev/null; then
  SECRET="$(openssl rand -base64 32)"
  if grep -q '^AUTH_SECRET=' "$ENV_FILE"; then
    sed -i '' "s|^AUTH_SECRET=.*|AUTH_SECRET=$SECRET|" "$ENV_FILE"
  else
    echo "AUTH_SECRET=$SECRET" >> "$ENV_FILE"
  fi
  echo "AUTH_SECRET gerado."
fi

if grep -q '^NEXTAUTH_URL=http://' "$ENV_FILE" 2>/dev/null; then
  sed -i '' 's|^NEXTAUTH_URL=http://|NEXTAUTH_URL=https://|' "$ENV_FILE"
  echo "NEXTAUTH_URL atualizado para HTTPS."
fi

IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 'SEU-IP')"

echo ""
echo "No Google Cloud Console, adicione estas URIs:"
echo ""
echo "  Origens JavaScript:"
echo "    https://localhost:3001"
echo "    https://${IP}:3001"
echo ""
echo "  Redirecionamento OAuth:"
echo "    https://localhost:3001/api/auth/callback/google"
echo "    https://${IP}:3001/api/auth/callback/google"
echo ""
echo "Console: https://console.cloud.google.com/apis/credentials"
echo ""

read -r -p "Cole o GOOGLE_CLIENT_ID: " CLIENT_ID
read -r -p "Cole o GOOGLE_CLIENT_SECRET: " CLIENT_SECRET

if [[ -n "$CLIENT_ID" ]]; then
  if grep -q '^GOOGLE_CLIENT_ID=' "$ENV_FILE"; then
    sed -i '' "s|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$CLIENT_ID|" "$ENV_FILE"
  else
    echo "GOOGLE_CLIENT_ID=$CLIENT_ID" >> "$ENV_FILE"
  fi
fi

if [[ -n "$CLIENT_SECRET" ]]; then
  if grep -q '^GOOGLE_CLIENT_SECRET=' "$ENV_FILE"; then
    sed -i '' "s|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$CLIENT_SECRET|" "$ENV_FILE"
  else
    echo "GOOGLE_CLIENT_SECRET=$CLIENT_SECRET" >> "$ENV_FILE"
  fi
fi

echo ""
echo "Pronto. Reinicie o servidor: npm run dev:mobile"
echo ""
