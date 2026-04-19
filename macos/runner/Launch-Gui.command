#!/usr/bin/env bash
set -u

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

show_notice() {
  local title="$1"
  local message="$2"
  echo ""
  printf '%*s\n' 72 '' | tr ' ' '='
  echo "$title"
  printf '%*s\n' 72 '' | tr ' ' '='
  echo "$message"
  printf '%*s\n' 72 '' | tr ' ' '='
  echo ""
}

confirm_action() {
  local question="$1"
  local answer
  printf "%s [Y/N] " "$question"
  read -r answer
  case "$(printf '%s' "$answer" | tr '[:upper:]' '[:lower:]')" in
    y|yes) return 0 ;;
    *) return 1 ;;
  esac
}

open_browser() {
  local target="$1"
  if command -v open >/dev/null 2>&1; then
    open "$target" >/dev/null 2>&1 || true
  else
    echo "Please open manually: $target"
  fi
}

open_fallback() {
  echo "Opening browser-only fallback. Native Step 1 checks require the desktop launcher."
  open_browser "$REPO_ROOT/index.html"
}

if ! command -v node >/dev/null 2>&1; then
  show_notice \
    "Required component missing: Node.js LTS" \
    "Your device does not have Node.js installed. The native installer needs Node.js and npm to start the desktop launcher. If you continue, we will open the official Node.js download page. After installing Node.js LTS, run Launch-Gui.command again."

  if confirm_action "Do you agree to open the Node.js LTS download page now?"; then
    open_browser "https://nodejs.org/en/download"
  fi

  open_fallback
  exit 0
fi

if ! command -v npm >/dev/null 2>&1; then
  show_notice \
    "Required component missing: npm" \
    "Node.js was found, but npm is not available. npm is required to prepare the launcher dependencies. Please reinstall Node.js LTS with npm enabled, then run this launcher again."
  open_fallback
  exit 0
fi

if [ ! -x "$REPO_ROOT/node_modules/.bin/electron" ]; then
  show_notice \
    "Launcher dependency setup required" \
    "Your device does not have the local launcher dependencies yet. The installer needs to download and install Electron and related packages into this extracted installer folder. This may take a few minutes and requires internet access on first launch."

  if ! confirm_action "Do you agree to download and install the launcher dependencies now?"; then
    echo "Dependency setup was cancelled by the user."
    open_fallback
    exit 0
  fi

  echo "Running npm install. Please wait..."
  npm install
  npm_status=$?
  if [ "$npm_status" -ne 0 ]; then
    show_notice \
      "Dependency setup failed" \
      "The launcher could not finish npm install. Please check your internet connection, security restrictions, or proxy settings. We will open the browser-only fallback now."
    open_fallback
    exit "$npm_status"
  fi
fi

echo "Launching AccrediCore Installer desktop app..."
npm run app
app_status=$?
if [ "$app_status" -ne 0 ]; then
  show_notice \
    "Desktop app launch failed" \
    "The desktop launcher could not start. We will open the browser-only fallback now."
  open_fallback
  exit "$app_status"
fi
