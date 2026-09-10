#!/usr/bin/env sh
# pre-push: refuse to publish a branch whose name does not carry its Jira key.
#
# This runs before the expensive `pnpm check` because a rename is cheapest right
# now: once the branch is on the remote and a PR is open, renaming it orphans
# the PR and any review comments on it.
#
# It reads the refs being pushed from stdin rather than looking at HEAD, so
# `git push origin some-other-branch` is checked too.
#
# Bypass:  HUSKY=0 git push       (also skips the pnpm check gate)
#          SKIP_BRANCH_CHECK=1 git push   (skips only this check — for the
#          legacy uikit_v.* branches predating the convention)

set -e

[ "${SKIP_BRANCH_CHECK:-0}" = "1" ] && exit 0

DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
# shellcheck source=./lib.sh
. "$DIR/lib.sh"

ZERO='0000000000000000000000000000000000000000'

reject() {
  branch="$1"
  printf '\n\033[31m✗ pre-push\033[0m branch name does not match the convention.\n\n'
  printf '  got:      %s\n' "$branch"
  printf '  expected: <type>/<KEY-123>-<kebab-slug>\n\n'
  printf '  type must be one of: %s\n\n' "$(printf '%s' "$TYPES" | tr '|' ' ')"
  printf '  examples:\n'
  printf '    feat/TECH-123-button-focus-ring\n'
  printf '    fix/TECH-140-select-portal-clipping\n'
  printf '    chore/TECH-88-migrate-to-biome\n\n'
  printf '  Rename it (safe while unpushed):\n'
  printf '    git branch -m <type>/TECH-123-<slug>\n\n'
  printf '  Genuinely no ticket — a typo fix, a dependency bump nobody filed?\n'
  printf '    git branch -m no-ticket/<slug>\n\n'
  printf '  Legacy branch predating the convention:\n'
  printf '    SKIP_BRANCH_CHECK=1 git push\n\n'
  exit 1
}

check() {
  branch="$1"

  if is_exempt_branch "$branch"; then
    # no-ticket/ is the one exemption that still owes us a readable name.
    case "$branch" in
      no-ticket/*)
        no_ticket_branch_is_valid "$branch" || reject "$branch"
        printf '\033[33m→ pre-push\033[0m %s carries no Jira key. Make sure the PR body says why.\n' "$branch"
        ;;
    esac
    return 0
  fi

  branch_is_valid "$branch" || reject "$branch"
}

CHECKED=0
while read -r local_ref local_sha _remote_ref _remote_sha; do
  # A deletion has no local side to name-check.
  [ -z "$local_ref" ] && continue
  [ "$local_sha" = "$ZERO" ] && continue
  case "$local_ref" in
    refs/heads/*) ;;
    *) continue ;;   # tags and anything else are not branches
  esac
  check "${local_ref#refs/heads/}"
  CHECKED=$((CHECKED + 1))
done

# Some git invocations hand the hook nothing on stdin; fall back to HEAD so the
# check is not silently skipped.
if [ "$CHECKED" -eq 0 ]; then
  BRANCH=$(current_branch)
  [ -n "$BRANCH" ] && check "$BRANCH"
fi

exit 0
