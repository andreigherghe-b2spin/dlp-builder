# B2Spin UIKit

A monorepo with UI components for web and native platforms. Built on top of Turborepo + pnpm workspaces.
The project uses [mise](https://mise.jdx.dev/) for tool version management.
**Do not use nvm** — all required versions are defined in `mise.toml`.

## Structure

```
apps/
  storybook-web       # Storybook for web components
  storybook-native    # Storybook for React Native components
packages/
  uikit-web           # UI components for web (publishable module)
  uikit-native        # UI components for React Native (publishable module)
  uikit-themes        # Themes and tokens (publishable module)
```

## Getting Started

### 1. Install mise

If `mise` is not yet installed, see the [instructions](https://mise.jdx.dev/getting-started.html).

### 2. Trust and install tools

```sh
mise trust
mise install
```

### 3. Install dependencies

```sh
pnpm install
```

### 4. Build packages

Before running Storybook, you need to build the packages:

```sh
pnpm build
```

## Linting & Formatting

```sh
pnpm lint          # ESLint across all packages
pnpm lint:fix      # auto-fix
pnpm format        # Prettier, writes changes
pnpm format:check  # Prettier, check only (used in CI)
pnpm typecheck     # tsc --noEmit across all packages
```

Staged files are linted and formatted automatically on commit via husky + lint-staged.

Run `git config blame.ignoreRevsFile .git-blame-ignore-revs` once locally so `git blame` skips the
repo-wide Prettier reformat commit (GitHub's web UI honors this file automatically).

## Running Storybook

### Web

Link to storybook on Vercel - https://uikit-storybook-web.vercel.app/

```sh
pnpm dev       # all apps
pnpm dev:web   # storybook-web only
```

### Native (React Native)

```sh
pnpm dev:native   # starts storybook-native
```

To run on iOS specifically:

```sh
pnpm -F storybook-native ios
```

## Local Development Against a Brand App

To see changes to `@ui/web` / `@ui/themes` live in a brand app (e.g. `ui-b2spin-monorepo`) without publishing a new version:

```sh
pnpm dev:web:link [path-to-brand-repo]   # defaults to sibling ../ui-b2spin-monorepo
```

This builds both packages, syncs their `dist/` into the brand repo's `node_modules/@ui/*`, then watches `src/` and re-syncs on every rebuild. Run it alongside the brand repo's own dev server (e.g. `pnpm local:<brand>`). See [docs/dev-web-link.md](docs/dev-web-link.md) for flags, the brand → app mapping, and troubleshooting.

## Using Packages in Another Project

Packages are published to a private GCP Artifact Registry: [europe/npm-ui](https://console.cloud.google.com/artifacts/npm/b2spin-hub/europe/npm-ui?project=b2spin-hub)

Add to `.npmrc` — the same two lines this repo's own `.npmrc` carries:

```
@ui:registry=https://europe-npm.pkg.dev/b2spin-hub/npm-ui/
//europe-npm.pkg.dev/b2spin-hub/npm-ui/:always-auth=true
```

Then install the packages you need:

```sh
pnpm add @ui/web      # React web components
pnpm add @ui/native   # React Native components
pnpm add @ui/themes   # Themes and design tokens
```

## Documentation

| Doc                                                                            | Description                                                                       |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)                                   | Monorepo structure, component model, and end-to-end multi-brand theming mechanics |
| [docs/design-system-basics.md](docs/design-system-basics.md)                   | Conceptual primer on design tokens, UI kits, component libraries, and shadcn/ui   |
| [docs/tests.md](docs/tests.md)                                                 | How to run unit and visual regression tests                                       |
| [docs/dev-web-link.md](docs/dev-web-link.md)                                   | Local development of `@ui/web` + `@ui/themes` against a brand app                 |
| [docs/mcp-server.md](docs/mcp-server.md)                                       | MCP server setup for AI coding assistants (Cursor, Claude Desktop, etc.)          |
| [docs/changeset-publish-new-version.md](docs/changeset-publish-new-version.md) | Step-by-step guide for versioning and publishing packages with Changesets         |
