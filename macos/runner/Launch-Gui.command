#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

if command -v node >/dev/null 2>&1; then
  echo "Launching AccrediCore Installer desktop app..."
  npm run app
else
  echo "Node.js is not installed yet. Open index.html in your browser."
fi
