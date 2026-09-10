#!/usr/bin/env sh
# Shared definitions for the git-convention hooks.
#
# One place defines what a valid branch name, commit subject and Jira key look
# like, so `commit-msg` and `pre-push` can never drift apart. The same patterns
# are documented for humans in .claude/skills/git-conventions/SKILL.md — change
# them together.

# Commit/branch types. Conventional Commits' set, which is also what the
# changesets release notes and `git log --oneline` scanning assume.
TYPES='feat|fix|chore|docs|refactor|test|ci|perf|style|build|revert'

# A Jira key: an uppercase project key plus a number. Deliberately generic —
# the b2spin site has 50+ projects (TECH, DSN, QA, INFRA, PLAYF, …) and a
# branch may legitimately reference any of them.
KEY_RE='[A-Z][A-Z0-9]*-[0-9]+'

# A kebab slug: lowercase words joined by single hyphens.
SLUG_RE='[a-z0-9]+(-[a-z0-9]+)*'

# Branches that carry no ticket by design: long-lived trunks, the changesets
# release bot, and the explicit `no-ticket/` escape hatch.
is_exempt_branch() {
  case "$1" in
    master|main|develop|master-legacy) return 0 ;;
    changeset-release/*)               return 0 ;;
    no-ticket/*)                       return 0 ;;
    *)                                 return 1 ;;
  esac
}

# The full branch contract: <type>/<KEY-123>-<slug>
branch_is_valid() {
  printf '%s' "$1" | grep -Eq "^($TYPES)/${KEY_RE}-${SLUG_RE}\$"
}

# `no-ticket/` still needs a readable slug, so it is checked rather than waved through.
no_ticket_branch_is_valid() {
  printf '%s' "$1" | grep -Eq "^no-ticket/${SLUG_RE}\$"
}

# Pull the key out of a branch name so commits can inherit it automatically.
key_from_branch() {
  printf '%s' "$1" | grep -oE "$KEY_RE" | head -1
}

current_branch() {
  git symbolic-ref --quiet --short HEAD 2>/dev/null || printf ''
}
