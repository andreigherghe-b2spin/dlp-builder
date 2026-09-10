# Local Development Against a Brand App (`dev:web:link`)

`pnpm dev:web:link` lets you see local `@ui/web` / `@ui/themes` changes in a real brand app
(e.g. `ui-b2spin-monorepo`) without publishing a version. It builds both packages, copies their
`dist/` into the brand repo's **root** `node_modules/@ui/*`, then watches `src/` in both packages
and re-syncs after every successful rebuild.

```
packages/uikit-web/src    ─┐
packages/uikit-themes/src ─┴─ build ──▶ dist/ ──▶ content-diff sync ──▶ <brand-repo>/node_modules/@ui/{web,themes}
```

Two facts explain the rest of this doc:

- The brand repo sets `nodeLinker: hoisted` (`pnpm-workspace.yaml`), so **one** sync into the root
  `node_modules` serves every brand app in that repo. You never need a second dev-link process.
- The sync is **content-diffed**, not mtime-based. A rebuild that produces identical bytes copies
  nothing, so the brand app's dev server doesn't see a change and doesn't reload.

## Prerequisites

1. The brand repo is cloned. The default target is the sibling directory `../ui-b2spin-monorepo`;
   pass a path to use a different location.
2. The brand repo's dependencies are already installed (`pnpm install-deps` there). Preflight exits
   with an error if `node_modules/@ui/web` or `node_modules/@ui/themes` is missing — dev-link
   overwrites an existing install, it does not create one.
3. `pnpm install` has been run in this repo.

If the local `@ui/web` version differs from the one installed in the brand repo, you'll see a
`warning: local @ui/web is vX, brand repo has vY installed`. That's expected and harmless — the
sync replaces the installed files regardless of version.

## Quick start

Two terminals:

```sh
# terminal 1 — in b2spin-uikit
pnpm dev:web:link                          # defaults to ../ui-b2spin-monorepo
pnpm dev:web:link ../ui-b2spin-monorepo    # or an explicit path
```

```sh
# terminal 2 — in ui-b2spin-monorepo
pnpm local:mcluck
```

Wait for `[dev-link] initial sync complete.` in terminal 1 before starting the brand dev server.
Then edit any file under `packages/uikit-web/src/`, save, and watch terminal 1 print
`[dev-link] @ui/web: synced (1 copied, 0 deleted)` — the brand app hot-reloads on its own.

## Brand → app mapping

One `dev:web:link` process covers all four brands; you don't need to restart it when switching.

| Brand           | Brand repo command         | App directory              | Theme CSS consumed                  |
| --------------- | -------------------------- | -------------------------- | ----------------------------------- |
| `mcluck`        | `pnpm local:mcluck`        | `apps/b2spin-ui`           | `@ui/themes/dist/mcluck.css`        |
| `spinblitz`     | `pnpm local:spinblitz`     | `apps/b2-scratchful-ui`    | `@ui/themes/dist/spinblitz.css`     |
| `playfame`      | `pnpm local:playfame`      | `apps/b2-playfame-ui`      | `@ui/themes/dist/playfame.css`      |
| `hellomillions` | `pnpm local:hellomillions` | `apps/b2-hellomillions-ui` | `@ui/themes/dist/hellomillions.css` |

Each app picks its theme file in its own `postcss.config.mjs`. Use `pnpm local` (no suffix) in the
brand repo to run all four at once.

## Flags

| Flag             | Default                 | Effect                                                                                                     |
| ---------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `[path]`         | `../ui-b2spin-monorepo` | Positional argument — root of the target brand repo                                                        |
| `--dts`          | off                     | Keep `.d.ts` generation on watch rebuilds. Slower, but needed when the brand app must typecheck new props. |
| `--once`         | off                     | Build and sync once, then exit. Use for a one-shot check or non-interactive verification.                  |
| `--touch <path>` | —                       | `utimes` a file (path relative to the target repo) after each sync, to nudge a bundler that missed it.     |
| `--verbose`      | off                     | Stream the child builds' output and log per-sync detail.                                                   |

```sh
pnpm dev:web:link ../ui-b2spin-monorepo --dts --verbose
```

## How the sync stays safe

Behaviours worth knowing about, all in `scripts/dev-link.mjs` unless noted:

- **Initial build is a full build** (`UIKIT_NO_SPLIT=1`, with `.d.ts` and the MCP server). If it
  fails, the script exits without syncing anything.
- **Watch rebuilds are fast**: `UIKIT_DEV_LINK=1` makes `packages/uikit-web/tsup.config.ts` skip
  `dts`, `clean`, the MCP-server rebuild, and the theme copy. Saves are debounced 200 ms and
  concurrent saves coalesce into one rebuild.
- **A failed rebuild syncs nothing**, so the brand app keeps the last working build.
- **Files are compared by content**, so an unrelated entry that rebuilds to identical bytes is a
  no-op. This is what stops reload storms in the brand app.
- **Writes are atomic**: each file is staged in `node_modules/.uikit-dev-link-tmp` and then renamed
  into place, so the brand app's bundler and CSS scanner never see a partial `.tmp` file inside a
  directory they're watching.
- **Copy happens before delete**, so the consumer never observes a missing module — worst case is a
  stale extra chunk for a moment.
- **Code splitting is disabled** for dev-link builds, so output filenames are stable per entry and
  one edit doesn't rename shared chunks across the whole package.
- **Install-clobber recovery**: each synced package gets a `.uikit-dev-link` marker file, polled every
  5 s. If someone runs an install in the brand repo and wipes it, dev-link re-syncs automatically.
- **New and deleted components are picked up** — tsup's entry list is re-evaluated on every rebuild.

## Stopping and cleanup

`Ctrl+C` stops watching but **does not** restore the registry versions — the brand repo's
`node_modules/@ui/*` keeps your local dev builds. To go back to the published versions, run the
brand repo's install command:

```sh
# in ui-b2spin-monorepo
pnpm install-deps
```

## Troubleshooting

| Symptom                                             | Cause                                                                    | Fix                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `Target repo not found: ...`                        | Wrong or missing path                                                    | Pass the brand repo path explicitly                                    |
| `.../@ui/web/package.json not found`                | Brand repo dependencies not installed                                    | Run `pnpm install-deps` in the brand repo first                        |
| Theme token change doesn't show up                  | PostCSS `importFrom` reads the brand CSS file once at dev-server startup | Restart the brand dev server                                           |
| Brand app typecheck errors on a prop you just added | Watch-mode rebuilds skip `.d.ts`                                         | Re-run with `--dts`                                                    |
| Brand app still on local dev builds after `Ctrl+C`  | dev builds are deliberately left in place                                | `pnpm install-deps` in the brand repo                                  |
| Nothing seems to sync on save                       | The rebuild produced identical bytes, or the build failed                | Re-run with `--verbose` to see the build output and per-sync detail    |
| Brand app reloads constantly                        | `--touch` is pointed at a file the brand app's dev server watches        | Drop `--touch`, or point it at a file outside the watched source tree  |
| `local @ui/web is vX, brand repo has vY` warning    | Version drift between repos                                              | Ignore — it doesn't affect the sync                                    |
| Change visible in one app but not another           | The other app's dev server was started before the initial sync           | Restart that app's dev server; one dev-link process serves all of them |

## For AI agents

- Confirm the brand repo path before running. Default is the sibling `../ui-b2spin-monorepo`.
- Never edit files under a brand repo's `node_modules/@ui/*`. They're generated and will be
  overwritten on the next sync — edit `packages/uikit-web/src/` or `packages/uikit-themes/src/`.
- For a non-interactive verification build, use `--once` instead of the watching form, which never
  exits.
- If you need the brand app running, start it as a separate background process in the brand repo and
  wait for `initial sync complete.` in the dev-link output first.
- Never commit changes made inside the brand repo as part of a uikit change — dev-link only touches
  its `node_modules`, which is not tracked.
- Publishing still goes through the changeset workflow; dev-link is not a release path. See
  [changeset-publish-new-version.md](changeset-publish-new-version.md).
