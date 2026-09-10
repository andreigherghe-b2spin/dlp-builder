# UI Kit Themes

This package contains all the themes and foundational styles for our UI Kit.

## Directory Structure

To keep things organized, the `src/` directory is divided into three logical parts based on how the files are processed during the build:

- **`src/generated/`**
  Contains raw themes exported directly from the Figma plugin. These files require processing and transformation by the build script before they can be used.

- **`src/static/`**
  Contains ready-to-use themes. The build script does not process these files; it simply copies them as-is directly into the `dist/` folder.

- **`src/foundation/`**
  Contains base styles and Tailwind CSS configurations (such as `animations.css` and `config.css`). These serve as the core building blocks for the themes.

## Build Process

When you run the build script, it will automatically:

1. Process and transform the raw themes from `src/generated/`.
2. Copy the ready themes from `src/static/`.
3. Output the final, ready-to-use CSS files into the `dist/` directory.

## Scripts

### `scripts/tokens-to-css.js`

Converts a Figma DTCG variable export (`*.tokens.json`) into a CSS `:root` custom-properties file. Output is byte-identical to the [Variables to CSS](https://www.figma.com/community/plugin/1427238109341529865) Figma plugin, so it can replace any manual plugin run locally or in CI.

```bash
# Output defaults to <same-dir>/<brandname>.css
node packages/uikit-themes/scripts/tokens-to-css.js tokens/SpinBlitz.tokens.json

# Explicit output path
node packages/uikit-themes/scripts/tokens-to-css.js tokens/SpinBlitz.tokens.json packages/uikit-themes/src/static/spinblitz.css
```

See [`docs/tokens-to-css.md`](./docs/tokens-to-css.md) for the full conversion algorithm and reference.
