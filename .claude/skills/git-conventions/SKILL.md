---
name: git-conventions
description: Branch, commit and PR naming for B2Spin repos, where every one of the three carries its Jira issue key. Use this skill whenever you are about to create a branch, write a commit message, or open a pull request — and whenever the user mentions starting work on a Jira ticket, asks what to name a branch, asks how to word a commit or PR, or runs git checkout -b / git commit / gh pr create — even if they never say "Jira", "naming" or "convention". Also use it when a git hook rejects a branch name or commit message and you need to fix or rename, and when auditing existing branches or commits for compliance.
---

# Git conventions

Branch, commit and PR are three views of one piece of work, and each one has to
name the ticket it belongs to.

The reason is narrow and practical: Jira's GitHub integration scans branch
names, commit messages and PR titles for issue keys, and links whatever it
finds into the issue's **development panel**. A key that appears nowhere means
the ticket shows no branch, no commits and no PR — so the work looks untouched
to anyone reading Jira, including whoever is writing the weekly Epic report.
Every other rule here exists to make that link cheap and automatic.

## Quick reference

```
branch   <type>/<KEY-123>-<kebab-slug>       feat/TECH-123-button-focus-ring
commit   [KEY-123] <type>(<scope>)?: <what>   [TECH-123] feat(button): add focus ring
PR title [KEY-123] <type>(<scope>)?: <what>   [TECH-123] feat(button): add focus ring
```

`type` is one of `feat fix chore docs refactor test ci perf style build revert`.

## Branch names

`<type>/<KEY-123>-<kebab-slug>` — for example `fix/TECH-140-select-portal-clipping`.

- **type** groups the branch list, so `git branch --list 'fix/*'` still means
  something. Use the same word you would use for the commit.
- **KEY-123** is the Jira key, uppercase, exactly as Jira writes it. Any project
  on the b2spin site is valid — `TECH`, `DSN`, `QA`, `INFRA`, `PLAYF` — not just
  the one you usually work in.
- **slug** is 3–5 lowercase words, hyphen-joined, under ~40 characters. It
  describes the change, not the ticket: `select-portal-clipping`, not
  `fix-bug` and not `tech-140`.

Do not drop the slug. A list of `feat/TECH-123`, `feat/TECH-140`,
`feat/TECH-88` tells a reviewer nothing, and GitHub derives an unreadable PR
title from it — that already happened once here, on PR #8 (`"Feat/tech 26"`).

**Genuinely no ticket?** A typo fix, a lockfile bump nobody filed. Use
`no-ticket/<slug>` and say in the PR body why there is no ticket. This exists so
that skipping the ticket is a visible, reviewable choice rather than a quiet
workaround — if you find yourself reaching for it often, the tickets are missing,
not the convention.

## Commit messages

The key leads, in brackets, then a Conventional Commits subject:

```
[TECH-123] feat(button): add global state tokens
[TECH-140] fix(select): stop the portal clipping inside a dialog
[TECH-88] chore: migrate lint tooling to biome
```

The key goes first so it is visible in every truncated view of a commit — `git
log --oneline`, a GitHub file-blame column, a Slack notification — rather than
falling off the end of the line. Nothing here parses Conventional Commits from
position 0 (changesets derives versions from `.changeset/*.md`, not from
history), so the prefix costs nothing. A repo running `semantic-release` or
`commitlint` would need the key somewhere else.

- Scope is optional and, in this monorepo, is usually the component or package
  the change lives in: `button`, `select`, `themes`, `storybook-web`, `ci`.
- Description is imperative and lowercase: "add", not "added" or "Adds".
- Breaking changes take `!` before the colon: `[TECH-91] feat(tokens)!: drop legacy brands`.

**You do not have to type the key.** The `commit-msg` hook reads it out of the
current branch name and prepends it when the subject has none, printing what it
added. That is the whole point of putting the key in the branch: state it once,
inherit it everywhere. Write the key yourself only when it differs from the
branch's — a drive-by fix belonging to another ticket.

A key that appears in the subject but _not_ as the leading bracket is rejected
rather than moved. Relocating it would mean guessing which of several keys is
the primary one and quietly rearranging your words; the hook tells you where it
belongs instead.

Work that touches several tickets keeps the primary key in the subject and lists
the rest as a footer, which Jira also picks up:

```
[TECH-104] refactor(stepper): split into per-step components

Refs: TECH-105, DSN-1024
```

## Pull requests

Always pass the title explicitly:

```bash
gh pr create --title "[TECH-123] feat(button): add global state tokens" --body "..."
```

The title takes the same shape as the commit subject, so a squash merge lands a
history entry that already conforms and the three surfaces read alike.

Left alone, GitHub derives the title from the branch name and produces
`"Feat/add dev scripts"` or `"Uikit v.1.5 select"` — which is how 17 of this
repo's first 23 PRs got their titles. Under this convention it would derive
`"Feat/TECH-123 button focus ring"`: the key survives, so Jira still links it,
but the bracket, the scope and the readable wording are all gone. Nothing can
enforce this — husky cannot see a PR — so passing `--title` is the whole
mechanism.

The body should open with the Jira link, so a reviewer can reach the ticket in
one click:

```markdown
[TECH-123](https://b2spin.atlassian.net/browse/TECH-123)

## What

One or two sentences on the change.

## Why

The ticket's intent in your own words — reviewers should not have to open Jira
to understand the point.

## Notes

Anything a reviewer would otherwise have to discover: a deliberate omission,
a follow-up ticket, a screenshot for a visual change.
```

## Starting from a ticket

When the user names a ticket and nothing else, get the real summary rather than
guessing at a slug — the summary is also what makes a good PR title.

1. Read the issue with the Jira MCP server: `mcp__atlassian__getJiraIssue` on
   the key (resolve the cloud id via `getAccessibleAtlassianResources` if
   needed; the b2spin site is `1d12fc23-5818-493f-8a54-110c71564c48`).
2. Choose the type from the issue type and what the work actually does — a Jira
   `Task` can perfectly well be a `fix`.
3. Slugify the summary: lowercase, ASCII, drop filler words and any repeat of
   the key, keep 3–5 words that a reviewer would recognise.

```
TECH-140  "Select dropdown is clipped when opened inside a Dialog"
          → fix/TECH-140-select-clipped-in-dialog
```

If the key does not resolve, say so and stop rather than inventing a branch —
a typo'd key silently links the work to nothing, or worse, to another team's
ticket.

## Full loop

```bash
git switch master && git pull                          # branch from current master
git switch -c fix/TECH-140-select-clipped-in-dialog
# …work…
git add -A
git commit -m "fix(select): keep the portal inside the dialog stacking context"
#   → commit-msg prepends [TECH-140]
git push -u origin HEAD                                # pre-push checks the name, then pnpm check
gh pr create --title "[TECH-140] fix(select): keep the portal inside the dialog" \
             --body-file .git/PR_BODY.md
```

## What the hooks enforce

Both live in `scripts/git-hooks/` and are wired up through husky.

| Hook         | Checks                                         | On failure                                                    |
| ------------ | ---------------------------------------------- | ------------------------------------------------------------- |
| `commit-msg` | `[KEY-123]` prefix then a Conventional subject | rejects with the expected shape, or prepends the branch's key |
| `pre-push`   | branch name matches the convention             | rejects before `pnpm check` runs, so the rename is cheap      |

Exempt from the key requirement, by design: `master`, `main`, `develop`,
`master-legacy`, `changeset-release/*` (the release bot's own commits), and
`no-ticket/*`. Merge, revert and `fixup!`/`squash!` commits are left alone
because their wording is git's, not ours.

Escape hatches, and when they are legitimate:

- `SKIP_BRANCH_CHECK=1 git push` — a legacy branch predating the convention,
  like the `uikit_v.*` series.
- `git commit --no-verify` — a genuinely throwaway commit about to be squashed.
- `HUSKY=0 git push` — skips the branch check _and_ the `pnpm check` gate.

Treat these as the user's call, not yours. If a hook rejects something you are
doing, fix the name or the message and say what you changed; do not reach for
`--no-verify` to get moving, because a bypassed commit is exactly the invisible
commit this convention exists to prevent. If a bypass really is the right answer
— the user is mid-rebase, or the branch is legacy — ask first.

## Fixing a name after the fact

- **Branch not yet pushed** — `git branch -m <type>/KEY-123-<slug>`. Free.
- **Branch pushed, no PR yet** — rename locally, then
  `git push origin :old-name && git push -u origin HEAD`.
- **Branch pushed with a PR open** — leave the branch alone. Renaming it closes
  the PR and takes the review comments with it. Fix the PR title instead
  (`gh pr edit <n> --title "…"`) and make sure the key is in it; Jira links from
  the title just as happily as from the branch.
- **A commit already made without a key** — if it is unpushed and on top,
  `git commit --amend` and let the hook prepend. Further back, leave it: an
  interactive rebase to add a key rewrites shared history for a cosmetic gain,
  and the branch and PR already carry the link.
