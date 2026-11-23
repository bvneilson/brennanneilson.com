#!/usr/bin/env bash
# Splits the product walks into those a PR touches (blocking) and the rest (informational), R6.
# Usage: changed-walks.sh <base-ref>   (run after checkout with fetch-depth 0)
# Prints two lines: "blocking=<space-separated spec paths>" and "other=<space-separated spec paths>".
# A change to src/content/projects.ts is treated conservatively: every product walk blocks.
set -euo pipefail
base="${1:?base ref required}"
changed="$(git diff --name-only "origin/${base}...HEAD")"

all=()
for f in truth/*.spec.ts; do
  [ "$f" = "truth/site.spec.ts" ] && continue
  all+=("$f")
done

all_blocking=0
if grep -qx 'src/content/projects.ts' <<<"$changed"; then all_blocking=1; fi

blocking=()
other=()
for f in "${all[@]}"; do
  if [ "$all_blocking" = 1 ] || grep -qx "$f" <<<"$changed"; then
    blocking+=("$f")
  else
    other+=("$f")
  fi
done

echo "blocking=${blocking[*]:-}"
echo "other=${other[*]:-}"
