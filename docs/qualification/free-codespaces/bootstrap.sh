#!/usr/bin/env bash
# Run only after included compute/storage and blocked paid spending are verified.
set -eo pipefail
if [ "$(uname -s)" != Linux ] || [ "${CODESPACES:-}" != true ]; then
  printf '%s\n' 'Use the verified Linux Codespace for this prepared route.'
  exit 1
fi
if [ "$(git rev-parse HEAD)" != a7c333699dad0d70cf0de8e2f8a841a00396d0d7 ] || ! git diff --quiet HEAD; then
  printf '%s\n' 'Expected clean a7 source. Preserve existing work; do not reset it.'
  exit 1
fi
if [ "$(node -p 'process.versions.node' 2>/dev/null || true)" != 24.19.0 ]; then
  ecoNvmFile="${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  if [ ! -r "$ecoNvmFile" ]; then
    printf '%s\n' 'Node 24.19.0 required; bundled NVM unavailable. No test started.'
    exit 1
  fi
  . "$ecoNvmFile"
  nvm install 24.19.0
  nvm use 24.19.0
fi
node --check work/eco-free-codespaces.mjs
node work/eco-free-codespaces.mjs --included-usage-confirmed
