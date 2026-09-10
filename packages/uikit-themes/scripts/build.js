import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, "../src");
const DIST_DIR = path.join(__dirname, "../dist");
const GENERATED_DIR = path.join(SRC_DIR, "generated");
const STATIC_DIR = path.join(SRC_DIR, "static");
const FOUNDATION_DIR = path.join(SRC_DIR, "foundation");

const WHITELISTED_PREFIXES = [
  "--components_",
  "--colors_",
  "--typography_typography_components",
  "--typography_font_family_",
  "--border_radius_",
];

// Helper functions from parse-raw-css.js
function formatCssContent(cssContent) {
  const withoutRoot = cssContent.replace(/^:root\s*\{/, "").replace(/\}\s*$/, "");
  const noSpaces = withoutRoot.replace(/\s{2,}/g, "");
  const singleLine = noSpaces.replace(/\n/g, "");
  const formatted = singleLine.replace(/;/g, ";\n");
  return formatted.split("\n");
}

function mapVariables(cssContent) {
  const arrayOfLines = formatCssContent(cssContent);
  const cssMap = new Map();
  for (const line of arrayOfLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("//") || trimmedLine.startsWith("/*")) continue;
    const [propName, propValue] = trimmedLine.split(": ");
    const cleanValue = propValue ? propValue.replace(/;$/, "") : propValue;
    cssMap.set(propName, cleanValue);
  }
  return cssMap;
}

function filterVariablesForExport(variablesMap, brandName) {
  const variablesForExport = new Map();
  const whitelistedSuffixes = [`-${brandName}`, `_${brandName}`];
  for (const [cssKey, cssValue] of variablesMap) {
    const isWhitelistedPrefix = WHITELISTED_PREFIXES.some((prefix) => cssKey.startsWith(prefix));
    const isWhitelistedSuffix = whitelistedSuffixes.some((suffix) => cssKey.endsWith(suffix));
    if (isWhitelistedPrefix && isWhitelistedSuffix) {
      variablesForExport.set(cssKey, cssValue);
    }
  }
  return variablesForExport;
}

function resolveVariableReferences(whitelistedVariables, allVariablesMap) {
  const resolvedVariables = new Map();
  const MAX_ITERATIONS = 20;
  for (const [variableName, variableValue] of whitelistedVariables) {
    let resolvedValue = variableValue;
    let iterations = 0;
    let hasChanges = true;
    while (hasChanges && iterations < MAX_ITERATIONS) {
      hasChanges = false;
      iterations++;
      const varRegex = /var\(([^)]+)\)/g;
      let match;
      while ((match = varRegex.exec(resolvedValue)) !== null) {
        const referencedVariable = match[1].trim();
        if (allVariablesMap.has(referencedVariable)) {
          const referencedValue = allVariablesMap.get(referencedVariable);
          resolvedValue = resolvedValue.replace(match[0], referencedValue);
          hasChanges = true;
        }
      }
    }
    resolvedVariables.set(variableName, resolvedValue);
  }
  return resolvedVariables;
}

function addPxToNumbers(variablesMap) {
  const variablesWithPx = new Map();
  const unitlessProperties = ["font-weight", "opacity", "z-index"];
  for (const [variableName, variableValue] of variablesMap) {
    let processedValue = variableValue;
    const isUnitlessProperty = unitlessProperties.some((prop) =>
      variableName.toLowerCase().includes(prop.toLowerCase()),
    );
    if (isUnitlessProperty) {
      variablesWithPx.set(variableName, processedValue);
      continue;
    }
    const numberRegex = /\b(\d+(?:\.\d+)?)\b/g;
    processedValue = processedValue.replace(numberRegex, (match) => {
      const beforeMatch = processedValue.substring(0, processedValue.indexOf(match));
      const afterMatch = processedValue.substring(processedValue.indexOf(match) + match.length);
      if (
        beforeMatch.includes("#") ||
        beforeMatch.includes("rgba") ||
        beforeMatch.includes("rgb")
      ) {
        return match;
      }
      if (afterMatch.match(/^(px|em|rem|%|vw|vh|deg|rad|turn|ms|s)/)) {
        return match;
      }
      return `${match}px`;
    });
    variablesWithPx.set(variableName, processedValue);
  }
  return variablesWithPx;
}

function convertRgbaToHex(variablesMap) {
  const convertedVariables = new Map();
  for (const [variableName, variableValue] of variablesMap) {
    let convertedValue = variableValue;
    const rgbaRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g;
    convertedValue = convertedValue.replace(rgbaRegex, (match, r, g, b, a) => {
      if (!a || parseFloat(a) === 1) {
        const hexR = parseInt(r).toString(16).padStart(2, "0");
        const hexG = parseInt(g).toString(16).padStart(2, "0");
        const hexB = parseInt(b).toString(16).padStart(2, "0");
        return `#${hexR}${hexG}${hexB}`;
      }
      return match;
    });
    convertedVariables.set(variableName, convertedValue);
  }
  return convertedVariables;
}

function cleanVariableNames(variablesMap, brandName) {
  const cleanedVariables = new Map();
  const removeValues = [
    { value: "--colors_common_", replacer: "--" },
    { value: "--colors_", replacer: "--" },
    { value: "--components_sc_", replacer: "--" },
    { value: "--components_", replacer: "--" },
    { value: "--typography_font_family_", replacer: "--" },
    { value: "-light_", replacer: "-" },
    { value: "-dark_", replacer: "-" },
    { value: "--border_radius_default_", replacer: "--radius-" },
    { value: "--border_radius_", replacer: "--radius-" },
    { value: "_", replacer: "-" },
    { value: "--typography-typography-components-", replacer: "--typography-components-" },
  ];
  const whitelistedSuffixes = [`-${brandName}`, `_${brandName}`];

  for (const [variableName, variableValue] of variablesMap) {
    let cleanedName = variableName;
    removeValues.forEach((item) => {
      cleanedName = cleanedName.replace(new RegExp(item.value, "g"), item.replacer);
    });
    whitelistedSuffixes.forEach((suffix) => {
      if (cleanedName.endsWith(suffix)) {
        cleanedName = cleanedName.substring(0, cleanedName.length - suffix.length);
      }
    });
    cleanedVariables.set(cleanedName, variableValue);
  }

  const sortedVariables = new Map();
  const sortedKeys = Array.from(cleanedVariables.keys()).sort();
  sortedKeys.forEach((key) => {
    sortedVariables.set(key, cleanedVariables.get(key));
  });
  return sortedVariables;
}

function processGeneratedFiles() {
  console.log("⚙️  Processing generated files...");
  if (!fs.existsSync(GENERATED_DIR)) {
    console.warn(`⚠️  Generated directory not found: ${GENERATED_DIR}`);
    return;
  }

  const files = fs.readdirSync(GENERATED_DIR).filter((f) => f.endsWith(".css"));
  for (const file of files) {
    const brandName = path.basename(file, ".css");
    const inputPath = path.join(GENERATED_DIR, file);
    const outputPath = path.join(DIST_DIR, file);

    const cssContent = fs.readFileSync(inputPath, "utf8");
    const allVariablesMap = mapVariables(cssContent);
    const whitelistedVariables = filterVariablesForExport(allVariablesMap, brandName);
    const resolvedVariables = resolveVariableReferences(whitelistedVariables, allVariablesMap);
    const variablesWithPx = addPxToNumbers(resolvedVariables);
    const convertedHexColorsVariables = convertRgbaToHex(variablesWithPx);
    const cleanedVariables = cleanVariableNames(convertedHexColorsVariables, brandName);

    const cssVariables = [];
    for (const [variableName, variableValue] of cleanedVariables) {
      cssVariables.push(`  ${variableName}: ${variableValue};`);
    }

    // Use :root instead of .brandName
    const outputContent = `:root {\n${cssVariables.join("\n")}\n}\n`;
    fs.writeFileSync(outputPath, outputContent, "utf8");
  }
}

/** Local Figma export snapshots — keep in src for sync, never ship to dist. */
const STATIC_SKIP = new Set(["last-vars.css"]);

function copyDirectory(src, dest) {
  console.log(`📋 Copying ${path.basename(src)} to dist...`);
  if (!fs.existsSync(src)) {
    console.warn(`⚠️  Source directory not found: ${src}`);
    return;
  }
  const files = fs.readdirSync(src).filter((f) => f.endsWith(".css") && !STATIC_SKIP.has(f));
  for (const file of files) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
  }
}

function generateStorybookCss() {
  console.log("🎨 Generating storybook.css...");
  const outputFile = path.join(DIST_DIR, "storybook.css");
  const files = fs.readdirSync(DIST_DIR).filter((f) => f.endsWith(".css") && f !== "storybook.css");

  let outputCss = "/* Auto-generated by scripts/build.js */\n\n@layer theme {\n  :root {\n";

  for (const file of files) {
    const themeName = path.basename(file, ".css");
    const content = fs.readFileSync(path.join(DIST_DIR, file), "utf8");

    // Replace :root { with @variant themeName {
    const scopedContent = content.replace(/:root\s*\{/g, `@variant ${themeName} {`);

    outputCss += `    /* Theme: ${themeName} */\n`;

    const lines = scopedContent.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("@variant")) {
        outputCss += `    ${trimmed}\n`;
      } else if (trimmed === "}") {
        outputCss += `    }\n`;
      } else {
        outputCss += `      ${trimmed}\n`;
      }
    }
    outputCss += "\n";
  }

  outputCss += "  }\n}\n";
  fs.writeFileSync(outputFile, outputCss);
}

function main() {
  console.log("🚀 Starting build process...");

  console.log("🧹 Preparing dist directory...");
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  processGeneratedFiles();

  copyDirectory(STATIC_DIR, DIST_DIR);

  generateStorybookCss();

  copyDirectory(FOUNDATION_DIR, DIST_DIR);

  console.log("🎉 Build completed successfully! dist is ready.");
}

main();
