#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3001}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERT_DIR="$ROOT/certificates"

get_ip() {
  ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true
}

IP="$(get_ip)"
if [ -z "$IP" ]; then
  echo "Erro: não foi possível detectar o IP local. Conecte o Mac ao Wi-Fi."
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

if lsof -ti:"$PORT" >/dev/null 2>&1; then
  echo "Liberando porta $PORT..."
  lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo ""
echo "============================================"
echo "  OBOM — desenvolvimento (HTTPS)"
echo "============================================"
echo ""
echo "  No Mac (Safari/Chrome):"
echo "  https://localhost:$PORT"
echo ""
echo "  No iPhone (mesma rede Wi-Fi):"
echo "  https://$IP:$PORT"
echo ""
echo "  Se aparecer aviso de certificado:"
echo "  Mostrar detalhes → visitar este site"
echo ""
echo "  Não use http:// — câmera e GPS não funcionam no iPhone."
echo ""
echo "============================================"
echo ""

cd "$ROOT"
exec npx next dev -p "$PORT" -H 0.0.0.0 \
  --experimental-https \
  --experimental-https-key "$CERT_DIR/mobile-key.pem" \
  --experimental-https-cert "$CERT_DIR/mobile.pem"
