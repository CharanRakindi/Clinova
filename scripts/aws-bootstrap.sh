#!/usr/bin/env bash
# Bootstrap Ubuntu (Lightsail / EC2) for Clinova Docker Compose.
# Usage (on a fresh Ubuntu 22.04+ instance):
#   curl -fsSL https://raw.githubusercontent.com/CharanRakindi/Clinova/main/scripts/aws-bootstrap.sh | bash
# Or after cloning:
#   bash scripts/aws-bootstrap.sh

set -euo pipefail

echo "==> Clinova AWS bootstrap (Docker + Compose)"

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "${USER:-ubuntu}" || true
  echo "    Docker installed. Log out/in (or new SSH session) so 'docker' works without sudo."
else
  echo "==> Docker already installed: $(docker --version)"
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "==> Docker Compose plugin missing — reinstall Docker Engine with Compose."
  exit 1
fi

echo "==> Docker Compose: $(docker compose version)"

if [ ! -d Clinova ] && [ ! -f docker-compose.yml ]; then
  echo "==> Cloning Clinova..."
  git clone https://github.com/CharanRakindi/Clinova.git
  cd Clinova
elif [ -f docker-compose.yml ]; then
  echo "==> Already in Clinova repo"
else
  cd Clinova
fi

if [ ! -f .env.docker ]; then
  cp .env.docker.example .env.docker
  # Generate secrets if still placeholders
  if command -v openssl >/dev/null 2>&1; then
    ACCESS=$(openssl rand -hex 32)
    REFRESH=$(openssl rand -hex 32)
    # portable-ish sed
    if sed --version >/dev/null 2>&1; then
      sed -i "s/replace_with_a_long_random_access_secret_min_32/${ACCESS}/" .env.docker
      sed -i "s/replace_with_a_long_random_refresh_secret_min_32/${REFRESH}/" .env.docker
    else
      sed -i '' "s/replace_with_a_long_random_access_secret_min_32/${ACCESS}/" .env.docker
      sed -i '' "s/replace_with_a_long_random_refresh_secret_min_32/${REFRESH}/" .env.docker
    fi
    echo "==> Generated JWT secrets in .env.docker"
  fi
  PUBLIC_IP=$(curl -fsS https://checkip.amazonaws.com 2>/dev/null || true)
  if [ -n "${PUBLIC_IP}" ]; then
    if sed --version >/dev/null 2>&1; then
      sed -i "s|CLIENT_URL=http://localhost|CLIENT_URL=http://${PUBLIC_IP}|" .env.docker
    else
      sed -i '' "s|CLIENT_URL=http://localhost|CLIENT_URL=http://${PUBLIC_IP}|" .env.docker
    fi
    echo "==> Set CLIENT_URL=http://${PUBLIC_IP}"
  fi
  echo "==> Review .env.docker before starting (nano .env.docker)"
fi

echo ""
echo "Next:"
echo "  1. nano .env.docker     # confirm CLIENT_URL + JWT secrets"
echo "  2. docker compose --env-file .env.docker up --build -d"
echo "  3. docker compose --env-file .env.docker --profile seed run --rm seed"
echo "  4. Open http://YOUR_PUBLIC_IP"
echo ""
echo "Full guide: docs/DEPLOY-AWS.md"
