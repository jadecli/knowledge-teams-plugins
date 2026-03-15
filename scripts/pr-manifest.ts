/**
 * @module scripts/pr-manifest
 * @description Generates a token-count manifest for all files changed in the current branch
 * vs origin/main. Uses @anthropic-ai/tokenizer for accurate Claude token counts.
 */

import { countTokens } from "@anthropic-ai/tokenizer";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function getChangedFiles(): string[] {
  const output = execSync("git diff --name-only origin/main...HEAD", {
    cwd: ROOT,
    encoding: "utf-8",
  });
  return output.trim().split("\n").filter(Boolean);
}

function getDiffStats(): Map<string, { added: number; removed: number }> {
  const output = execSync("git diff --numstat origin/main...HEAD", {
    cwd: ROOT,
    encoding: "utf-8",
  });
  const stats = new Map<string, { added: number; removed: number }>();
  for (const line of output.trim().split("\n")) {
    if (!line) continue;
    const [added, removed, file] = line.split("\t");
    // Binary files show '-' for numstat
    if (added === "-" || removed === "-") {
      stats.set(file, { added: 0, removed: 0 });
    } else {
      stats.set(file, { added: parseInt(added, 10), removed: parseInt(removed, 10) });
    }
  }
  return stats;
}

interface FileManifestEntry {
  file: string;
  tokens: number;
  linesAdded: number;
  linesRemoved: number;
  netLines: number;
}

function countFileTokens(filePath: string): number {
  const absPath = resolve(ROOT, filePath);
  if (!existsSync(absPath)) return 0;
  try {
    const content = readFileSync(absPath, "utf-8");
    return countTokens(content);
  } catch {
    return 0;
  }
}

function formatTable(entries: FileManifestEntry[]): string {
  const header = "| File | Tokens | +Lines | -Lines | Net |";
  const sep = "|------|--------|--------|--------|-----|";
  const rows = entries.map(
    (e) => `| \`${e.file}\` | ${e.tokens.toLocaleString()} | +${e.linesAdded} | -${e.linesRemoved} | ${e.netLines >= 0 ? "+" : ""}${e.netLines} |`,
  );

  const totalTokens = entries.reduce((s, e) => s + e.tokens, 0);
  const totalAdded = entries.reduce((s, e) => s + e.linesAdded, 0);
  const totalRemoved = entries.reduce((s, e) => s + e.linesRemoved, 0);
  const totalNet = totalAdded - totalRemoved;

  rows.push(
    `| **TOTAL** | **${totalTokens.toLocaleString()}** | **+${totalAdded}** | **-${totalRemoved}** | **${totalNet >= 0 ? "+" : ""}${totalNet}** |`,
  );

  return [header, sep, ...rows].join("\n");
}

// ─── Main ───────────────────────────────────────────────────────────────────

const files = getChangedFiles();
const stats = getDiffStats();

const entries: FileManifestEntry[] = files
  .filter((f) => f !== "package-lock.json") // Skip lockfile — enormous, not useful
  .map((file) => {
    const s = stats.get(file) ?? { added: 0, removed: 0 };
    return {
      file,
      tokens: countFileTokens(file),
      linesAdded: s.added,
      linesRemoved: s.removed,
      netLines: s.added - s.removed,
    };
  })
  .sort((a, b) => b.tokens - a.tokens); // Highest token count first

// Also count package-lock.json separately
const lockStats = stats.get("package-lock.json");
const lockTokens = countFileTokens("package-lock.json");

console.log("## Branch PR Manifest — Token Counts");
console.log("");
console.log(`> Tokenized with \`@anthropic-ai/tokenizer\` (Claude tokenizer)`);
console.log(`> Branch: \`claude/research-claude-sdk-agents-oVAul\` → \`main\``);
console.log(`> Files changed: ${files.length} (${entries.length} source + 1 lockfile)`);
console.log("");
console.log(formatTable(entries));
console.log("");
if (lockStats) {
  console.log(
    `| \`package-lock.json\` | ${lockTokens.toLocaleString()} | +${lockStats.added} | -${lockStats.removed} | ${lockStats.added - lockStats.removed >= 0 ? "+" : ""}${lockStats.added - lockStats.removed} | *(excluded from total)* |`,
  );
  console.log("");
}

const totalSourceTokens = entries.reduce((s, e) => s + e.tokens, 0);
console.log(`**Total source tokens: ${totalSourceTokens.toLocaleString()}** (excludes package-lock.json)`);
console.log(`**Total with lockfile: ${(totalSourceTokens + lockTokens).toLocaleString()}**`);
