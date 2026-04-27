#!/usr/bin/env bash
set -Eeuo pipefail

BRANCH="${1:-}"

if [[ -z "$BRANCH" ]]; then
  echo "Usage: $0 <branch>"
  echo "Example: $0 dev"
  exit 1
fi

REPO_DIR="${REPO_DIR:-/opt/InterVUZ-frontend}"
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/intervuz-frontend}"
NGINX_SERVICE="${NGINX_SERVICE:-nginx}"

log() {
  printf '[deploy] %s\n' "$1"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: command '$1' is not installed"
    exit 1
  fi
}

require_cmd git
require_cmd npm
require_cmd rsync
require_cmd nginx
require_cmd systemctl

if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "Error: '$REPO_DIR' is not a git repository"
  exit 1
fi

if [[ -n "$(git -C "$REPO_DIR" status --porcelain)" ]]; then
  echo "Error: repository has uncommitted changes: $REPO_DIR"
  echo "Commit/stash them before deploy."
  exit 1
fi

log "Fetching origin..."
git -C "$REPO_DIR" fetch --prune origin

if ! git -C "$REPO_DIR" show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
  echo "Error: branch 'origin/$BRANCH' not found"
  exit 1
fi

if git -C "$REPO_DIR" rev-parse --verify --quiet "$BRANCH" >/dev/null; then
  log "Checking out existing local branch '$BRANCH'..."
  git -C "$REPO_DIR" checkout "$BRANCH"
else
  log "Creating local tracking branch '$BRANCH'..."
  git -C "$REPO_DIR" checkout -b "$BRANCH" --track "origin/$BRANCH"
fi

log "Pulling latest commits..."
git -C "$REPO_DIR" pull --ff-only origin "$BRANCH"

log "Installing dependencies..."
cd "$REPO_DIR"
npm ci

log "Building frontend..."
npm run build

if [[ ! -d "$REPO_DIR/dist" ]]; then
  echo "Error: build output '$REPO_DIR/dist' not found"
  exit 1
fi

log "Copying build to '$DEPLOY_DIR'..."
sudo mkdir -p "$DEPLOY_DIR"
sudo rsync -a --delete "$REPO_DIR/dist/" "$DEPLOY_DIR/"
sudo chown -R www-data:www-data "$DEPLOY_DIR"

log "Validating nginx config..."
sudo nginx -t

log "Restarting nginx..."
sudo systemctl restart "$NGINX_SERVICE"
sudo systemctl is-active --quiet "$NGINX_SERVICE"

log "Deploy completed successfully."
