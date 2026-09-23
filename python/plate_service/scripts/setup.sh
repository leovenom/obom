#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

# shellcheck disable=SC1091
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

echo "fast-alpr instalado. Modelos ONNX são baixados no primeiro uso."
echo "Inicie com: npm run plates:dev"
