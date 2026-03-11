/**
 * @module docs/er/generate
 * @description CLI entry point to generate human-readable ER diagrams
 * from the machine-readable source of truth (entities.ts).
 *
 * Usage:
 *   npx tsx docs/er/generate.ts              # generate all formats
 *   npx tsx docs/er/generate.ts --mermaid    # mermaid markdown only
 *   npx tsx docs/er/generate.ts --ascii      # ASCII tables only
 *   npx tsx docs/er/generate.ts --summary    # layer summary only
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { KNOWLEDGE_TEAMS_ER } from "./entities.js";
import {
  toMermaidMarkdown,
  toAsciiTables,
  toMarkdownSummary,
} from "./adapter.js";

const ROOT = dirname(resolve(import.meta.dirname, ".."));
const OUT_DIR = resolve(ROOT, "docs", "er", "generated");

// Ensure output directory exists
import { mkdirSync } from "node:fs";
mkdirSync(OUT_DIR, { recursive: true });

const args = process.argv.slice(2);
const all = args.length === 0;

if (all || args.includes("--mermaid")) {
  const mermaid = toMermaidMarkdown(KNOWLEDGE_TEAMS_ER);
  const path = resolve(OUT_DIR, "er-diagrams.md");
  writeFileSync(path, mermaid, "utf-8");
  console.log(`[generated] ${path}`);
}

if (all || args.includes("--ascii")) {
  const ascii = toAsciiTables(KNOWLEDGE_TEAMS_ER);
  const path = resolve(OUT_DIR, "er-ascii.txt");
  writeFileSync(path, ascii, "utf-8");
  console.log(`[generated] ${path}`);
}

if (all || args.includes("--summary")) {
  const summary = toMarkdownSummary(KNOWLEDGE_TEAMS_ER);
  const path = resolve(OUT_DIR, "er-summary.md");
  writeFileSync(path, summary, "utf-8");
  console.log(`[generated] ${path}`);
}

console.log("\nDone. Machine source: docs/er/entities.ts");
console.log("To update: edit entities.ts, then re-run this script.");
