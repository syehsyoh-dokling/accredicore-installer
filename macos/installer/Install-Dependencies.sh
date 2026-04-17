#!/usr/bin/env bash
set -euo pipefail

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required. Install it first from https://brew.sh"
  exit 1
fi

brew update
brew install git node pnpm gh php composer jq
brew install --cask docker

echo "Dependency installation finished. Start Docker Desktop once before running checks again."
