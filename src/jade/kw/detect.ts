/**
 * KW detection — maps repos to VP seats using the canonical seats.json.
 *
 * This module is the single source of truth for repo→KW routing.
 * jade-harness and other consumers should import from here instead of
 * maintaining their own kw_repo_map.
 */

import { readFileSync } from "fs";
import { execSync } from "child_process";
import { join, resolve } from "path";
import type {
  EffortLevel,
  KWDetectionResult,
  KWSeatsConfig,
  KWSeat,
  STOFrontmatter,
} from "./types.js";

// Module-level cache
let cachedConfig: KWSeatsConfig | null = null;

const SEATS_JSON_PATH = resolve(import.meta.dirname ?? __dirname, "seats.json");
const S_TEAM_DIR = resolve(
  import.meta.dirname ?? __dirname,
  "..",
  "..",
  "..",
  "s-team"
);

/**
 * Load and cache seats.json.
 */
export function loadSeatsConfig(seatsPath?: string): KWSeatsConfig {
  if (cachedConfig) return cachedConfig;
  const raw = readFileSync(seatsPath ?? SEATS_JSON_PATH, "utf-8");
  cachedConfig = JSON.parse(raw) as KWSeatsConfig;
  return cachedConfig;
}

/**
 * Reset the cached config (for testing).
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}

/**
 * Parse YAML frontmatter from an STO file.
 * Expects the format used in s-team/*.md:
 *   ---
 *   role: Chief Technology Officer
 *   model: claude-opus-4-6
 *   safety_research: alignment-faking-extensions
 *   fitness_function: p95 deploy-to-production latency under 15 minutes
 *   budget_tool_calls: 50
 *   ---
 */
export function parseStoFrontmatter(
  stoName: string,
  sTeamDir?: string
): STOFrontmatter | null {
  const dir = sTeamDir ?? S_TEAM_DIR;
  const filePath = join(dir, `${stoName}.md`);
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = match[1];
  const get = (key: string): string => {
    const m = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return m ? m[1].trim() : "";
  };

  return {
    role: get("role"),
    model: get("model"),
    safetyResearch: get("safety_research"),
    fitnessFunction: get("fitness_function"),
    budgetToolCalls: parseInt(get("budget_tool_calls"), 10) || 0,
  };
}

/**
 * Derive effort level from model name.
 *   opus  → high
 *   haiku → low
 *   else  → medium (sonnet, unknown)
 */
export function deriveEffort(model: string): EffortLevel {
  if (model.includes("opus")) return "high";
  if (model.includes("haiku")) return "low";
  return "medium";
}

/**
 * Detect the KW seat for a given repo slug (e.g. "jadecli/knowledge-teams-plugins").
 *
 * Returns full KWDetectionResult with model, effort, budget from the STO file
 * when available, or defaults for unmapped/STO-less repos.
 */
export function detectKW(
  repoSlug: string,
  seatsPath?: string,
  sTeamDir?: string
): KWDetectionResult {
  const config = loadSeatsConfig(seatsPath);
  const kwId = config.repoMap[repoSlug];

  if (!kwId) {
    return {
      ...config.defaults,
      fitnessFunction: null,
      mapped: false,
    };
  }

  const seat = config.seats.find((s) => s.kwId === kwId);
  if (!seat) {
    return {
      ...config.defaults,
      kwId,
      fitnessFunction: null,
      mapped: true,
    };
  }

  // Try to load STO frontmatter for model/budget/fitness
  if (seat.sto) {
    const sto = parseStoFrontmatter(seat.sto, sTeamDir);
    if (sto) {
      return {
        kwId: seat.kwId,
        plugin: seat.plugin,
        title: seat.title,
        model: sto.model,
        budgetToolCalls: sto.budgetToolCalls,
        effort: deriveEffort(sto.model),
        fitnessFunction: sto.fitnessFunction,
        mapped: true,
      };
    }
  }

  // Seat exists but no STO — use defaults for model/budget
  return {
    kwId: seat.kwId,
    plugin: seat.plugin,
    title: seat.title,
    model: config.defaults.model,
    budgetToolCalls: config.defaults.budgetToolCalls,
    effort: config.defaults.effort,
    fitnessFunction: null,
    mapped: true,
  };
}

/**
 * Detect KW from the current working directory's git remote.
 * Extracts the org/repo slug from `git remote get-url origin`.
 * Returns defaults on failure (no git, no remote, etc.).
 */
export function detectKWFromCwd(
  cwd?: string,
  seatsPath?: string,
  sTeamDir?: string
): KWDetectionResult {
  try {
    const url = execSync("git remote get-url origin", {
      cwd: cwd ?? process.cwd(),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    const slug = extractRepoSlug(url);
    if (!slug) {
      return detectKW("", seatsPath, sTeamDir);
    }
    return detectKW(slug, seatsPath, sTeamDir);
  } catch {
    const config = loadSeatsConfig(seatsPath);
    return {
      ...config.defaults,
      fitnessFunction: null,
      mapped: false,
    };
  }
}

/**
 * Extract "org/repo" from a git remote URL.
 * Handles both SSH and HTTPS formats:
 *   git@github.com:jadecli/knowledge-teams-plugins.git → jadecli/knowledge-teams-plugins
 *   https://github.com/jadecli/knowledge-teams-plugins.git → jadecli/knowledge-teams-plugins
 */
export function extractRepoSlug(remoteUrl: string): string | null {
  // SSH format: git@github.com:org/repo.git
  const sshMatch = remoteUrl.match(/:([^/]+\/[^/]+?)(?:\.git)?$/);
  if (sshMatch) return sshMatch[1];

  // HTTPS format: https://github.com/org/repo.git
  const httpsMatch = remoteUrl.match(
    /github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/
  );
  if (httpsMatch) return httpsMatch[1];

  return null;
}

/**
 * Return all 13 VP seats.
 */
export function getAllSeats(seatsPath?: string): KWSeat[] {
  const config = loadSeatsConfig(seatsPath);
  return config.seats;
}

/**
 * Look up a single seat by KW ID.
 */
export function getSeatByKwId(
  kwId: string,
  seatsPath?: string
): KWSeat | undefined {
  const config = loadSeatsConfig(seatsPath);
  return config.seats.find((s) => s.kwId === kwId);
}
