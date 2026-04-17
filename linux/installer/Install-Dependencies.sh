#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Please run with sudo or as root."
  exit 1
fi

if command -v apt-get >/dev/null 2>&1; then
  apt-get update
  apt-get install -y git curl unzip jq ca-certificates gnupg lsb-release nodejs npm php-cli composer docker.io docker-compose-plugin
elif command -v dnf >/dev/null 2>&1; then
  dnf install -y git curl unzip jq nodejs npm php-cli composer docker docker-compose
elif command -v yum >/dev/null 2>&1; then
  yum install -y git curl unzip jq nodejs npm php-cli composer docker
elif command -v pacman >/dev/null 2>&1; then
  pacman -Sy --noconfirm git curl unzip jq nodejs npm php composer docker docker-compose
elif command -v zypper >/dev/null 2>&1; then
  zypper --non-interactive install git curl unzip jq nodejs20 npm20 php8 composer docker docker-compose
else
  echo "Unsupported Linux package manager. Install dependencies manually."
  exit 1
fi

systemctl enable docker || true
systemctl start docker || true

echo "Dependency installation finished."
