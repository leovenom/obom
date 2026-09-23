#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERT="$ROOT/certificates/mobile.pem"

if [[ ! -f "$CERT" ]]; then
  echo "Certificado não encontrado. Corra primeiro: npm run dev:mobile"
  exit 1
fi

echo "A instalar certificado de desenvolvimento no Keychain..."
echo "(Pode pedir a password do Mac.)"
echo ""

sudo security add-trusted-cert -d -r trustRoot -p ssl -k /Library/Keychains/System.keychain "$CERT"

echo ""
echo "Pronto. Feche e reabra o browser, depois aceda:"
echo "  https://localhost:3001/dashboard"
echo ""
