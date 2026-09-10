#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, "..", "src", "components", "ui", "docs", "ai-docs.json");
const dest = path.join(__dirname, "..", "dist", "components", "ui", "docs", "ai-docs.json");

if (!fs.existsSync(src)) {
  console.error(`ai-docs.json not found at ${src}. Run codegen:reindex-ai-docs first.`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log(`Copied ai-docs.json → dist/components/ui/docs/ai-docs.json`);
