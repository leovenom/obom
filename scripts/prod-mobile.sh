#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3001}"
BACKEND_PORT="${BACKEND_PORT:-13001}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERT_DIR="$ROOT/certificates"

get_ip() {
  ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true
}

IP="$(get_ip)"
if [ -z "$IP" ]; then
  echo "Erro: não foi possível detectar o IP local. Ligue o Mac ao Wi‑Fi."
  exit 1
fi

mkdir -p "$CERT_DIR"

REGEN=0
if [ ! -f "$CERT_DIR/mobile.pem" ]; then REGEN=1; fi
if [ -f "$CERT_DIR/mobile.ip" ] && [ "$(cat "$CERT_DIR/mobile.ip")" != "$IP" ]; then
  echo "IP mudou ($(cat "$CERT_DIR/mobile.ip") → $IP). Regenerando certificado..."
  REGEN=1
fi

if [ "$REGEN" -eq 1 ]; then
  echo "Gerando certificado HTTPS para $IP..."
  cat > "$CERT_DIR/mobile.cnf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
CN = $IP

[v3_req]
subjectAltName = @alt_names

[alt_names]
IP.1 = $IP
DNS.1 = localhost
IP.2 = 127.0.0.1
EOF

  openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout "$CERT_DIR/mobile-key.pem" \
    -out "$CERT_DIR/mobile.pem" \
    -config "$CERT_DIR/mobile.cnf" \
    -extensions v3_req

  echo "$IP" > "$CERT_DIR/mobile.ip"
fi

free_port() {
  local p="$1"
  if lsof -ti:"$p" >/dev/null 2>&1; then
    echo "Liberando porta $p..."
    lsof -ti:"$p" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

free_port "$PORT"
free_port "$BACKEND_PORT"

if [ ! -d "$ROOT/.next" ]; then
  echo "A compilar produção (npm run build)..."
  (cd "$ROOT" && npm run build)
fi

NEXT_PID=""
PROXY_PID=""

cleanup() {
  [ -n "$PROXY_PID" ] && kill "$PROXY_PID" 2>/dev/null || true
  [ -n "$NEXT_PID" ] && kill "$NEXT_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

echo "A iniciar Next.js (produção) em http://127.0.0.1:$BACKEND_PORT ..."
(cd "$ROOT" && PORT="$BACKEND_PORT" npx next start -p "$BACKEND_PORT" -H 127.0.0.1) &
NEXT_PID="$!"

for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:$BACKEND_PORT/" 2>/dev/null; then
    break
  fi
  sleep 0.5
done

HTTPS_PORT="$PORT" BACKEND_PORT="$BACKEND_PORT" node "$ROOT/scripts/https-proxy.js" &
PROXY_PID="$!"

PUBLIC_URL="https://$IP:$PORT"

echo ""
echo "============================================"
echo "  OBOM — produção (HTTPS, iPhone)"
echo "============================================"
echo ""
echo "  iPhone (mesma Wi‑Fi):"
echo "  $PUBLIC_URL"
echo ""
echo "  Mac:"
echo "  https://localhost:$PORT"
echo ""
echo "  .env recomendado para esta sessão:"
echo "  NEXTAUTH_URL=$PUBLIC_URL"
echo ""
echo "  Certificado no iPhone: aviso → Mostrar detalhes → visitar"
echo "  (Opcional no Mac: npm run dev:trust-cert)"
echo ""
echo "  Login Google: adicione no Cloud Console o redirect"
echo "  $PUBLIC_URL/api/auth/callback/google"
echo "  Ou use e-mail/senha neste teste."
echo ""
echo "  Ctrl+C para parar."
echo "============================================"
echo ""

wait "$PROXY_PID"
