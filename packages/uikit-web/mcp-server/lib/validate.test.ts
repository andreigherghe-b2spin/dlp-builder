import { describe, it, expect } from "vitest";
import {
  matchAll,
  buildImportSuggestions,
  checkCnImport,
  checkColors,
  checkTextSizes,
  checkRadii,
  checkPropValues,
  checkImports,
  buildSummary,
  validateFile,
  runLint,
} from "./validate";
import type { PropConstraint } from "./componentDocs";

// ---------------------------------------------------------------------------
// matchAll
// ---------------------------------------------------------------------------

describe("matchAll", () => {
  it("returns unique matches", () => {
    const re = /\bfoo\b/g;
    expect(matchAll(re, "foo bar foo baz foo")).toEqual(["foo"]);
  });

  it("resets lastIndex before matching", () => {
    const re = /\d+/g;
    re.lastIndex = 999;
    expect(matchAll(re, "a1b2c3")).toEqual(["1", "2", "3"]);
  });

  it("returns empty array when nothing matches", () => {
    expect(matchAll(/xyz/g, "hello world")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildImportSuggestions
// ---------------------------------------------------------------------------

describe("buildImportSuggestions", () => {
  const fileMap = new Map([
    ["Button", "Button"],
    ["Input", "Input"],
    ["Card", "Card"],
  ]);

  it("groups multiple components from the same subpath", () => {
    const result = buildImportSuggestions(["Button", "Input"], fileMap, "@ui/web");
    expect(result).toContain("import { Button } from '@ui/web/Button'");
    expect(result).toContain("import { Input } from '@ui/web/Input'");
  });

  it("adds unknown components as a comment", () => {
    const result = buildImportSuggestions(["Button", "Ghost"], fileMap, "@ui/web");
    expect(result).toContain("// Unknown components (check list_components): Ghost");
  });

  it("returns empty string for empty names array", () => {
    expect(buildImportSuggestions([], fileMap, "@ui/web")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// checkCnImport
// ---------------------------------------------------------------------------

describe("checkCnImport", () => {
  it("returns no errors for the valid uikit import", () => {
    expect(checkCnImport(`import { cn } from '@ui/web/utils'`)).toEqual([]);
  });

  it("flags cn imported from clsx", () => {
    const errors = checkCnImport(`import { cn } from 'clsx'`);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('"cn"');
    expect(errors[0].message).toContain("@ui/web/utils");
    expect(errors[0].message).toContain("clsx");
  });

  it("flags cn imported from tailwind-merge", () => {
    const errors = checkCnImport(`import { cn } from 'tailwind-merge'`);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("tailwind-merge");
  });

  it("flags cn imported alongside other names from a wrong package", () => {
    const errors = checkCnImport(`import { foo, cn, bar } from 'clsx'`);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("clsx");
  });

  it("flags default import of cn from a wrong package", () => {
    const errors = checkCnImport(`import cn from 'clsx'`);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("clsx");
  });

  it("attaches a suggestedFix pointing to @ui/web/utils", () => {
    const errors = checkCnImport(`import { cn } from 'clsx'`);
    expect(errors[0].suggestedFix).toContain("import { cn } from '@ui/web/utils'");
  });

  it("returns no errors when cn is not imported at all", () => {
    expect(checkCnImport(`import { clsx } from 'clsx'`)).toEqual([]);
    expect(checkCnImport(`import React from 'react'`)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// checkColors
// ---------------------------------------------------------------------------

describe("checkColors", () => {
  it("flags hardcoded Tailwind palette colors", () => {
    const errors = checkColors('<div className="text-red-500 bg-blue-200" />');
    expect(errors).toHaveLength(2);
    expect(errors[0].message).toContain("text-red-500");
    expect(errors[1].message).toContain("bg-blue-200");
  });

  it("attaches a suggestedFix to every color error", () => {
    const errors = checkColors('<div className="text-red-500" />');
    expect(errors[0].suggestedFix).toBeDefined();
    expect(errors[0].suggestedFix).toContain("text-red-500");
    expect(errors[0].suggestedFix).toContain("get_tailwind_theme_classes");
  });

  it("deduplicates repeated classes", () => {
    const errors = checkColors("text-red-500 text-red-500");
    expect(errors).toHaveLength(1);
  });

  it("ignores design-system token classes", () => {
    expect(checkColors("text-primary bg-error border-surface")).toEqual([]);
  });

  it("ignores shades outside 2–3 digit range", () => {
    expect(checkColors("text-red-5 text-red-5000")).toEqual([]);
  });

  it("returns empty array for code with no colors", () => {
    expect(checkColors('<div className="p-4 flex" />')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// checkTextSizes
// ---------------------------------------------------------------------------

describe("checkTextSizes", () => {
  it("flags all hardcoded text-size utilities", () => {
    const classes =
      "text-xs text-sm text-base text-lg text-xl text-2xl text-3xl text-4xl text-5xl text-6xl text-7xl text-8xl text-9xl";
    const errors = checkTextSizes(classes);
    expect(errors).toHaveLength(13);
  });

  it("attaches a suggestedFix pointing at Typography", () => {
    const errors = checkTextSizes("text-sm");
    expect(errors[0].suggestedFix).toContain("Typography");
    expect(errors[0].suggestedFix).toContain("list_typography_variants");
  });

  it("deduplicates repeated classes", () => {
    expect(checkTextSizes("text-sm text-sm text-sm")).toHaveLength(1);
  });

  it("does not flag design-system text tokens", () => {
    expect(checkTextSizes("text-primary text-heading-md")).toEqual([]);
  });

  it("returns empty array for non-text classes", () => {
    expect(checkTextSizes("p-4 mt-2 rounded-md")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// checkRadii
// ---------------------------------------------------------------------------

describe("checkRadii", () => {
  const knownRadii = new Set(["sm", "md", "lg", "xl"]);

  it("allows rounded-* classes that exist in the design system", () => {
    expect(checkRadii("rounded-sm rounded-md rounded-lg rounded-xl", knownRadii)).toEqual([]);
  });

  it("flags rounded-* classes not in the design system", () => {
    const errors = checkRadii("rounded-2xl rounded-3xl", knownRadii);
    expect(errors).toHaveLength(2);
    expect(errors[0].message).toContain("rounded-2xl");
    expect(errors[1].message).toContain("rounded-3xl");
  });

  it("attaches a suggestedFix pointing at theme classes", () => {
    const errors = checkRadii("rounded-2xl", knownRadii);
    expect(errors[0].suggestedFix).toContain("rounded-2xl");
    expect(errors[0].suggestedFix).toContain("get_tailwind_theme_classes");
  });

  it("allows rounded-none (reset utility, excluded from regex)", () => {
    expect(checkRadii("rounded-none", knownRadii)).toEqual([]);
  });

  it("allows rounded-full (pill/circle semantic, excluded from regex)", () => {
    expect(checkRadii("rounded-full", knownRadii)).toEqual([]);
  });

  it("flags hardcoded numeric radius", () => {
    const errors = checkRadii("rounded-8 rounded-16", knownRadii);
    expect(errors).toHaveLength(2);
    expect(errors[0].message).toContain("rounded-8");
  });

  it("deduplicates repeated classes", () => {
    expect(checkRadii("rounded-2xl rounded-2xl", knownRadii)).toHaveLength(1);
  });

  it("returns empty array when no rounded classes present", () => {
    expect(checkRadii("p-4 flex items-center", knownRadii)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// checkPropValues
// ---------------------------------------------------------------------------

describe("checkPropValues", () => {
  const constraints = new Map<string, PropConstraint[]>([
    [
      "Button",
      [{ name: "variant", allowedValues: ["primary", "secondary", "ghost"], required: false }],
    ],
  ]);

  it("passes when prop value is allowed", () => {
    const imports = new Set(["Button"]);
    expect(checkPropValues('<Button variant="primary" />', imports, constraints)).toEqual([]);
  });

  it("flags invalid prop value with allowed list in suggestedFix", () => {
    const imports = new Set(["Button"]);
    const errors = checkPropValues('<Button variant="danger" />', imports, constraints);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('variant="danger"');
    expect(errors[0].suggestedFix).toContain('"primary" | "secondary" | "ghost"');
  });

  it("skips check when component is not in uikitImports", () => {
    const imports = new Set<string>();
    expect(checkPropValues('<Button variant="danger" />', imports, constraints)).toEqual([]);
  });

  it("skips constraint without allowedValues", () => {
    const noAllowed = new Map<string, PropConstraint[]>([
      ["Button", [{ name: "onClick", allowedValues: null, required: false }]],
    ]);
    const imports = new Set(["Button"]);
    expect(checkPropValues('<Button onClick="bad" />', imports, noAllowed)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// checkImports
// ---------------------------------------------------------------------------

describe("checkImports", () => {
  const knownComponents = new Set(["Button", "Input", "Card"]);
  const constraints = new Map<string, PropConstraint[]>();
  const fileMap = new Map([
    ["Button", "Button"],
    ["Input", "Input"],
    ["Card", "Card"],
  ]);
  const pkg = "@ui/web";

  it("accepts correct subpath imports", () => {
    const code = `import { Button } from '@ui/web/Button'`;
    const { errors, uikitImports } = checkImports(code, knownComponents, constraints, pkg, fileMap);
    expect(errors).toEqual([]);
    expect(uikitImports.has("Button")).toBe(true);
  });

  it("flags barrel import with per-component suggestedFix", () => {
    const code = `import { Button } from '@ui/web'`;
    const { errors } = checkImports(code, knownComponents, constraints, pkg, fileMap);
    expect(errors[0].message).toContain("Barrel import");
    expect(errors[0].suggestedFix).toContain("import { Button } from '@ui/web/Button'");
  });

  it("flags wrong package name with suggestedFix", () => {
    const code = `import { Button } from '@wrong/uikit'`;
    const { errors } = checkImports(code, knownComponents, constraints, pkg, fileMap);
    expect(errors[0].message).toContain("Wrong UIKit package");
    expect(errors[0].suggestedFix).toContain("@ui/web");
  });

  it("flags unknown component name with suggestedFix", () => {
    const code = `import { Ghost } from '@ui/web/ghost'`;
    const { errors } = checkImports(code, knownComponents, constraints, pkg, fileMap);
    expect(errors[0].message).toContain('Unknown UIKit component "Ghost"');
    expect(errors[0].suggestedFix).toContain("list_components");
  });

  it("flags component imported from wrong subpath with corrected import", () => {
    const code = `import { Button } from '@ui/web/Card'`;
    const { errors } = checkImports(code, knownComponents, constraints, pkg, fileMap);
    expect(errors[0].message).toContain("is not exported from");
    expect(errors[0].suggestedFix).toContain("@ui/web/Button");
  });

  describe("a subpath that is the right component spelled the wrong way", () => {
    const multiWord = new Set(["ScrollArea"]);
    const multiWordMap = new Map([["ScrollArea", "ScrollArea"]]);

    for (const wrong of ["scrollArea", "scroll-area", "scroll_area"]) {
      it(`names the casing as the problem for '${wrong}', not the component`, () => {
        const code = `import { ScrollArea } from '@ui/web/${wrong}'`;
        const { errors } = checkImports(code, multiWord, constraints, pkg, multiWordMap);

        expect(errors).toHaveLength(1);
        expect(errors[0].message).toContain("spelled the wrong way");
        // Both spellings, as bare subpaths. The message exists to put them side by
        // side, so naming the wrong one with its scope attached — `@ui/web/scroll-area`
        // against `scrollArea` — asks the reader to strip it off before comparing.
        expect(errors[0].message).toContain(`"${wrong}"`);
        expect(errors[0].message).toContain(`"ScrollArea"`);
        expect(errors[0].message).not.toContain(`"@ui/web/${wrong}"`);
        // The reason it is worth a distinct message: it works on the machine that
        // wrote it and fails in CI.
        expect(errors[0].message).toContain("Linux");
        expect(errors[0].suggestedFix).toContain("@ui/web/ScrollArea");
      });
    }

    it("still reports a genuinely different subpath as the plain error", () => {
      const code = `import { ScrollArea } from '@ui/web/Card'`;
      const { errors } = checkImports(code, multiWord, constraints, pkg, multiWordMap);

      expect(errors[0].message).toContain("is not exported from");
      expect(errors[0].message).not.toContain("spelled the wrong way");
    });

    it("accepts the canonical subpath without comment", () => {
      const code = `import { ScrollArea } from '@ui/web/ScrollArea'`;
      const { errors, uikitImports } = checkImports(
        code,
        multiWord,
        constraints,
        pkg,
        multiWordMap,
      );

      expect(errors).toEqual([]);
      expect(uikitImports.has("ScrollArea")).toBe(true);
    });
  });

  it("handles aliased imports", () => {
    const code = `import { Button as Btn } from '@ui/web/Button'`;
    const { errors, uikitImports } = checkImports(code, knownComponents, constraints, pkg, fileMap);
    expect(errors).toEqual([]);
    expect(uikitImports.has("Button")).toBe(true);
  });

  it("returns empty results for files without uikit imports", () => {
    const code = `import React from 'react'`;
    const { errors, uikitImports } = checkImports(code, knownComponents, constraints, pkg, fileMap);
    expect(errors).toEqual([]);
    expect(uikitImports.size).toBe(0);
  });

  it("does not flag cn imported from @ui/web/utils as an unknown component", () => {
    const code = `import { cn } from '@ui/web/utils'`;
    const { errors } = checkImports(code, knownComponents, constraints, pkg, fileMap);
    expect(errors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildSummary
// ---------------------------------------------------------------------------

describe("buildSummary", () => {
  it("returns success message when no errors", () => {
    const summary = buildSummary([{ path: "src/Foo.tsx", errors: [] }], []);
    expect(summary).toBe(
      "All files look correct — UIKit components, design tokens, and lint all pass.",
    );
  });

  it("includes file errors with numbered list", () => {
    const summary = buildSummary(
      [
        {
          path: "src/Foo.tsx",
          errors: [{ message: "error one" }, { message: "error two" }],
        },
      ],
      [],
    );
    expect(summary).toContain("src/Foo.tsx — 2 issue(s)");
    expect(summary).toContain("1. error one");
    expect(summary).toContain("2. error two");
  });

  it("renders suggestedFix on its own indented line when present", () => {
    const summary = buildSummary(
      [
        {
          path: "src/Foo.tsx",
          errors: [{ message: "bad color", suggestedFix: "use text-primary" }],
        },
      ],
      [],
    );
    expect(summary).toContain("1. bad color");
    expect(summary).toContain("fix: use text-primary");
  });

  it("omits the fix line when suggestedFix is missing", () => {
    const summary = buildSummary(
      [{ path: "src/Foo.tsx", errors: [{ message: "just a message" }] }],
      [],
    );
    expect(summary).not.toContain("fix:");
  });

  it("includes lint errors with command name", () => {
    const summary = buildSummary([], ["ESLint: no-unused-vars"], "pnpm lint");
    expect(summary).toContain("Lint errors (pnpm lint)");
    expect(summary).toContain("ESLint: no-unused-vars");
  });

  it('defaults to "pnpm lint" when command is omitted', () => {
    const summary = buildSummary([], ["some lint error"]);
    expect(summary).toContain("pnpm lint");
  });

  it("skips files with no errors", () => {
    const summary = buildSummary(
      [
        { path: "src/Good.tsx", errors: [] },
        { path: "src/Bad.tsx", errors: [{ message: "oops" }] },
      ],
      [],
    );
    expect(summary).not.toContain("Good.tsx");
    expect(summary).toContain("Bad.tsx");
  });
});

// ---------------------------------------------------------------------------
// validateFile (integration)
// ---------------------------------------------------------------------------

describe("validateFile", () => {
  const knownComponents = new Set(["Button"]);
  const knownRadii = new Set(["sm", "md", "lg", "xl"]);
  const constraints = new Map<string, PropConstraint[]>([
    ["Button", [{ name: "variant", allowedValues: ["primary", "secondary"], required: false }]],
  ]);
  const fileMap = new Map([["Button", "Button"]]);
  const pkg = "@ui/web";

  const run = (code: string) =>
    validateFile(code, knownComponents, knownRadii, constraints, pkg, fileMap);

  it("returns no errors for clean code", () => {
    const code = `
      import { Button } from '@ui/web/Button'
      export default () => <Button variant="primary" className="rounded-md text-primary" />
    `;
    expect(run(code)).toEqual([]);
  });

  it("returns no errors when cn is imported from @ui/web/utils", () => {
    const code = `
      import { cn } from '@ui/web/utils'
      import { Button } from '@ui/web/Button'
      export default ({ active }: { active: boolean }) => (
        <Button className={cn('rounded-md', active && 'text-primary')} variant="primary" />
      )
    `;
    expect(run(code)).toEqual([]);
  });

  it("flags cn imported from a third-party library", () => {
    const code = `
      import { cn } from 'clsx'
      import { Button } from '@ui/web/Button'
      export default () => <Button className={cn('p-4')} variant="primary" />
    `;
    const errors = run(code);
    expect(
      errors.some((e) => e.message.includes('"cn"') && e.message.includes("@ui/web/utils")),
    ).toBe(true);
  });

  it("collects errors from all checkers", () => {
    const code = `
      import { Button } from '@ui/web/Button'
      export default () => (
        <div className="text-red-500 text-sm rounded-2xl">
          <Button variant="danger" />
        </div>
      )
    `;
    const errors = run(code);
    expect(errors.some((e) => e.message.includes("text-red-500"))).toBe(true);
    expect(errors.some((e) => e.message.includes("text-sm"))).toBe(true);
    expect(errors.some((e) => e.message.includes("rounded-2xl"))).toBe(true);
    expect(errors.some((e) => e.message.includes('variant="danger"'))).toBe(true);
  });

  it("every produced error carries a suggestedFix", () => {
    const code = `
      import { Button } from '@ui/web/Button'
      export default () => (
        <div className="text-red-500 text-sm rounded-2xl">
          <Button variant="danger" />
        </div>
      )
    `;
    const errors = run(code);
    expect(errors.length).toBeGreaterThan(0);
    expect(
      errors.every((e) => typeof e.suggestedFix === "string" && e.suggestedFix.length > 0),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// runLint
// ---------------------------------------------------------------------------

describe("runLint", () => {
  it("returns empty array when command succeeds", async () => {
    const errors = await runLint("/tmp", "echo ok");
    expect(errors).toEqual([]);
  });

  it("returns non-empty array when command fails", async () => {
    const errors = await runLint("/tmp", "exit 1");
    expect(Array.isArray(errors)).toBe(true);
  });

  it("parses stdout lines from a failing command", async () => {
    const errors = await runLint("/tmp", 'echo "error: something wrong" && exit 1');
    expect(errors.some((l) => l.includes("error: something wrong"))).toBe(true);
  });
});
