#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
STAGE_DIR="$DIST_DIR/package"
VERSION="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).version)" "$ROOT_DIR/manifest.json")"
ARCHIVE_NAME="linkedin-pet-avatars-v${VERSION}.zip"
ARCHIVE_PATH="$DIST_DIR/$ARCHIVE_NAME"

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR" "$DIST_DIR"
rm -f "$ARCHIVE_PATH"

rsync -a \
  --exclude '.DS_Store' \
  --exclude 'dist' \
  --exclude 'output' \
  --exclude 'store' \
  --exclude 'scripts' \
  --exclude 'icons/icon1024-open-to-snacks.png' \
  --exclude 'README.md' \
  --exclude 'PRIVACY.md' \
  --exclude 'SUPPORT.md' \
  --exclude '.gitignore' \
  --exclude 'package.json' \
  "$ROOT_DIR/" "$STAGE_DIR/"

(
  cd "$STAGE_DIR"
  zip -qr "$ARCHIVE_PATH" .
)

echo "Created $ARCHIVE_PATH"
