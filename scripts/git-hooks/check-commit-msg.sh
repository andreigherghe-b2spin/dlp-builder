#!/usr/bin/env sh
# commit-msg: keep every commit subject Jira-linked and Conventional.
#
#   [TECH-123] feat(button): add global state tokens
#
# The key is what makes a commit show up in the Jira issue's development panel,
# so a commit without one is invisible from the ticket even though the work is
# done. Rather than reject you for forgetting it, this hook reads the key out of
# the branch you are on and prepends it — the branch already had to carry one,
# so the information is right there. It only stops you when it genuinely cannot
# tell which ticket you mean, or when a key is present but in the wrong place.
#
# Bypass for a throwaway or WIP commit:  git commit --no-verify

set -e

MSG_FILE="$1"
[ -n "$MSG_FILE" ] && [ -f "$MSG_FILE" ] || exit 0

DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
# shellcheck source=./lib.sh
. "$DIR/lib.sh"

SUBJECT=$(sed -n '1p' "$MSG_FILE")

# Everything git itself writes or rewrites: merges, reverts, and the autosquash
# commits that get folded into another commit later. Their shape is not ours to
# dictate, and a `fixup!` subject must stay byte-identical to match its target.
case "$SUBJECT" in
  Merge\ *|Revert\ *|fixup!*|squash!*|amend!*) exit 0 ;;
  '#'*|'') exit 0 ;;
esac

fail() {
  printf '\n\033[31m✗ commit-msg\033[0m %s\n\n' "$1"
  shift
  for line in "$@"; do
    if [ -z "$line" ]; then printf '\n'; else printf '  %s\n' "$line"; fi
  done
  printf '\n  Bypass once with: git commit --no-verify\n\n'
  exit 1
}

EXAMPLES='[TECH-123] feat(button): add global state tokens
[TECH-140] fix(select): stop the portal clipping inside a dialog
[TECH-88] chore: bump biome to 2.3.0'

# --- 1. Split off the [KEY-123] prefix, if there is one --------------------
REST="$SUBJECT"
HAS_PREFIX=0
if printf '%s' "$SUBJECT" | grep -Eq "^\[${KEY_RE}\] "; then
  HAS_PREFIX=1
  REST=$(printf '%s' "$SUBJECT" | sed -E "s/^\[${KEY_RE}\] //")
fi

# --- 2. What follows the prefix must be a Conventional subject -------------
if ! printf '%s' "$REST" | grep -Eq "^($TYPES)(\([a-z0-9./-]+\))?!?: .+"; then
  fail "subject does not match the commit format." \
    "got:      $SUBJECT" \
    "expected: [KEY-123] <type>(<scope>)?: <description>" \
    "" \
    "type must be one of: $(printf '%s' "$TYPES" | tr '|' ' ')" \
    "" \
    "examples:" \
    "$EXAMPLES"
fi

check_length() {
  if [ "$(printf '%s' "$1" | wc -c)" -gt 100 ]; then
    printf '\033[33m→ commit-msg\033[0m subject is over 100 characters; consider shortening it.\n'
  fi
}

if [ "$HAS_PREFIX" -eq 1 ]; then
  check_length "$SUBJECT"
  exit 0
fi

# --- 3. A key loose in the subject is misplaced, not missing ----------------
# Rewriting it into the prefix would mean guessing which of several keys is the
# primary one, and quietly moving text around someone's subject. Say so instead.
if printf '%s' "$REST" | grep -Eq "$KEY_RE"; then
  LOOSE=$(printf '%s' "$REST" | grep -oE "$KEY_RE" | head -1)
  fail "the Jira key goes at the front of the subject, in brackets." \
    "got:      $SUBJECT" \
    "expected: [$LOOSE] <type>(<scope>)?: <description>" \
    "" \
    "Secondary tickets belong in a footer instead, which Jira also reads:" \
    "  Refs: TECH-105, DSN-1024"
fi

# --- 4. No key anywhere in the subject: inherit it from the branch ----------
BRANCH=$(current_branch)
KEY=$(key_from_branch "$BRANCH")

if [ -n "$KEY" ]; then
  TMP="$MSG_FILE.jira"
  awk -v key="$KEY" 'NR==1 { printf "[%s] %s\n", key, $0; next } { print }' \
    "$MSG_FILE" > "$TMP" && mv "$TMP" "$MSG_FILE"

  NEW_SUBJECT=$(sed -n '1p' "$MSG_FILE")
  printf '\033[33m→ commit-msg\033[0m added %s from the branch name:\n  %s\n' "$KEY" "$NEW_SUBJECT"
  check_length "$NEW_SUBJECT"
  exit 0
fi

if is_exempt_branch "$BRANCH"; then
  # A trunk, the release bot, or a declared no-ticket branch. Format is
  # enforced above; the key is genuinely not applicable here.
  exit 0
fi

fail "no Jira key in the subject, and none to inherit from the branch." \
  "branch:  ${BRANCH:-(detached HEAD)}" \
  "" \
  "Either put the key at the front:" \
  "  [TECH-123] $SUBJECT" \
  "" \
  "or move to a properly named branch:" \
  "  git branch -m <type>/TECH-123-<slug>" \
  "" \
  "Genuinely no ticket? Use a no-ticket/<slug> branch and say why in the body."
