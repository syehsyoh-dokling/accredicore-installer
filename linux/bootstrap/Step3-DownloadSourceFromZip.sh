#!/usr/bin/env bash
set -euo pipefail
SOURCE_ZIP="${2:-${SOURCE_ZIP:-$HOME/Downloads/accredicore-source.zip}}"
TARGET_DIR="${4:-${TARGET_DIR:-$HOME/AccrediCore/app}}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    -SourceZip|--source-zip) SOURCE_ZIP="$2"; shift 2 ;;
    -TargetDir|--target-dir) TARGET_DIR="$2"; shift 2 ;;
    *) shift ;;
  esac
done
[[ -f "$SOURCE_ZIP" ]] || { echo "Source ZIP not found: $SOURCE_ZIP"; exit 1; }
mkdir -p "$TARGET_DIR"
unzip -o "$SOURCE_ZIP" -d "$TARGET_DIR"
echo "Source extracted to $TARGET_DIR"
