#!/usr/bin/env node

/**
 * Removes @cssVariables and @see blocks from component documentation
 * to reduce context noise for LLM queries
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_DOCS_PATH = path.join(__dirname, "..", "src", "docs", "ai-docs.json");

/**
 * Removes CSS variables and documentation links from JSDoc comments
 * @param {string} content - The JSDoc comment content
 * @returns {string} - Cleaned content without CSS variables and links
 */
function cleanJSDocContent(content) {
  if (!content || typeof content !== "string") {
    return content;
  }

  const lines = content.split("\n");
  const cleanedLines = [];
  let skipUntilNextSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("* @cssVariables")) {
      skipUntilNextSection = true;
      continue;
    }

    if (line.trim().startsWith("* @see")) {
      skipUntilNextSection = true;
      continue;
    }

    if (
      skipUntilNextSection &&
      line.trim().startsWith("* @") &&
      !line.trim().startsWith("* @see")
    ) {
      skipUntilNextSection = false;
      cleanedLines.push(line);
      continue;
    }

    if (
      skipUntilNextSection &&
      line.trim() &&
      !line.trim().startsWith("*") &&
      !line.trim().startsWith(" ")
    ) {
      skipUntilNextSection = false;
      cleanedLines.push(line);
      continue;
    }

    if (!skipUntilNextSection) {
      cleanedLines.push(line);
    }
  }

  let cleanedContent = cleanedLines.join("\n");

  cleanedContent = cleanedContent.replace(/^\/\*\*/, "");
  cleanedContent = cleanedContent.replace(/\*\/$/, "");
  cleanedContent = cleanedContent.replace(/^\s*\*\s?/gm, "");
  cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, "\n\n");
  cleanedContent = cleanedContent
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
  cleanedContent = cleanedContent.replace(/\n{3,}/g, "\n\n");

  return cleanedContent;
}

/**
 * Main function to clean the ai-docs.json file
 */
function cleanAiDocs() {
  try {
    console.log("🧹 Starting ai-docs.json cleanup...");

    if (!fs.existsSync(AI_DOCS_PATH)) {
      console.error(`❌ File not found: ${AI_DOCS_PATH}`);
      process.exit(1);
    }

    const rawContent = fs.readFileSync(AI_DOCS_PATH, "utf8");
    const aiDocs = JSON.parse(rawContent);

    console.log(`📄 Found ${Object.keys(aiDocs).length} components in ai-docs.json`);

    let cleanedCount = 0;
    let totalComponents = 0;

    for (const [componentName, documentation] of Object.entries(aiDocs)) {
      totalComponents++;

      if (documentation === null) continue;

      const originalLength = documentation.length;
      const cleanedDocumentation = cleanJSDocContent(documentation);

      if (cleanedDocumentation !== documentation) {
        aiDocs[componentName] = cleanedDocumentation;
        cleanedCount++;
        console.log(
          `✨ Cleaned ${componentName} (${originalLength} → ${cleanedDocumentation.length} chars)`,
        );
      }
    }

    const cleanedContent = JSON.stringify(aiDocs, null, 2);
    fs.writeFileSync(AI_DOCS_PATH, cleanedContent, "utf8");

    console.log(`\n✅ Cleanup completed!`);
    console.log(`📊 Statistics:`);
    console.log(`   - Total components: ${totalComponents}`);
    console.log(`   - Components cleaned: ${cleanedCount}`);
    console.log(`   - Components unchanged: ${totalComponents - cleanedCount}`);
    console.log(`   - File size reduction: ${rawContent.length} → ${cleanedContent.length} chars`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cleanAiDocs();
}

export { cleanAiDocs, cleanJSDocContent };
