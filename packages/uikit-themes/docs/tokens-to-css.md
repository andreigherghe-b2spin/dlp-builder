# uikit-themes scripts

## tokens-to-css.js

Converts a **Figma DTCG variable export** (`*.tokens.json`) into a CSS
`:root` custom-properties file. The output is byte-identical to what the
[Variables to CSS](https://www.figma.com/community/plugin/1427238109341529865)
community plugin produces, so it can replace any manual plugin run in a local
or CI workflow.

### Usage

```bash
# CLI — output defaults to <same-dir>/<brandname>.css
node packages/uikit-themes/scripts/tokens-to-css.js tokens/SpinBlitz.tokens.json
# → writes tokens/spinblitz.css

# Explicit output path
node packages/uikit-themes/scripts/tokens-to-css.js tokens/SpinBlitz.tokens.json packages/uikit-themes/src/static/spinblitz.css

# Via pnpm filter (from repo root)
pnpm --filter @ui/themes tokens:css tokens/SpinBlitz.tokens.json
```

The output filename is derived from the input filename by stripping
`.tokens.json` and lowercasing:

| Input                   | Output (default) |
| ----------------------- | ---------------- |
| `SpinBlitz.tokens.json` | `spinblitz.css`  |
| `PlayFame.tokens.json`  | `playfame.css`   |

### Running tests

```bash
pnpm --filter @ui/themes test
```

Tests live in `scripts/tokens-to-css.test.js` and use the built-in
`node:test` runner — no extra dependencies.

---

## Conversion algorithm

The algorithm mirrors the transform pipeline already encoded in
[`build.js`](../scripts/build.js) for the `src/generated/` CSS path.

### 1. Collection allowlist

Only tokens whose **top-level JSON key** is one of the following are emitted:

| Collection key  | Example output prefix                   |
| --------------- | --------------------------------------- |
| `colors`        | `--base-*`, `--primary-*`, …            |
| `components`    | `--button-*`, `--input-*`, …            |
| `typography`    | `--typography-components-*`, `--font-*` |
| `border radius` | `--radius-*`                            |

Collections like `alpha`, `images`, and `$extensions` are skipped entirely.

### 2. Variable name construction

Path segments are joined with `-` and then the following rules are applied
(in order):

1. **Drop** structural segments that add no useful meaning:
   `colors`, `common`, `components`, `sc`, `font family`, `typography`
   (top-level key only).
2. **Rename** `border radius` → `radius`.
3. **Drop** a trailing leaf segment named `default`
   (e.g. `border radius / default` → `--radius`).
4. Lowercase everything; replace spaces inside any remaining segment with `-`;
   prefix the whole name with `--`.

Examples:

| JSON path                                                | CSS variable                           |
| -------------------------------------------------------- | -------------------------------------- |
| `colors / common / accent`                               | `--accent`                             |
| `colors / base / 20`                                     | `--base-20`                            |
| `border radius / xl`                                     | `--radius-xl`                          |
| `border radius / default`                                | `--radius`                             |
| `components / button / default / background-color-start` | `--button-background-color-start`      |
| `typography / typography components / h1 / font-size`    | `--typography-components-h1-font-size` |
| `typography / font family / font-sans`                   | `--font-sans`                          |

### 3. Reference resolution

When a token's `$value` is a string of the form `{some.dot.path}`, the
converter walks that path in the original JSON tree (keys may contain spaces)
and formats the resolved token's value instead. Resolution is recursive.

Example: `{border radius.xl}` resolves to the number token `16`, which is
then formatted as `16px`.

### 4. Value formatting

| Token type | Condition                                            | Output                                                                                                                        |
| ---------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `color`    | `alpha === 1`                                        | lowercase hex: `#a3ffb7`                                                                                                      |
| `color`    | `alpha < 1`                                          | `rgba(r, g, b, alpha)` — `r/g/b` are `Math.round(component × 255)`, `alpha` is the raw IEEE float (e.g. `0.6000000238418579`) |
| `number`   | variable name ends with `boolean`                    | `false` / `true`                                                                                                              |
| `number`   | name contains `font-weight`, `opacity`, or `z-index` | unitless integer/float                                                                                                        |
| `number`   | all other numbers                                    | value + `px` suffix (full float precision, e.g. `-0.4000000059604645px`)                                                      |
| `string`   | —                                                    | value as-is (font family names, `italic`, …)                                                                                  |

### 5. Output format

Variables are **sorted alphabetically** by name, then wrapped in a single
`:root` block with 2-space indentation and a trailing newline:

```css
:root {
  --accent: #214ea5;
  --accent-foreground: #ffffff;
  /* … */
}
```
