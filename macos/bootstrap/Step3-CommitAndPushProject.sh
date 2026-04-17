#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT="$HOME/AccrediCore/app"
REMOTE_URL=""
COMMIT_MESSAGE="Production-ready installer bootstrap"
while [[ $# -gt 0 ]]; do
  case "$1" in
    -ProjectRoot|--project-root) PROJECT_ROOT="$2"; shift 2 ;;
    -RemoteUrl|--remote-url) REMOTE_URL="$2"; shift 2 ;;
    -CommitMessage|--commit-message) COMMIT_MESSAGE="$2"; shift 2 ;;
    *) shift ;;
  esac
done
cd "$PROJECT_ROOT"
git init
if [[ -n "$REMOTE_URL" ]]; then
  git remote remove origin >/dev/null 2>&1 || true
  git remote add origin "$REMOTE_URL"
fi
git add .
if ! git diff --cached --quiet; then
  git commit -m "$COMMIT_MESSAGE"
else
  echo "No staged changes to commit."
fi
if [[ -n "$REMOTE_URL" ]]; then
  current_branch="$(git branch --show-current || true)"
  [[ -n "$current_branch" ]] || { git checkout -b main; current_branch=main; }
  git push -u origin "$current_branch"
fi
