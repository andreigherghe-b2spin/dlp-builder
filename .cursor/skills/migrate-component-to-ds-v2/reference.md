# DS v2 migration reference

Companion to [SKILL.md](SKILL.md). Token catalogue, brand coverage, and commands.

## Token pipeline

```
packages/uikit-themes/src/
  foundation/config.css     @theme inline  → bridges brand vars to Tailwind utilities
                            @theme static  → shared Figma primitives
  static/<brand>.css        :root          → per-brand values
        │
        │  node scripts/build.js   (no watch mode)
        ▼
packages/uikit-themes/dist/
  config.css                copied verbatim
  <brand>.css               copied verbatim
  storybook.css             generated: each brand's :root wrapped in @variant <brand>
        │
        ▼
apps/storybook-web/.storybook/global.css
  @import '@ui/themes/config.css'
  @import '@ui/themes/storybook.css'
```

Consumers resolve `@ui/themes/*.css` to `dist/*.css` via the package `exports` map, so **`src`
edits are invisible until you rebuild**. By contrast `apps/storybook-web/.storybook/main.ts` aliases
`@ui/web/*` directly to `packages/uikit-web/src`, so component edits need no build.

## Why colours have classes and other tokens do not

`@theme inline` in `config.css` bridges only the DS v2 **colour** tokens into Tailwind's `--color-*`
namespace. A self-referencing entry like this is intentional and correct:

```css
@theme inline {
  --color-background-brand-primary-container: var(--color-background-brand-primary-container);
}
```

`inline` means Tailwind does not emit the theme variable itself; it inlines the reference into the
utility, and the brand file supplies the value under its `@variant` scope.

`--components-*` and `--typography-*` are **not** in any `@theme` block, so they have no generated
class and must use arbitrary property syntax.

## DS v2 colour tokens (59)

Prefix every name with `--color-`. Tailwind class is the token name minus `--color-`, prefixed by
`bg-` / `text-` / `border-` / `fill-` / `ring-`.

**Background (18)**

```
background-backdrop
background-brand-accent1container
background-brand-accent2container
background-brand-primary-container
background-brand-secondary-container
background-feedback-informative-container
background-feedback-negative-container
background-feedback-positive-container
background-feedback-warning-container
background-layout-inverted
background-layout-page
background-layout-surface
background-layout-surface-overlay
background-layout-surface-variant1
background-state-disabled
background-state-hover
background-state-pressed
background-state-selected
```

**Border (17)**

```
border-brand-accent1
border-brand-accent2
border-brand-on-accent1container
border-brand-on-accent2container
border-brand-on-primary-container
border-brand-on-secondary-container
border-brand-primary
border-brand-secondary
border-feedback-informative
border-feedback-negative
border-feedback-positive
border-feedback-warning
border-neutral-default
border-neutral-strong
border-neutral-subtle
border-state-active
border-state-focus
```

Border colour classes double the word: `--color-border-neutral-default` → `border-border-neutral-default`.

**Foreground (24)**

```
foreground-brand-accent1
foreground-brand-accent2
foreground-brand-on-accent1container
foreground-brand-on-accent2container
foreground-brand-on-primary-container
foreground-brand-on-secondary-container
foreground-brand-primary
foreground-brand-secondary
foreground-feedback-informative
foreground-feedback-negative
foreground-feedback-on-informative-container
foreground-feedback-on-negative-container
foreground-feedback-on-positive-container
foreground-feedback-on-warning-container
foreground-feedback-positive
foreground-feedback-warning
foreground-on-inverted-default
foreground-on-inverted-muted
foreground-on-page-default
foreground-on-page-muted
foreground-on-surface-default
foreground-on-surface-muted
foreground-state-active
foreground-state-disabled
```

**Jackpot (6)**

```
jackpot-gold-coins
jackpot-grand
jackpot-major
jackpot-mini
jackpot-minor
jackpot-sweepstakes-coins
```

## Radius scale (bridged)

Defined per brand, bridged via `@theme inline` → utilities `rounded-none` / `rounded-compact` /
`rounded-base` / `rounded-offset4` … `rounded-offset24`.

| Token               | Usage              |
| ------------------- | ------------------ |
| `--radius-none`     | `rounded-none`\*   |
| `--radius-compact`  | `rounded-compact`  |
| `--radius-base`     | `rounded-base`     |
| `--radius-offset4`  | `rounded-offset4`  |
| `--radius-offset8`  | `rounded-offset8`  |
| `--radius-offset12` | `rounded-offset12` |
| `--radius-offset16` | `rounded-offset16` |
| `--radius-offset24` | `rounded-offset24` |

\* `--radius-none` may collide with Tailwind’s built-in `rounded-none` (0); brand value is also 0.

Border widths from Figma (`--border-button`, `--border-card`, `--border-textfield`) are **not**
bridged into `@theme` (would clash with color utilities). Use aliases below.

## Component aliases (7)

Thin aliases onto `--radius-*` / `--border-*`. Prefer the radius utilities above for new code.

| Token                           | Points at            | Usage                                           |
| ------------------------------- | -------------------- | ----------------------------------------------- |
| `--components-badge-radius`     | `none` / `compact`   | `rounded-(--components-badge-radius)`           |
| `--components-button-border`    | `--border-button`    | `border-(length:--components-button-border)`    |
| `--components-button-radius`    | `--radius-base`      | `rounded-(--components-button-radius)`          |
| `--components-card-border`      | `--border-card`      | `border-(length:--components-card-border)`      |
| `--components-card-radius`      | `--radius-offset8`   | `rounded-(--components-card-radius)`            |
| `--components-textfield-border` | `--border-textfield` | `border-(length:--components-textfield-border)` |
| `--components-textfield-radius` | `--radius-base`      | `rounded-(--components-textfield-radius)`       |

## Typography tokens (22)

| Token                                                     | Usage                                          |
| --------------------------------------------------------- | ---------------------------------------------- |
| `--typography-font-family`                                | `font-(family-name:--typography-font-family)`  |
| `--typography-font-weight-{regular,medium,semibold,bold}` | `font-(--typography-font-weight-bold)`         |
| `--typography-font-size-{...}`                            | `text-(length:--typography-font-size-label-l)` |

Font size scale:

```
body-xs  body-l  body-m  body-s  caption-m
display-xl  display-l  display-m  display-s
heading-xl  heading-l  heading-m  heading-s  heading-xs
label-xl  label-l  label-m  label-s
```

Seven sizes are bumped at `@media (min-width: 1024px)` inside each brand file:
`display-xl`, `display-l`, `display-m`, `display-s`, `heading-xl`, `heading-l`, `heading-m`.
Responsive typography is therefore handled by the tokens — do not add `lg:text-*` variants.

Do not confuse these with the legacy `--typography-components-*` family (`h1`, `lead`, `small`, …)
still consumed by `Typography.tsx`.

## Shared primitives (`@theme static`)

These back the `--components-*` tokens and are brand-independent.

| Family                                             | Values                                                                                                     |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `--radius-rounded-*`                               | `none`, `2`, `4`, `6`, `8`, `12`, `16`, `20`, `24`, `28`, `32`, `36`, `40`, `44`, `48`, `52`, `56`, `full` |
| `--border-width-border-*`                          | `0`, `1`                                                                                                   |
| `--color-custom-mc-luck-{main,complementary}-*`    | `50`–`950`                                                                                                 |
| `--color-custom-spin-blitz-{main,complementary}-*` | `50`–`950`                                                                                                 |
| `--color-custom-transparent-{white,black}-*`       | `50`–`950`                                                                                                 |

Reference primitives only from **brand files**, never from a component. Prefer `--radius-base` /
`rounded-base` (or a `--components-*` alias) over raw `--radius-rounded-12`.

## Brand coverage

| Brand file        | DS v2 tokens |
| ----------------- | ------------ |
| `mcluck.css`      | yes          |
| `spinblitz.css`   | yes          |
| `white-label.css` | yes          |

The current package line intentionally contains no legacy tokens or legacy-only brand files.
`shadcn`, `hellomillions`, and `playfame` remain available from the previous published package
version. Storybook exposes only the three DS v2 themes, and unmigrated components remain under the
`WIP` section until their token usage is migrated.

Storybook theme classnames come from `apps/storybook-web/.storybook/themes.ts` and must match the
`@custom-variant` declarations in `global.css`.

## Legacy crosswalk

Starting points only — always confirm the intended token against the Figma node.

| Legacy                                             | DS v2                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| `--button-default-background-color-start` + `-end` | `--color-background-brand-primary-container`                              |
| `--button-default-color`                           | `--color-foreground-brand-on-primary-container`                           |
| `--button-default-border-color`                    | `--color-border-brand-on-primary-container`                               |
| `--button-default-border-radius`                   | `--radius-base` (alias: `--components-button-radius`)                     |
| `--button-default-border-width`                    | `--border-button` (alias: `--components-button-border`)                   |
| `--button-default-disabled-background-color`       | `--color-background-state-disabled`                                       |
| `--button-default-disabled-color`                  | `--color-foreground-state-disabled`                                       |
| `--button-default-hover-background-color`          | `--color-background-state-hover`                                          |
| `--button-font-size`                               | `--typography-font-size-label-l`                                          |
| `--button-font-weight`                             | `--typography-font-weight-bold`                                           |
| `--input-border-radius`                            | `--radius-base` (alias: `--components-textfield-radius`)                  |
| `--card-border-radius`                             | `--radius-offset8` (alias: `--components-card-radius`)                    |
| `--badge-default-border-radius`                    | `--radius-none` / `--radius-compact` (alias: `--components-badge-radius`) |

Several legacy surfaces are two-stop gradients (`--button-default-background-color-start` / `-end`,
consumed via `bg-linear-[to_bottom,...]`). DS v2 replaces them with a single flat container colour, so
the gradient utility disappears entirely rather than being ported.

## Commands

| Task                                           | Command                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| Rebuild themes (required after any token edit) | `pnpm --filter @ui/themes build`                                                      |
| Verify classes resolve                         | `node .cursor/skills/migrate-component-to-ds-v2/scripts/check-classes.mjs <class>...` |
| Run Storybook                                  | `pnpm --filter storybook-web dev`                                                     |
| Storybook on another port                      | `pnpm --filter storybook-web exec storybook dev -p 8080`                              |
| Regenerate component docs index                | `pnpm --filter @ui/web codegen:docs`                                                  |
| Build uikit-web                                | `pnpm --filter @ui/web build`                                                         |
| Visual regression                              | `pnpm --filter storybook-web test:visual --tag=prod`                                  |
| Update visual baselines                        | `pnpm --filter storybook-web test:tag:update --tag=prod`                              |
| Themes unit tests                              | `pnpm --filter @ui/themes test`                                                       |

`packages/uikit-web` has no `typecheck` script and its `lint` script is a placeholder. There are no
component unit tests, so Playwright visual snapshots are the primary regression signal.

## Files worth reading before a migration

| Path                                              | Why                                                     |
| ------------------------------------------------- | ------------------------------------------------------- |
| `packages/uikit-themes/src/foundation/config.css` | which tokens are bridged to Tailwind                    |
| `packages/uikit-themes/src/static/spinblitz.css`  | a fully populated brand file, DS v2 block at the end    |
| `packages/uikit-web/src/atoms/Button.tsx`         | the reference partially-migrated component              |
| `packages/uikit-themes/scripts/build.js`          | how `storybook.css` and `@variant` scoping are produced |
| `apps/storybook-web/.storybook/main.ts`           | the `@ui/web` → `src` alias                             |
