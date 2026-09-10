/**
 * tokens-to-css.test.js
 *
 * Run with:  node --test scripts/
 *      or:  pnpm --filter @ui/themes test
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { convert } from "./tokens-to-css.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal token tree with a single leaf at the given path. */
function leaf(pathSegments, type, value, extra = {}) {
  const root = {};
  let node = root;
  for (let i = 0; i < pathSegments.length - 1; i++) {
    node[pathSegments[i]] = {};
    node = node[pathSegments[i]];
  }
  node[pathSegments.at(-1)] = { $type: type, $value: value, ...extra };
  return root;
}

/**
 * Extract the CSS lines from a convert() result, excluding the :root wrapper,
 * returning an array of "  --name: value;" strings.
 */
function extractLines(css) {
  return css.split("\n").filter((l) => l.startsWith("  --"));
}

// ---------------------------------------------------------------------------
// Integration: full multi-collection tree
// ---------------------------------------------------------------------------

test("integration: all collections, cross-collection refs, and excluded collections", () => {
  const tokens = {
    colors: {
      common: {
        primary: {
          $type: "color",
          $value: { colorSpace: "srgb", components: [0.2, 0.4, 0.8], alpha: 1, hex: "#3366CC" },
        },
        overlay: {
          $type: "color",
          $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.5, hex: "#000000" },
        },
      },
    },
    "border radius": {
      default: { $type: "number", $value: 6 },
      sm: { $type: "number", $value: 2 },
      lg: { $type: "number", $value: 12 },
    },
    typography: {
      "font family": {
        "font-sans": { $type: "string", $value: "Inter" },
      },
      "typography components": {
        h1: {
          "font-size": { $type: "number", $value: 32 },
          "font-weight": { $type: "number", $value: 700 },
          "letter-spacing": { $type: "number", $value: -0.5 },
          "font-family": { $type: "string", $value: "{typography.font family.font-sans}" },
        },
      },
    },
    components: {
      button: {
        default: {
          background: { $type: "color", $value: "{colors.common.primary}" },
        },
        "border-radius": { $type: "number", $value: "{border radius.sm}" },
        "font-weight": { $type: "number", $value: 600 },
      },
    },
    // Excluded collections — must produce no variables
    alpha: {
      10: {
        $type: "color",
        $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.1, hex: "#000000" },
      },
    },
    images: {
      logo: { $type: "string", $value: "brand-logo.png" },
    },
  };

  const expected = [
    ":root {",
    "  --button-border-radius: 2px;",
    "  --button-default-background: #3366cc;",
    "  --button-font-weight: 600;",
    "  --font-sans: Inter;",
    "  --overlay: rgba(0, 0, 0, 0.5);",
    "  --primary: #3366cc;",
    "  --radius: 6px;",
    "  --radius-lg: 12px;",
    "  --radius-sm: 2px;",
    "  --typography-components-h1-font-family: Inter;",
    "  --typography-components-h1-font-size: 32px;",
    "  --typography-components-h1-font-weight: 700;",
    "  --typography-components-h1-letter-spacing: -0.5px;",
    "}",
    "",
  ].join("\n");

  assert.equal(convert(tokens), expected);
});

// ---------------------------------------------------------------------------
// Naming rules (additional)
// ---------------------------------------------------------------------------

test("naming: sc segment is dropped", () => {
  const tokens = {
    components: {
      button: {
        sc: {
          color: {
            $type: "color",
            $value: { colorSpace: "srgb", components: [1, 0, 0], alpha: 1, hex: "#FF0000" },
          },
        },
      },
    },
  };
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --button-color: #ff0000;");
});

// ---------------------------------------------------------------------------
// Reference resolution (additional)
// ---------------------------------------------------------------------------

test("reference: unresolvable ref is emitted as-is", () => {
  const tokens = {
    components: {
      button: {
        color: { $type: "color", $value: "{colors.nonexistent.shade}" },
      },
    },
  };
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --button-color: {colors.nonexistent.shade};");
});

// ---------------------------------------------------------------------------
// Walker behaviour
// ---------------------------------------------------------------------------

test("$extensions siblings are skipped when walking collections", () => {
  const tokens = {
    colors: {
      $extensions: { "com.figma": { collectionId: "VariableCollectionId:1:1" } },
      primary: {
        $type: "color",
        $value: { colorSpace: "srgb", components: [1, 0, 0], alpha: 1, hex: "#FF0000" },
      },
    },
  };
  const lines = extractLines(convert(tokens));
  assert.equal(lines.length, 1);
  assert.equal(lines[0], "  --primary: #ff0000;");
});

// ---------------------------------------------------------------------------
// Color formatting
// ---------------------------------------------------------------------------

test("color: alpha === 1 → lowercase hex", () => {
  const tokens = leaf(["colors", "foo"], "color", {
    colorSpace: "srgb",
    components: [1, 0, 0],
    alpha: 1,
    hex: "#FF0000",
  });
  const lines = extractLines(convert(tokens));
  assert.equal(lines.length, 1);
  assert.equal(lines[0], "  --foo: #ff0000;");
});

test("color: alpha < 1 → rgba with raw alpha float", () => {
  const alpha = 0.6000000238418579;
  const tokens = leaf(["colors", "common", "overlay"], "color", {
    colorSpace: "srgb",
    components: [0.12941177189350128, 0.30588236451148987, 0.6470588445663452],
    alpha,
    hex: "#214EA5",
  });
  const lines = extractLines(convert(tokens));
  assert.equal(lines.length, 1);
  // r=round(0.129*255)=33, g=round(0.305*255)=78, b=round(0.647*255)=165
  assert.equal(lines[0], `  --overlay: rgba(33, 78, 165, ${alpha});`);
});

test("color: alpha === 0 → rgba(r, g, b, 0)", () => {
  const tokens = leaf(["colors", "transparent"], "color", {
    colorSpace: "srgb",
    components: [1, 1, 1],
    alpha: 0,
    hex: "#FFFFFF",
  });
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --transparent: rgba(255, 255, 255, 0);");
});

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

test("number: font-weight → unitless", () => {
  const tokens = leaf(["components", "button", "font-weight"], "number", 700);
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --button-font-weight: 700;");
});

test("number: opacity → unitless", () => {
  const tokens = leaf(["components", "modal", "opacity"], "number", 0.8);
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --modal-opacity: 0.8;");
});

test("number: z-index → unitless", () => {
  const tokens = leaf(["components", "tooltip", "z-index"], "number", 100);
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --tooltip-z-index: 100;");
});

test("number: generic → px suffix", () => {
  const tokens = leaf(["components", "button", "size-default"], "number", 36);
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --button-size-default: 36px;");
});

test("number: negative float → px suffix preserving precision", () => {
  const tokens = leaf(
    ["typography", "typography components", "h1", "letter-spacing"],
    "number",
    -0.4000000059604645,
  );
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --typography-components-h1-letter-spacing: -0.4000000059604645px;");
});

test("number: Boolean leaf → false when 0", () => {
  const tokens = leaf(["components", "display-component", "Boolean"], "number", 0);
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --display-component-boolean: false;");
});

test("number: Boolean leaf → true when non-zero", () => {
  const tokens = leaf(["components", "display-component", "Boolean"], "number", 1);
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --display-component-boolean: true;");
});

// ---------------------------------------------------------------------------
// String tokens
// ---------------------------------------------------------------------------

test("string: emitted as-is", () => {
  const tokens = leaf(["typography", "font family", "font-sans"], "string", "Radio Canada");
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --font-sans: Radio Canada;");
});

test("string: font-style literal", () => {
  const tokens = leaf(
    ["typography", "typography components", "blockquote", "font-style"],
    "string",
    "italic",
  );
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --typography-components-blockquote-font-style: italic;");
});

// ---------------------------------------------------------------------------
// Reference resolution
// ---------------------------------------------------------------------------

test("reference: {border radius.xl} → 16px", () => {
  const tokens = {
    "border radius": {
      xl: { $type: "number", $value: 16 },
    },
    components: {
      button: {
        "border-radius": { $type: "number", $value: "{border radius.xl}" },
      },
    },
  };
  const lines = extractLines(convert(tokens));
  const br = lines.find((l) => l.includes("--radius-xl"));
  const btn = lines.find((l) => l.includes("--button-border-radius"));
  assert.ok(br, "radius-xl var present");
  assert.equal(br, "  --radius-xl: 16px;");
  assert.ok(btn, "button-border-radius var present");
  assert.equal(btn, "  --button-border-radius: 16px;");
});

test("reference: font family alias resolves to string value", () => {
  const tokens = {
    typography: {
      "font family": {
        "font-sans": { $type: "string", $value: "Inter" },
      },
      "typography components": {
        h1: {
          "font-family": {
            $type: "string",
            $value: "{typography.font family.font-sans}",
          },
        },
      },
    },
  };
  const lines = extractLines(convert(tokens));
  const h1ff = lines.find((l) => l.includes("--typography-components-h1-font-family"));
  assert.ok(h1ff);
  assert.equal(h1ff, "  --typography-components-h1-font-family: Inter;");
});

// ---------------------------------------------------------------------------
// Naming rules
// ---------------------------------------------------------------------------

test("naming: border radius default → --radius", () => {
  const tokens = {
    "border radius": {
      default: { $type: "number", $value: 6 },
    },
  };
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --radius: 6px;");
});

test("naming: border radius variants", () => {
  const tokens = {
    "border radius": {
      sm: { $type: "number", $value: 2 },
      lg: { $type: "number", $value: 8 },
      full: { $type: "number", $value: 9999 },
    },
  };
  const lines = extractLines(convert(tokens));
  assert.deepEqual(lines, [
    "  --radius-full: 9999px;",
    "  --radius-lg: 8px;",
    "  --radius-sm: 2px;",
  ]);
});

test("naming: colors/common segments are dropped", () => {
  const tokens = {
    colors: {
      common: {
        accent: {
          $type: "color",
          $value: { colorSpace: "srgb", components: [1, 0, 0], alpha: 1, hex: "#FF0000" },
        },
      },
    },
  };
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --accent: #ff0000;");
});

test("naming: components/default leaf is dropped", () => {
  const tokens = {
    components: {
      button: {
        default: {
          color: {
            $type: "color",
            $value: { colorSpace: "srgb", components: [1, 1, 1], alpha: 1, hex: "#FFFFFF" },
          },
        },
      },
    },
  };
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --button-default-color: #ffffff;");
});

// ---------------------------------------------------------------------------
// Collection filtering
// ---------------------------------------------------------------------------

test("alpha collection is excluded", () => {
  const tokens = {
    alpha: {
      10: {
        $type: "color",
        $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.9, hex: "#000000" },
      },
    },
  };
  const css = convert(tokens);
  assert.ok(!css.includes("--"), "no variables should be emitted for alpha collection");
});

test("images collection is excluded", () => {
  const tokens = {
    images: {
      brand: { $type: "string", $value: "SpinBlitz" },
    },
  };
  const css = convert(tokens);
  assert.ok(!css.includes("--"));
});

// ---------------------------------------------------------------------------
// Output structure
// ---------------------------------------------------------------------------

test("output starts with :root { and ends with }\\n", () => {
  const tokens = {
    colors: {
      primary: {
        $type: "color",
        $value: { colorSpace: "srgb", components: [1, 0, 0], alpha: 1, hex: "#FF0000" },
      },
    },
  };
  const css = convert(tokens);
  assert.ok(css.startsWith(":root {\n"));
  assert.ok(css.endsWith("}\n"));
});

test("variables are sorted alphabetically", () => {
  const tokens = {
    colors: {
      z: {
        $type: "color",
        $value: { colorSpace: "srgb", components: [0, 0, 1], alpha: 1, hex: "#0000FF" },
      },
      a: {
        $type: "color",
        $value: { colorSpace: "srgb", components: [1, 0, 0], alpha: 1, hex: "#FF0000" },
      },
    },
  };
  const lines = extractLines(convert(tokens));
  assert.equal(lines[0], "  --a: #ff0000;");
  assert.equal(lines[1], "  --z: #0000ff;");
});
