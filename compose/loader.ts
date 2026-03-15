import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { z } from "zod";

const UpstreamRefSchema = z.object({
  repo: z.string(),
  commit: z.string(),
  syncedAt: z.string(),
});

export type UpstreamRef = z.infer<typeof UpstreamRefSchema>;

const PluginManifestSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  description: z.string().optional(),
  skills: z.array(z.string()).optional(),
  commands: z.array(z.string()).optional(),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;

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
  let raw: string;
  try {
    raw = readFileSync(refPath, "utf-8");
  } catch {
    throw new Error(`upstream-ref.json not found at ${refPath}`);
  }
  return UpstreamRefSchema.parse(JSON.parse(raw));
}

/**
 * Scan a directory for plugin subdirectories.
 * Each subdirectory with a plugin.json or skills/ folder is treated as a plugin.
 */
export function scanPluginDir(dir: string, source: "upstream" | "jade"): LoadedPlugin[] {
  let entries: import("fs").Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const plugins: LoadedPlugin[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = join(dir, entry.name);

    let manifest: PluginManifest | null = null;
    try {
      const manifestRaw = readFileSync(join(fullPath, "plugin.json"), "utf-8");
      manifest = PluginManifestSchema.parse(JSON.parse(manifestRaw));
    } catch {
      // No plugin.json or invalid — that's fine
    }

    const skills = collectMarkdownFiles(join(fullPath, "skills"));
    const commands = collectMarkdownFiles(join(fullPath, "commands"));

    plugins.push({
      source,
      name: entry.name,
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
  try {
    return readdirSync(dir)
      .filter((f: string) => f.endsWith(".md"))
      .map((f: string) => join(dir, f));
  } catch {
    return [];
  }
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
