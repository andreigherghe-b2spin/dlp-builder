import { exec } from "child_process";
import { promisify } from "util";
import {
  getAllComponentsDocs,
  getAllComponentConstraints,
  getPackageName,
  getComponentFileMap,
  normalizeComponentKey,
  type PropConstraint,
} from "./componentDocs";
import { getThemeClassesMeta } from "./themeClasses";

const execAsync = promisify(exec);

export interface FileInput {
  path: string;
  content: string;
}

/**
 * One UIKit violation. `message` describes what is wrong; `suggestedFix` (when
 * present) is a short, copy-pasteable hint the agent can apply directly.
 */
export interface ValidationError {
  message: string;
  suggestedFix?: string;
}

export interface FileValidationResult {
  path: string;
  errors: ValidationError[];
}

export interface ValidationResult {
  valid: boolean;
  lintPassed: boolean;
  files: FileValidationResult[];
  lintErrors: string[];
  summary: string;
}

/**
 * Runs a lint command in the given directory and returns parsed error lines.
 * Exits cleanly if the command is not found or produces no output.
 */
export async function runLint(cwd: string, command = "pnpm lint"): Promise<string[]> {
  try {
    await execAsync(command, { cwd });
    return [];
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    const raw = (e.stdout ?? "") + "\n" + (e.stderr ?? "");
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }
}

const TAILWIND_BUILTIN_COLORS =
  "red|blue|green|yellow|purple|pink|orange|teal|cyan|indigo|violet|fuchsia|rose|sky|lime|emerald|amber|slate|gray|zinc|neutral|stone";

export const HARDCODED_COLOR_RE = new RegExp(
  `\\b(text|bg|border|ring|fill|stroke|from|via|to|shadow|outline|decoration|accent|caret|divide|placeholder)-(${TAILWIND_BUILTIN_COLORS})-\\d{2,3}\\b`,
  "g",
);

export const HARDCODED_TEXT_SIZE_RE =
  /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g;

// rounded-none (reset to 0) and rounded-full (pill/circle semantic) are intentional utilities,
// not design-token values, so they are excluded from this check.
export const HARDCODED_ROUNDED_RE = /\brounded-(sm|md|lg|xl|2xl|3xl|\d+)\b/g;

/**
 * Captures: [1] named imports, [2] the full package specifier.
 * Matches any import whose package path contains the word "uikit" so we can
 * flag wrong package names (e.g. '@wrong/uikit') in addition to validating
 * component names and props.
 */
/**
 * Captures imports from this design system, by scope rather than by the word
 * "uikit": the packages were renamed `@uikit/*` → `@ui/*`, and a pattern keyed
 * to the old name matched nothing afterwards — every import check below silently
 * passed on any input. The old scope is still matched on purpose, so a file that
 * kept the pre-rename name is reported as the wrong package instead of being
 * ignored.
 */
export const UIKIT_IMPORT_RE =
  /import\s+\{([^}]+)\}\s+from\s+['"]((?:@ui\/|[^'"]*uikit)[^'"]*)['"]/g;

/**
 * Captures imports of `cn` — either as a named import `{ cn }` or a default
 * import — from any package. Group [1] is the source specifier.
 */
export const CN_IMPORT_RE = /import\s+(?:\{[^}]*\bcn\b[^}]*\}|cn)\s+from\s+['"]([^'"]+)['"]/g;

const CN_VALID_SOURCE = "@ui/web/utils";

/**
 * Utility exports that are part of the UIKit package but are not components.
 * They are skipped during the "unknown component" check in `checkImports`.
 */
const UIKIT_KNOWN_UTIL_EXPORTS = new Set(["cn"]);

/**
 * Given a list of component names and a file map, groups them by their correct
 * subpath and returns example import statements to show in error messages.
 */
export function buildImportSuggestions(
  names: string[],
  fileMap: Map<string, string>,
  pkg: string,
): string {
  const bySubpath = new Map<string, string[]>();
  const unknown: string[] = [];

  for (const name of names) {
    const subpath = fileMap.get(name);
    if (subpath) {
      const list = bySubpath.get(subpath) ?? [];
      list.push(name);
      bySubpath.set(subpath, list);
    } else {
      unknown.push(name);
    }
  }

  const lines: string[] = [];
  for (const [subpath, comps] of bySubpath) {
    lines.push(`import { ${comps.join(", ")} } from '${pkg}/${subpath}'`);
  }
  if (unknown.length > 0) {
    lines.push(`// Unknown components (check list_components): ${unknown.join(", ")}`);
  }
  return lines.join("\n");
}

export function matchAll(re: RegExp, code: string): string[] {
  re.lastIndex = 0;
  return [...new Set(code.match(re) ?? [])];
}

/**
 * Detects `cn` imported from any source other than `@ui/web/utils`.
 * Both named (`import { cn } from '...'`) and default (`import cn from '...'`)
 * import styles are covered.
 */
export function checkCnImport(code: string): ValidationError[] {
  CN_IMPORT_RE.lastIndex = 0;
  const errors: ValidationError[] = [];
  let m: RegExpExecArray | null;
  while ((m = CN_IMPORT_RE.exec(code)) !== null) {
    const source = m[1];
    if (source !== CN_VALID_SOURCE) {
      errors.push({
        message: `"cn" must be imported from "${CN_VALID_SOURCE}", not from "${source}".`,
        suggestedFix: `Replace with: import { cn } from '${CN_VALID_SOURCE}'`,
      });
    }
  }
  return errors;
}

/** Detects hardcoded Tailwind palette colors (e.g. text-red-500, bg-blue-200). */
export function checkColors(code: string): ValidationError[] {
  return matchAll(HARDCODED_COLOR_RE, code).map((cls) => ({
    message: `Hardcoded Tailwind color "${cls}" is not allowed — use a design-system token.`,
    suggestedFix:
      `Replace "${cls}" with a semantic design-system token (e.g. text-primary, bg-error, ` +
      `border-surface). Run get_tailwind_theme_classes for the full list.`,
  }));
}

/** Detects hardcoded Tailwind font-size utilities (e.g. text-sm, text-2xl). */
export function checkTextSizes(code: string): ValidationError[] {
  return matchAll(HARDCODED_TEXT_SIZE_RE, code).map((cls) => ({
    message: `Hardcoded font-size "${cls}" is not allowed.`,
    suggestedFix:
      `Replace "${cls}" with a Typography* component (preferred) or a theme text token. ` +
      `Run list_typography_variants to see available Typography components.`,
  }));
}

/**
 * Detects rounded-* utilities that are not backed by a design-system token.
 *
 * HARDCODED_ROUNDED_RE catches rounded-{sm|md|lg|xl|2xl|3xl|number} as candidates.
 * rounded-none and rounded-full are intentionally excluded from the regex:
 *   rounded-none = explicit reset to 0, not a design value
 *   rounded-full = semantic pill/circle utility, not a size token
 * For all other candidates: allow only if the token exists in the design system
 * (i.e. --radius-{token} is defined in config.css). Everything else is an error.
 */
export function checkRadii(code: string, knownRadii: Set<string>): ValidationError[] {
  return matchAll(HARDCODED_ROUNDED_RE, code)
    .filter((cls) => !knownRadii.has(cls.replace("rounded-", "")))
    .map((cls) => ({
      message: `Hardcoded radius "${cls}" is not a design-system token.`,
      suggestedFix:
        `Replace "${cls}" with one of the design-system rounded-* tokens. ` +
        `Run get_tailwind_theme_classes to see the available rounded-* tokens.`,
    }));
}

/**
 * Checks string-literal prop values against allowed union values from the docs.
 *
 * Uses a per-component regex of the form `<ComponentName\b[^>]*propName="value"`.
 * This reliably catches single-line and most multi-line JSX tags.
 * Tags where a JSX expression containing `>` appears before the target prop
 * are a known edge case — AST parsing would be needed to handle those.
 */
export function checkPropValues(
  code: string,
  uikitImports: Set<string>,
  constraints: Map<string, PropConstraint[]>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [componentName, props] of constraints) {
    if (!uikitImports.has(componentName)) continue;

    for (const { name: propName, allowedValues } of props) {
      if (!allowedValues) continue;

      const re = new RegExp(`<${componentName}\\b[^>]*\\b${propName}="([^"]+)"`, "g");
      let m: RegExpExecArray | null;
      re.lastIndex = 0;
      while ((m = re.exec(code)) !== null) {
        const value = m[1];
        if (!allowedValues.includes(value)) {
          const allowedStr = allowedValues.map((v) => `"${v}"`).join(" | ");
          errors.push({
            message: `<${componentName}> has invalid prop ${propName}="${value}".`,
            suggestedFix: `Replace ${propName}="${value}" with one of: ${allowedStr}.`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validates all UIKit imports in the file: package name, barrel imports, unknown
 * components, and wrong subpaths. Returns collected errors and the set of valid
 * imported component names for downstream prop-value checks.
 */
export function checkImports(
  code: string,
  knownComponents: Set<string>,
  constraints: Map<string, PropConstraint[]>,
  correctPackage: string,
  fileMap: Map<string, string>,
): { errors: ValidationError[]; uikitImports: Set<string> } {
  const errors: ValidationError[] = [];
  const uikitImports = new Set<string>();

  UIKIT_IMPORT_RE.lastIndex = 0;
  let importMatch: RegExpExecArray | null;
  while ((importMatch = UIKIT_IMPORT_RE.exec(code)) !== null) {
    const pkg = importMatch[2];
    const names = importMatch[1]
      .split(",")
      .map((s) => s.trim().replace(/\s+as\s+\w+$/, ""))
      .filter(Boolean);

    if (pkg === correctPackage) {
      const fix =
        fileMap.size > 0
          ? `Use per-component imports instead:\n${buildImportSuggestions(names, fileMap, correctPackage)}`
          : `Use per-component imports instead, e.g. import { Button } from '${correctPackage}/button'`;
      errors.push({
        message: `Barrel import from "${correctPackage}" is not supported — the package has no top-level export.`,
        suggestedFix: fix,
      });
      continue;
    }

    if (!pkg.startsWith(correctPackage + "/")) {
      errors.push({
        message: `Wrong UIKit package "${pkg}".`,
        suggestedFix: `Use "${correctPackage}/<component-file>" (e.g. '${correctPackage}/button').`,
      });
      continue;
    }

    const subpath = pkg.slice(correctPackage.length + 1);
    for (const name of names) {
      if (UIKIT_KNOWN_UTIL_EXPORTS.has(name)) {
        // Utility exports (e.g. `cn`) are validated separately by checkCnImport.
        continue;
      }

      if (!knownComponents.has(name)) {
        errors.push({
          message: `Unknown UIKit component "${name}" — not found in component docs.`,
          suggestedFix: `Run list_components to see available names.`,
        });
        continue;
      }

      const expectedSubpath = fileMap.get(name);
      if (expectedSubpath && expectedSubpath !== subpath) {
        // A subpath that differs from the canonical one only in casing or separators
        // is the single most likely mistake — the export is `ScrollArea` and the
        // file is `scrollArea`, so writing the component's own name, or the
        // kebab-case the subpaths used before, is the natural guess. It also fails in
        // the nastiest way: macOS resolves it case-insensitively, so it works locally
        // and breaks on Linux in CI. Worth saying out loud rather than reporting as a
        // plain unknown subpath.
        const sameComponent =
          normalizeComponentKey(subpath) === normalizeComponentKey(expectedSubpath);

        errors.push({
          // `subpath`, not `pkg`: the whole point of the message is to put the two
          // spellings side by side, and `@ui/web/scroll-area` against `scrollArea`
          // asks the reader to strip the scope off one of them first.
          message: sameComponent
            ? `Subpath "${subpath}" is the right component spelled the wrong way — ` +
              `the published file is "${expectedSubpath}". This resolves on a ` +
              `case-insensitive filesystem (macOS) and fails on Linux.`
            : `Component "${name}" is not exported from "${pkg}".`,
          suggestedFix: `Use: import { ${name} } from '${correctPackage}/${expectedSubpath}'`,
        });
        continue;
      }

      uikitImports.add(name);
    }
  }

  errors.push(...checkPropValues(code, uikitImports, constraints));

  return { errors, uikitImports };
}

/** Formats the validation summary string shown to the agent. */
export function buildSummary(
  fileResults: FileValidationResult[],
  lintErrors: string[],
  lintCommand?: string,
): string {
  const parts: string[] = [];

  const failing = fileResults.filter((r) => r.errors.length > 0);
  if (failing.length > 0) {
    parts.push(
      failing
        .map(
          (r) =>
            `${r.path} — ${r.errors.length} issue(s):\n` +
            r.errors
              .map((e, i) => {
                const fixLine = e.suggestedFix ? `\n     fix: ${e.suggestedFix}` : "";
                return `  ${i + 1}. ${e.message}${fixLine}`;
              })
              .join("\n"),
        )
        .join("\n\n"),
    );
  }

  if (lintErrors.length > 0) {
    parts.push(`Lint errors (${lintCommand ?? "pnpm lint"}):\n${lintErrors.join("\n")}`);
  }

  return parts.length === 0
    ? "All files look correct — UIKit components, design tokens, and lint all pass."
    : parts.join("\n\n");
}

export function validateFile(
  code: string,
  knownComponents: Set<string>,
  knownRadii: Set<string>,
  constraints: Map<string, PropConstraint[]>,
  correctPackage: string,
  fileMap: Map<string, string>,
): ValidationError[] {
  const { errors } = checkImports(code, knownComponents, constraints, correctPackage, fileMap);
  return [
    ...errors,
    ...checkCnImport(code),
    ...checkColors(code),
    ...checkTextSizes(code),
    ...checkRadii(code, knownRadii),
  ];
}

/**
 * Validates one or more JSX/TSX files against UIKit conventions:
 * - All UIKit-imported component names must exist in the component docs
 * - No hardcoded Tailwind palette colors (use design tokens)
 * - No raw font-size utilities (use Typography* components or theme tokens)
 * - No unsupported rounded utilities (use radii design tokens)
 */
export async function validateUsage(
  files: FileInput[],
  lintCwd?: string,
  lintCommand?: string,
): Promise<ValidationResult> {
  const [docs, themeMeta, constraints, correctPackage, fileMap] = await Promise.all([
    getAllComponentsDocs(),
    getThemeClassesMeta(),
    getAllComponentConstraints(),
    getPackageName(),
    getComponentFileMap(),
  ]);
  const knownComponents = new Set(Object.keys(docs));
  const knownRadii = new Set(themeMeta.radii);

  const fileResults: FileValidationResult[] = files.map(({ path, content }) => ({
    path,
    errors: validateFile(
      content,
      knownComponents,
      knownRadii,
      constraints,
      correctPackage,
      fileMap,
    ),
  }));

  const lintErrors = lintCwd ? await runLint(lintCwd, lintCommand) : [];
  const lintPassed = lintErrors.length === 0;
  const uikitPassed = fileResults.every((r) => r.errors.length === 0);
  const valid = uikitPassed && lintPassed;
  const summary = buildSummary(fileResults, lintErrors, lintCommand);

  return { valid, lintPassed, files: fileResults, lintErrors, summary };
}
