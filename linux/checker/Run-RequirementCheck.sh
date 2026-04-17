#!/usr/bin/env bash
set -euo pipefail
WORKING_DIRECTORY="${1:-$HOME/AccrediCore}"
OUT_FILE="$WORKING_DIRECTORY/logs/system-requirements.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/Check-SystemRequirements.sh" "$WORKING_DIRECTORY" "$OUT_FILE"
echo "Saved report to $OUT_FILE"
