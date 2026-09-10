---
name: migrate-component-to-ds-v2
description: Migrates a component in packages/uikit-web to Design System v2 Figma semantic tokens. Use when migrating, porting, or restyling a uikit-web component to the new design system, when a Figma DS Components node is given for an existing component, or when replacing legacy per-component CSS variables (--button-default-*, --input-*, --badge-*) with DS v2 tokens (--color-background-*, --components-*, --typography-font-size-*).
---

# Migrate a component to Design System v2

Two token systems coexist in `packages/uikit-themes`. Migration means moving a component off the
first and onto the second.

|         | Legacy                              | DS v2                                        |
| ------- | ----------------------------------- | -------------------------------------------- |
| Shape   | one var per component per property  | shared semantic tokens                       |
| Example | `--button-default-background-color` | `--color-background-brand-primary-container` |
| Source  | hand-authored                       | exported from the Figma DS Components file   |

DS v2 **colors** are bridged into Tailwind via `@theme inline`, so they have real utility classes.
Everything else (`--components-*`, `--typography-*`) is **not** bridged and must be referenced with
arbitrary property syntax.

## Workflow

Copy this checklist and track progress:

```
- [ ] 1. Read the Figma node
- [ ] 2. Map Figma variables to repo tokens
- [ ] 3. Flatten Figma's nested frames
- [ ] 4. Rewrite the component classes
- [ ] 5. Promote the migrated story from WIP
- [ ] 6. Rebuild themes and verify
- [ ] 7. Update docs, story, snapshots
- [ ] 8. Delete obsolete legacy component variables
```

### 1. Read the Figma node

Call `get_design_context` with the `fileKey` and `nodeId` from the Figma URL (convert `node-id=7-367`
to `7:367`). Follow the `figma-design-to-code` skill. Treat the returned JSX as a **reference for
intent and measurements only** — never paste it.

If the node is a component set, read the specific variant node the user pointed at, not the parent.

### 2. Map Figma variables to repo tokens

Figma emits slash-delimited names. Derive a candidate by replacing `/` with `-`, then **verify the
candidate exists** before using it:

```bash
rg -- '--color-background-brand-primary-container' packages/uikit-themes/src
```

Verification is mandatory because the mapping is **not** purely mechanical — Figma's
`primarycontainer` becomes `primary-container`, but `accent1container` stays `accent1container`.

| Figma variable                                | Repo token                                      | Tailwind class                                 |
| --------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| `--color/background/brand/primarycontainer`   | `--color-background-brand-primary-container`    | `bg-background-brand-primary-container`        |
| `--color/foreground/brand/onprimarycontainer` | `--color-foreground-brand-on-primary-container` | `text-foreground-brand-on-primary-container`   |
| `--color/border/neutral/default`              | `--color-border-neutral-default`                | `border-border-neutral-default`                |
| `--radius/base`                               | `--radius-base`                                 | `rounded-base`                                 |
| `--radius/offset4`                            | `--radius-offset4`                              | `rounded-offset4`                              |
| `--components/button/radius`                  | `--components-button-radius` (alias → base)     | `rounded-(--components-button-radius)`         |
| `--components/button/border`                  | `--components-button-border` (alias → border)   | `border-(length:--components-button-border)`   |
| `--typography/fontsize/label/l`               | `--typography-font-size-label-l`                | `text-(length:--typography-font-size-label-l)` |
| `--typography/fontweight/bold`                | `--typography-font-weight-bold`                 | `font-(--typography-font-weight-bold)`         |

Prefer bridged radius utilities (`rounded-base`, `rounded-offset*`) for new work.
`--components-*-radius` / `--components-*-border` remain as brand-file aliases so existing
components keep working.

Two Figma families have **no repo equivalent**:

- `--spacing/space-*` — does not exist. Use the Tailwind scale: `px / 4`. Figma `space-8` (8px) is `p-2`.
- `--opacity/opacity-*` — does not exist. `opacity-100` means fully opaque, so emit nothing.

If a colour maps to no DS v2 token, stop and ask. Do not hardcode a hex value.

### 3. Flatten Figma's nested frames

Figma wraps content in extra auto-layout frames that carry their own padding. Do **not** reproduce
those wrappers as `<div>`s. Fold their spacing into the root element's padding and `gap`.

Worked example — the Button node nests a padded `Label` frame:

```
Figma:  root px-8(8px) + gap-0  →  Label frame px-8(8px)  →  text
Effective: text-only = 8+8 = 16px edge padding
           with icons = 8px edge padding, 8px icon-to-text
```

```tsx
// Correct: one element, padding folded, gap handles icon spacing
default: "h-10 px-4 py-0 has-[>svg]:px-2"   // + gap-2 on the base
```

Never emit two competing values for the same property (`px-4 ... px-2` silently keeps the last one).

### 4. Rewrite the component classes

Keep the file's existing structure: `const base`, `const config = { variants }`, `cva(base, config)`,
JSDoc, component, `export { X, xVariants }`. Preserve `cn()` and every prop signature.

Two things are deliberately **not** preserved, because a rewrite is when they go:

- **`data-slot`** — the attribute and any style selector reading one. Parts are addressed by
  `data-testid` derived from the root; see "Test ids" in CLAUDE.md.
- **`asChild`**, where the component renders the element itself — it becomes `as`. No component
  in the kit owns an `asChild` prop any more; what is left of it is a Radix primitive's own
  (`<DropdownMenuTrigger asChild>` and friends), where the consumer supplies the element rather
  than naming it.

- **Colours** → bridged utility classes (`bg-*`, `text-*`, `border-*`).
- **Radius, border width, font size, font weight** → arbitrary property syntax against the raw var
  (`rounded-(--components-*)`, `text-(length:--typography-*)`). That is the only intended use of
  arbitrary syntax for tokens that are not bridged into `@theme`.
- **Spacing and sizing** → Tailwind scale (`px / 4`), never `[8px]`.

**Prefer named utilities; use as few `[arbitrary]` values as possible.** Reach for
`bg-*` / `bg-linear-*` / `shadow-*` / scale spacing before inventing
`[background:…]`, `[box-shadow:…]`, or other raw CSS in brackets. Compose layers with separate
utilities when Figma emits a multi-layer shorthand (e.g. solid `bg-*` + overlay
`hover:bg-linear-[0deg,var(--color-background-state-hover),var(--color-background-state-hover)]`
instead of one `[background:linear-gradient(...),var(...)]`). Arbitrary brackets are a last
resort when no utility can express the intent.

**Never repeat the same class inside variants.** If a value is shared by most or all variants
(e.g. `rounded-(--components-button-radius)`, `border-(length:--components-button-border)`), put it
once on `base`. Variants only hold what differs. Override in a variant only when that variant truly
diverges (`border-0`, `rounded-none`).

```tsx
// Wrong — same radius/border copied into every variant
default: `
  bg-background-brand-primary-container
  border-border-neutral-default
  border-(length:--components-button-border)
  rounded-(--components-button-radius)
  text-foreground-brand-on-primary-container
`,
destructive: `
  bg-background-feedback-negative-container
  border-border-neutral-default
  border-(length:--components-button-border)
  rounded-(--components-button-radius)
  text-foreground-feedback-on-negative-container
`,

// Correct — shared styles on base; variants only differ
const base = `
  border-border-neutral-default
  border-(length:--components-button-border)
  rounded-(--components-button-radius)
  ...
`;
default: `
  bg-background-brand-primary-container
  text-foreground-brand-on-primary-container
`,
destructive: `
  bg-background-feedback-negative-container
  text-foreground-feedback-on-negative-container
`,
ghost: `
  bg-transparent
  border-0
  text-foreground-on-surface-default
`,
```

### 5. Promote the migrated story from WIP

The current package line contains only DS v2 themes: `mcluck`, `spinblitz`, and `white-label`.
Legacy-only brands and tokens remain available from the previous published package version; do not
reintroduce aliases or fallback variables in this line.

Stories for components that have not yet migrated live under `WIP/<Component>`. Once the component
uses only DS v2 semantic, component, typography, and primitive tokens, change its story title to
`Components/<Component>`.

Never write `var(--ds-token, var(--legacy-token))` inside a component class. A migrated component
must depend only on the current DS v2 contract.

### 6. Rebuild themes and verify

`@ui/themes` is consumed from `dist`, and there is **no watch mode**. Any token edit needs a
rebuild or Storybook keeps serving stale CSS:

```bash
pnpm --filter @ui/themes build
```

`packages/uikit-web` is aliased straight to `src` by Storybook, so component edits hot-reload with
no build step.

Confirm every class actually resolves. This also fails loudly when `dist` is stale:

```bash
node .cursor/skills/migrate-component-to-ds-v2/scripts/check-classes.mjs \
  bg-background-brand-primary-container \
  'rounded-(--components-button-radius)'
```

`OK` lines show the emitted declaration; `MISSING` means the token is absent from `@theme inline` in
`config.css` or has no value in any brand file. Then check the component in Storybook across all
supported themes:

```bash
pnpm --filter storybook-web dev
```

### 7. Update docs, story, snapshots

1. Rewrite the JSDoc `@cssVariables` list so it matches what the component **actually** consumes.
   Drop every legacy var the class string no longer references. Split DS v2 vs remaining legacy
   clearly while a component is mid-migration. (`codegen:docs` strips this block from
   `ai-docs.json`, so it serves humans reading the source.)
2. Delete any commented-out legacy class scraps left in the `.tsx` — they rot into the docs.
3. Regenerate the docs index: `pnpm --filter @ui/web codegen:docs`
4. Add or extend the story in `apps/storybook-web/.storybook/stories/ui/` to cover every migrated
   variant and size.
5. Refresh visual baselines, which run each story against all non-default themes:
   ```bash
   pnpm visual:update
   ```
   Review the diffs before committing — an unintended change here is the main regression signal,
   since uikit-web has no component unit tests.

### 8. Delete obsolete legacy component variables

Once a property is on DS v2, the matching `--button-*` / `--input-*` / `--badge-*` var is
**redundant**. Do not leave it behind "just in case".

For each replaced legacy var:

1. Confirm zero live references across **web and native**:
   ```bash
   rg -- '--button-default-background-color-start' packages/
   ```
2. If `packages/uikit-native` (or another variant) still uses it, **do not delete** — finish that
   consumer first, or leave a note in the PR. Themes are shared.
3. If truly unused, delete the declaration from **every** brand file under
   `packages/uikit-themes/src/static/` (and any interim DS v2 alias that pointed at it).
4. Rebuild: `pnpm --filter @ui/themes build`

Partial migrations are fine — delete only the vars this pass retired. Leaving
`--button-default-background-color-start` in themes after the web Button switched to
`bg-background-brand-primary-container` is the anti-pattern this step exists to catch.

## Hard rules

- Never invent a token name. Derive, then `rg` to confirm it exists.
- Never hardcode a colour, radius, or font family.
- Prefer named Tailwind utilities; use as few `[arbitrary]` bracket values as possible. Allowed
  exceptions: unbridged token refs (`rounded-(--components-*)`, `text-(length:--typography-*)`) and
  true one-offs with no utility equivalent. Never use `[8px]` (or similar) for spacing when
  `px / 4` gives an exact scale step.
- Never reproduce Figma's wrapper frames as extra DOM.
- Never put a legacy fallback in a component class; alias it in the brand CSS instead.
- Never leave a legacy component var in themes or `@cssVariables` after nothing references it —
  delete it (step 8). Check native before deleting shared theme tokens.
- Never repeat the same class value across variants — hoist shared styles to `base`; variants only
  override when they diverge.
- Never edit `packages/uikit-themes/dist/` — it is generated and wiped on every build.
- Do not change props, `data-slot` values, `data-test` attributes, or `"use client"` directives.
- Commit with the repo format: `<type>: <what was done>`, one line, max ~72 chars, lowercase after
  the colon (e.g. `refactor: migrate button to ds v2 tokens`).

## Reference

For the complete token catalogue, brand coverage matrix, legacy crosswalk, and command list, see
[reference.md](reference.md).
