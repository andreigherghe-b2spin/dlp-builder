# Testing

Unit tests are written with [Vitest](https://vitest.dev/).

## Running tests

```bash
# All packages
pnpm test

# Single package
pnpm -F @ui/web test

# Watch mode (re-runs on file change)
pnpm -F @ui/web test:watch
```

## File structure

Test files live in a `__tests__/` folder next to the code they cover:

```
mcp-server/
  __tests__/
    validate.test.ts
  lib/
    validate.ts
```

## Pre-commit hook

Tests for **affected packages only** run automatically before each commit (via Husky + Turbo):

```bash
pnpm turbo run test --filter=...[HEAD^1]
```

New packages with a `test` script are picked up automatically — no extra config needed.

## CI

Tests run on every pull request and push to `main` (`.github/workflows/test.yml`).
Can also be triggered manually via **Actions → Test → Run workflow**.
