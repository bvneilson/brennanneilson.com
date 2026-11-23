#!/bin/bash
# Stats runner for the Mac launchd job (see ops/README.md).
# Pulls main into a dedicated clone, installs deps only when the lockfile
# changed, then runs scripts/publish-stats.ts with the newest Node 24.
#
# No login shell and no sourcing of ~/.zshenv or ~/.zshrc. Never prints env or argv.
#
# Env knobs:
#   FLAGSHIP_RUNNER_DIR      clone to run from (default $HOME/flagship-runner)
#   FLAGSHIP_RUNNER_SKIP_PULL=1   TESTS ONLY. Skip fetch and pull.
#   FLAGSHIP_RUNNER_DRY_RUN=1     TESTS ONLY. Print node and script paths, do not publish.
set -euo pipefail

RUNNER_DIR="${FLAGSHIP_RUNNER_DIR:-$HOME/flagship-runner}"
LOCK="package-lock.json"

lock_hash() { git -C "$RUNNER_DIR" rev-parse "HEAD:$LOCK" 2>/dev/null || echo none; }

before="$(lock_hash)"
if [ "${FLAGSHIP_RUNNER_SKIP_PULL:-}" != "1" ]; then
  git -C "$RUNNER_DIR" fetch origin main
  git -C "$RUNNER_DIR" pull --ff-only origin main
fi
after="$(lock_hash)"

# R45: highest ~/.nvm/versions/node/v24.*/bin/node by version sort. Fail loudly if none.
NODE_BIN=""
for candidate in "$HOME"/.nvm/versions/node/v24.*/bin/node; do
  [ -x "$candidate" ] && NODE_BIN="$candidate"$'\n'"$NODE_BIN"
done
NODE_BIN="$(printf '%s' "$NODE_BIN" | sed '/^$/d' | sort -V | tail -n 1)"
if [ -z "$NODE_BIN" ]; then
  echo "flagship-runner: no Node 24 found under $HOME/.nvm/versions/node/v24.*/bin/node" >&2
  exit 1
fi
export PATH="$(dirname "$NODE_BIN"):/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

if [ "$before" != "$after" ] || [ ! -d "$RUNNER_DIR/node_modules" ]; then
  (cd "$RUNNER_DIR" && npm ci)
fi

SCRIPT="$RUNNER_DIR/scripts/publish-stats.ts"
if [ "${FLAGSHIP_RUNNER_DRY_RUN:-}" = "1" ]; then
  echo "node=$NODE_BIN"
  echo "script=$SCRIPT"
  exit 0
fi
cd "$RUNNER_DIR"
exec "$NODE_BIN" "$SCRIPT"
