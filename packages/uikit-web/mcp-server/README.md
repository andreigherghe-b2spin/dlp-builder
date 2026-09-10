# MCP Server — Code Structure

> End-user docs (connecting to Cursor / Claude Desktop, available tools) → [`docs/mcp-server.md`](../../../docs/mcp-server.md)

## Directory layout

```
mcp-server/
├── server.ts              Entry point — creates McpServer, registers all tools, starts transport
│
├── lib/                   Business logic — pure functions, cacheable, no MCP dependency
│   ├── componentDocs.ts  Loads & caches ai-docs.json; parses JSDoc → ComponentDocEntry, PropConstraint
│   ├── themeClasses.ts   Loads & caches config.css / animations.css → ThemeClassesMeta, AnimationsMeta
│   ├── validate.ts        Regex checks + runLint()
│   └── index.ts           Re-exports everything above
│
└── tools/                 MCP tool registration (schema + handler per domain)
    ├── components.ts      list_components · get_component_doc · list_typography_variants
    ├── theme.ts           get_animations · get_tailwind_theme_classes
    └── validate.ts        validate_usage (attempt-based retry loop, lint integration)
```

## Adding a new tool

1. Add business logic to `lib/` (or create a new file and re-export from `lib/index.ts`).
2. Create or extend a file in `tools/` — export a `register*(server: McpServer): void` function.
3. Call it in `server.ts`.

## Component names in, canonical paths out

A component is spelled two ways inside this package and the split is deliberate: the
**export** is PascalCase (`ScrollArea`) and the **file it is published as** is
camelCase (`@ui/web/ScrollArea`). A caller reaching this server holds whichever one
it happened to read — the import statement, a variable, a file path — and which one that
is says nothing about what it meant. Kebab- and snake-cased spellings still arrive too:
the subpaths were kebab-case until the camelCase rename, so an agent working from an
older file, an older prompt or another design system will keep offering `scroll-area`
for a while yet.

So the two sides are treated differently:

| Side                                     | Rule                                   |
| ---------------------------------------- | -------------------------------------- |
| **Names a caller passes in**             | casing and separators ignored          |
| **Subpaths an import actually resolves** | exact — `__fileMap` is the only answer |

`get_component_doc` accepts `ScrollArea`, `scrollArea`, `scroll-area` and
`scroll_area` alike, via `normalizeComponentKey` in `lib/componentDocs.ts`, and
answers with the canonical import line ahead of the doc so the caller does not then have
to guess the path too. A miss suggests near matches rather than an arbitrary first ten.

`validate_usage` stays strict about the subpath, because `dist/` holds exactly one file
under exactly one name. It does single out the most likely mistake — writing the
component's own name as the subpath — since macOS resolves that case-insensitively and
Linux does not, so it passes locally and fails in CI. That case is reported as "the right
component spelled the wrong way" with the canonical import as the fix.

**Loosening the input side is not a licence to loosen the output side.** If a future
change makes `validate_usage` accept a non-canonical subpath, it blesses an import that
breaks on Linux, and the only place that would have caught it is gone.

## validate_usage — how it works

Runs three layers of checks and returns a unified result:

```
files[]  ──►  import path check  (must be the correct package name)
         ──►  component name check (must exist in ai-docs.json)
         ──►  prop value checks   (union types from JSDoc)
         ──►  token checks        (no hardcoded colors / font-sizes / radii)
         ──►  pnpm lint / custom command  (optional, requires lintCwd)
         ──►  { valid, lintPassed, aborted, attemptsRemaining,
                files[].errors[].{message, suggestedFix?}, lintErrors[] }
```

**Batch semantics** — call ONCE per task with ALL `.tsx`/`.jsx` files in a single `files` array. The lint command runs on every invocation, so per-file calls multiply lint cost by N.

**Retry loop** — `attempt` starts at 1 and increments on each call. After `MAX_ATTEMPTS` (5) the tool returns `aborted: true` and `attemptsRemaining: 0`. The agent must stop calling at that point.

### Output flags

| Field               | Meaning                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `valid`             | TRUE iff every file passed UIKit checks AND lint passed.                                                                         |
| `lintPassed`        | TRUE iff the lint command succeeded (or was not requested). Lets the model tell "UIKit ok but lint failing" from "UIKit broken". |
| `aborted`           | TRUE means MAX_ATTEMPTS was reached — stop calling, report to user.                                                              |
| `attemptsRemaining` | Calls left before `aborted` flips to TRUE.                                                                                       |
| `files[].errors[]`  | Per-file UIKit violations. Each has `message` and an optional `suggestedFix` the agent can apply directly.                       |
| `lintErrors[]`      | Raw output lines from the lint command.                                                                                          |

### Checks performed

| Check                       | Source                                  | What it catches                         |
| --------------------------- | --------------------------------------- | --------------------------------------- |
| Wrong import package        | `package.json` `name` field             | `import { Button } from '@wrong/uikit'` |
| Unknown UIKit component     | `ai-docs.json` keys                     | `import { SuperButton } from '@ui/web'` |
| Invalid prop value          | JSDoc `@param {('a'\|'b')}` union types | `<Button variant="hover" />`            |
| Hardcoded Tailwind color    | built-in palette list                   | `bg-blue-500`, `text-red-400`           |
| Hardcoded font-size         | fixed list                              | `text-sm`, `text-xl`                    |
| Unsupported rounded utility | `config.css` radii tokens               | `rounded-lg` when not a design token    |
| Lint errors                 | `pnpm lint` stdout                      | anything ESLint / tsc catches           |

> Regex-based — no AST. Comments and string literals may produce false positives.
