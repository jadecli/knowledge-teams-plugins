import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

// ---------------------------------------------------------------------------
// Legacy single-upstream ref (backward compat)
// ---------------------------------------------------------------------------

export interface UpstreamRef {
  repo: string;
  commit: string;
  syncedAt: string;
}

// ---------------------------------------------------------------------------
// Multi-upstream refs (new)
// ---------------------------------------------------------------------------

export interface UpstreamEntry {
  repo: string;
  origin: string;
  commit: string | null;
  syncedAt: string | null;
  type: "plugins" | "sdk";
  /** Relative path to local checkout (for type=plugins) */
  localPath?: string;
  /** Subdirectory within the repo containing plugin dirs */
  pluginDir?: string;
  /** npm package name (for type=sdk) */
  npmPackage?: string;
}

export interface McpServerEntry {
  npmPackage: string;
  org: string;
  requiredEnv: string[];
}

export interface SdkEntry {
  npmPackage: string;
  version: string | null;
}

export interface CloudProviderEntry {
  envKey: string | null;
  authMode: string;
  requiredEnv?: string[];
  optionalEnv?: string[];
}

export interface UpstreamRefs {
  upstreams: Record<string, UpstreamEntry>;
  mcpServers: Record<string, McpServerEntry>;
  sdks: Record<string, SdkEntry>;
  cloudProviders: Record<string, CloudProviderEntry>;
}

// ---------------------------------------------------------------------------
// Plugin scanning
// ---------------------------------------------------------------------------

export interface PluginManifest {
  name: string;
  version?: string;
  description?: string;
  skills?: string[];
  commands?: string[];
}

export interface LoadedPlugin {
  source: "upstream" | "jade";
  /** Which upstream this came from (e.g. "knowledge-work-plugins") */
  sourceId: string;
  name: string;
  basePath: string;
  manifest: PluginManifest | null;
  skills: string[];
  commands: string[];
}

/**
 * Load the legacy upstream-ref.json (single upstream).
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
 * Load the multi-upstream refs manifest.
 * Falls back to legacy upstream-ref.json if upstream-refs.json doesn't exist.
 */
export function loadUpstreamRefs(rootDir: string): UpstreamRefs {
  const refsPath = join(rootDir, "upstream-refs.json");
  if (existsSync(refsPath)) {
    const raw = readFileSync(refsPath, "utf-8");
    return JSON.parse(raw) as UpstreamRefs;
  }

  // Fallback: synthesize from legacy single-upstream ref
  const legacy = loadUpstreamRef(rootDir);
  return {
    upstreams: {
      "knowledge-work-plugins": {
        repo: legacy.repo,
        origin: "anthropics/knowledge-work-plugins",
        commit: legacy.commit,
        syncedAt: legacy.syncedAt,
        type: "plugins",
        localPath: "../knowledge-work-plugins",
        pluginDir: "plugins",
      },
    },
    mcpServers: {},
    sdks: {},
    cloudProviders: {},
  };
}

/**
 * Scan a directory for plugin subdirectories.
 * Each subdirectory with a plugin.json or skills/ folder is treated as a plugin.
 */
export function scanPluginDir(
  dir: string,
  source: "upstream" | "jade",
  sourceId: string
): LoadedPlugin[] {
  if (!existsSync(dir)) return [];

  const plugins: LoadedPlugin[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (!statSync(fullPath).isDirectory()) continue;

    const manifestPath = join(fullPath, "plugin.json");
    // Also check .claude-plugin/plugin.json (jade convention)
    const claudeManifestPath = join(fullPath, ".claude-plugin", "plugin.json");

    let manifest: PluginManifest | null = null;
    if (existsSync(manifestPath)) {
      manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as PluginManifest;
    } else if (existsSync(claudeManifestPath)) {
      manifest = JSON.parse(readFileSync(claudeManifestPath, "utf-8")) as PluginManifest;
    }

    const skills = collectMarkdownFiles(join(fullPath, "skills"));
    const commands = collectMarkdownFiles(join(fullPath, "commands"));

    plugins.push({
      source,
      sourceId,
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
    .filter((f: string) => f.endsWith(".md"))
    .map((f: string) => join(dir, f));
}

/**
 * Scan all upstream plugin sources defined in upstream-refs.json.
 */
export function scanAllUpstreams(
  rootDir: string,
  refs: UpstreamRefs
): LoadedPlugin[] {
  const all: LoadedPlugin[] = [];

  for (const [id, entry] of Object.entries(refs.upstreams)) {
    if (entry.type !== "plugins") continue;
    if (!entry.localPath || !entry.pluginDir) continue;

    const dir = resolve(rootDir, entry.localPath, entry.pluginDir);
    const plugins = scanPluginDir(dir, "upstream", id);
    all.push(...plugins);
  }

  return all;
}

/**
 * Load both upstream and jade plugins, returning them for the resolver.
 * Now supports multi-upstream via upstream-refs.json.
 */
export function loadAll(rootDir: string): {
  upstreamRefs: UpstreamRefs;
  /** @deprecated Use upstreamRefs instead */
  upstreamRef: UpstreamRef;
  upstream: LoadedPlugin[];
  jade: LoadedPlugin[];
} {
  const upstreamRefs = loadUpstreamRefs(rootDir);
  const upstreamRef = loadUpstreamRef(rootDir);

  // Scan all upstream plugin sources
  const upstream = scanAllUpstreams(rootDir, upstreamRefs);

  // Jade extensions live in the extensions/ directory
  const jadeExtDir = join(rootDir, "extensions");
  const jadeExt = scanPluginDir(jadeExtDir, "jade", "jade-extensions");

  // Jade VP plugins live in the plugins/ directory
  const jadePluginDir = join(rootDir, "plugins");
  const jadePlugins = scanPluginDir(jadePluginDir, "jade", "jade-plugins");

  return {
    upstreamRefs,
    upstreamRef,
    upstream,
    jade: [...jadeExt, ...jadePlugins],
  };
}
