import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

export interface UpstreamRef {
  repo: string;
  commit: string;
  syncedAt: string;
}

export interface PluginManifest {
  name: string;
  version?: string;
  description?: string;
  skills?: string[];
  commands?: string[];
}

export interface LoadedPlugin {
  source: "upstream" | "jade";
  name: string;
  basePath: string;
  manifest: PluginManifest | null;
  skills: string[];
  commands: string[];
}

/**
 * Load the upstream-ref.json to determine which upstream commit we compose against.
 */
export function loadUpstreamRef(rootDir: string): UpstreamRef {
  const refPath = join(rootDir, "upstream-ref.json");
  if (!existsSync(refPath)) {
    throw new Error(`upstream-ref.json not found at ${refPath}`);
  }
  const raw = readFileSync(refPath, "utf-8");
  return JSON.parse(raw) as UpstreamRef;
}

/**
 * Scan a directory for plugin subdirectories.
 * Each subdirectory with a plugin.json or skills/ folder is treated as a plugin.
 */
export function scanPluginDir(dir: string, source: "upstream" | "jade"): LoadedPlugin[] {
  if (!existsSync(dir)) return [];

  const plugins: LoadedPlugin[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (!statSync(fullPath).isDirectory()) continue;

    const manifestPath = join(fullPath, "plugin.json");
    let manifest: PluginManifest | null = null;
    if (existsSync(manifestPath)) {
      manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as PluginManifest;
    }

    const skills = collectMarkdownFiles(join(fullPath, "skills"));
    const commands = collectMarkdownFiles(join(fullPath, "commands"));

    plugins.push({
      source,
      name: entry,
      basePath: fullPath,
      manifest,
      skills,
      commands,
    });
  }

  return plugins;
}

/**
 * Collect .md files from a directory (non-recursive).
 */
function collectMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => join(dir, f));
}

/**
 * Load both upstream and jade plugins, returning them for the resolver.
 */
export function loadAll(rootDir: string): {
  upstreamRef: UpstreamRef;
  upstream: LoadedPlugin[];
  jade: LoadedPlugin[];
} {
  const upstreamRef = loadUpstreamRef(rootDir);

  // Upstream plugins would live in a sibling checkout or submodule.
  // For now, we look for a conventional path relative to root.
  const upstreamDir = join(rootDir, "..", "knowledge-work-plugins", "plugins");
  const upstream = scanPluginDir(upstreamDir, "upstream");

  // Jade extensions live in the extensions/ directory of this repo.
  const jadeDir = join(rootDir, "extensions");
  const jade = scanPluginDir(jadeDir, "jade");

  return { upstreamRef, upstream, jade };
}
