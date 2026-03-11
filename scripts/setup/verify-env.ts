/**
 * @module scripts/setup/verify-env
 * @description Verifies that required environment variables and tools are available.
 * Run: npx tsx scripts/setup/verify-env.ts
 */

import { execSync } from "node:child_process";

interface Check {
  name: string;
  test: () => boolean;
  fix: string;
}

function tryExec(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "pipe", timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

const checks: Check[] = [
  {
    name: "GH_TOKEN or gh auth",
    test: () => !!process.env.GH_TOKEN || tryExec("gh auth status"),
    fix: "Run 'gh auth login' or set GH_TOKEN. See scripts/setup/CLAUDE.md",
  },
  {
    name: "gh CLI installed",
    test: () => tryExec("gh --version"),
    fix: "Install: https://cli.github.com/ or 'apt install gh'",
  },
  {
    name: "DATABASE_URL (Neon)",
    test: () => !!process.env.DATABASE_URL,
    fix: "Set DATABASE_URL in .env or environment. See .env.example",
  },
  {
    name: "NEON_API_KEY",
    test: () => !!process.env.NEON_API_KEY,
    fix: "Set NEON_API_KEY for branch-per-PR CI. See .env.example",
  },
  {
    name: "NEON_PROJECT_ID",
    test: () => !!process.env.NEON_PROJECT_ID,
    fix: "Set NEON_PROJECT_ID for branch-per-PR CI. See .env.example",
  },
  {
    name: "ANTHROPIC_ORG_API_KEY (optional)",
    test: () => !!process.env.ANTHROPIC_ORG_API_KEY,
    fix: "Set for Claude Organizations API usage metrics (live integration test)",
  },
  {
    name: "Node.js >= 22",
    test: () => {
      const major = parseInt(process.versions.node.split(".")[0], 10);
      return major >= 22;
    },
    fix: "Upgrade Node.js to v22+. Current: " + process.versions.node,
  },
];

console.log("Environment verification\n");

let passed = 0;
let failed = 0;

for (const check of checks) {
  const ok = check.test();
  const icon = ok ? "OK" : "MISSING";
  console.log(`  [${icon}] ${check.name}`);
  if (!ok) {
    console.log(`         -> ${check.fix}`);
    failed++;
  } else {
    passed++;
  }
}

console.log(`\n${passed} passed, ${failed} missing\n`);

if (failed > 0) {
  console.log("Some environment variables are not set.");
  console.log("Core functionality (build, test) works without them.");
  console.log("Database and GitHub API features require the missing vars.");
}
